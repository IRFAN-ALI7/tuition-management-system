
import type { Request, Response, NextFunction } from "express";
import mongoose, { isValidObjectId, Types } from "mongoose";
import bcrypt from "bcryptjs";

import User from "../../models/User.model";
import Student from "../../models/Student.model";
import Batch from "../../models/Batch.model";
import Counter from "../../models/Counter.model";
import Attendance from "../../models/Attendance.model";
import FeePayment from "../../models/FeePayment.model";
import FeeLedger from "../../models/FeeLedger.model";
import ExamResult from "../../models/ExamResult.model";
import Exam from "../../models/Exam.model";
import Notice from "../../models/Notice.model";

import { normalizePhone, normalizeText } from "../../utils/normalization";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Generate unique student ID: AA00, AA01, AA02...
async function generateStudentId(): Promise<string> {
  const counter = await Counter.findOneAndUpdate(
    { _id: "studentId" },
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: false,
    }
  );

  const index = counter.seq - 1;

  if (index < 0 || index >= 67600) {
    throw new Error("Student ID limit reached.");
  }

  const firstLetter = String.fromCharCode(
    65 + Math.floor(index / 2600)
  );

  const secondLetter = String.fromCharCode(
    65 + Math.floor((index % 2600) / 100)
  );

  const digits = String(index % 100).padStart(2, "0");

  return `${firstLetter}${secondLetter}${digits}`;
}


// GET ALL STUDENTS
export async function getAllStudents(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const requestedPage = Number.parseInt(
      String(request.query.page ?? "1"),
      10
    );

    const requestedLimit = Number.parseInt(
      String(request.query.limit ?? "20"),
      10
    );

    const page = Number.isFinite(requestedPage)
      ? Math.max(1, requestedPage)
      : 1;

    const limit = [20, 50, 100].includes(requestedLimit)
      ? requestedLimit
      : 20;

    const q =
      typeof request.query.q === "string"
        ? request.query.q.trim()
        : "";

    const className =
      typeof request.query.className === "string"
        ? request.query.className.trim()
        : "";

    const batchId =
      typeof request.query.batchId === "string"
        ? request.query.batchId.trim()
        : "";

    const status =
      typeof request.query.status === "string"
        ? request.query.status
        : "";

    if (
      batchId &&
      batchId !== "all" &&
      !isValidObjectId(batchId)
    ) {
      response.status(400).json({ error: "Invalid batch filter." });
      return;
    }

    if (
      status &&
      status !== "all" &&
      status !== "active" &&
      status !== "inactive"
    ) {
      response.status(400).json({
        error: "Status must be active or inactive.",
      });
      return;
    }

    const match: Record<string, unknown> = {};

    if (className && className !== "all") {
      match.className = className;
    }

    if (batchId && batchId !== "all") {
      match.batchId = batchId;
    }

    if (status === "active") match.active = true;
    if (status === "inactive") match.active = false;

    if (q) {
      const escaped = escapeRegex(normalizeText(q));
      const normalizedPhone = normalizePhone(q);

      match.$or = [
        { nameKey: { $regex: escaped, $options: "i" } },
        { studentId: { $regex: escaped, $options: "i" } },
        ...(normalizedPhone
          ? [
              {
                phoneKey: {
                  $regex: escapeRegex(normalizedPhone),
                },
              },
            ]
          : []),
      ];
    }

    const includeAll = request.query.all === "true";

    const [
      students,
      total,
      totalStudents,
      activeStudents,
      inactiveStudents,
      totalBatches,
      classValues,
      growthRows,
    ] = await Promise.all([
      Student.find(includeAll ? {} : match)
        .populate("batchId", "name startTime endTime active")
        .sort({ createdAt: -1, _id: -1 })
        .skip(includeAll ? 0 : (page - 1) * limit)
        .limit(includeAll ? 0 : limit)
        .lean(),

      Student.countDocuments(includeAll ? {} : match),

      Student.countDocuments(),

      Student.countDocuments({ active: true }),

      Student.countDocuments({ active: false }),

      Batch.countDocuments(),

      Student.distinct("className", {
        className: { $nin: ["", null] },
      }),

      Student.aggregate([
        {
          $addFields: {
            _admissionDate: {
              $cond: [
                {
                  $regexMatch: {
                    input: { $ifNull: ["$admissionDate", ""] },
                    regex: /^\d{4}-\d{2}-\d{2}$/,
                  },
                },
                {
                  $dateFromString: {
                    dateString: "$admissionDate",
                    onError: null,
                  },
                },
                "$createdAt",
              ],
            },
          },
        },
        {
          $match: {
            _admissionDate: { $type: "date" },
          },
        },
        {
          $project: {
            month: {
              $dateToString: {
                format: "%Y-%m",
                date: "$_admissionDate",
              },
            },
          },
        },
        {
          $group: {
            _id: "$month",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    response.json({
      students,

      pagination: {
        page: includeAll ? 1 : page,
        limit: includeAll ? total : limit,
        total,
        totalPages: includeAll
          ? 1
          : Math.max(1, Math.ceil(total / limit)),
      },

      summary: {
        total: totalStudents,
        active: activeStudents,
        inactive: inactiveStudents,
        totalBatches,
        growth: Object.fromEntries(
          growthRows.map(
            (row: { _id: string; count: number }) => [
              row._id,
              row.count,
            ]
          )
        ),
      },

      classes: classValues
        .filter(
          (value): value is string =>
            typeof value === "string" && value.length > 0
        )
        .sort(),
    });
  } catch (error) {
    next(error);
  }
}

// GET SINGLE STUDENT
export async function getStudentById(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    if (!isValidObjectId(request.params.id)) {
      response.status(400).json({ error: "Invalid student ID." });
      return;
    }

    const student = await Student.findById(request.params.id)
      .populate("batchId", "name startTime endTime active")
      .lean();

    if (!student) {
      response.status(404).json({ error: "Student not found." });
      return;
    }

    response.json({ student });
  } catch (error) {
    next(error);
  }
}


// CREATE STUDENT
export async function createStudent(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const body = request.body as Record<string, unknown>;

    const { name, phone } = body;

    const fatherName =
      typeof body.fatherName === "string" ? body.fatherName : "";

    const address =
      typeof body.address === "string"
        ? body.address.trim().replace(/\s+/g, " ")
        : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    const feeProvided =
      typeof body.monthlyFees === "number" ||
      (typeof body.monthlyFees === "string" &&
        body.monthlyFees.trim() !== "");

    const monthlyFees =
      typeof body.monthlyFees === "number"
        ? body.monthlyFees
        : Number(body.monthlyFees);

    const admissionDate =
      typeof body.admissionDate === "string"
        ? body.admissionDate
        : "";

    const gender =
      typeof body.gender === "string" ? body.gender : "";

    const className =
      typeof body.className === "string"
        ? body.className.trim()
        : "";

    const profilePhoto =
      typeof body.profilePhoto === "string"
        ? body.profilePhoto
        : "";

    const batchId =
      typeof body.batchId === "string" && body.batchId
        ? body.batchId
        : null;

    if (
      typeof name !== "string" ||
      typeof phone !== "string" ||
      !name.trim() ||
      normalizePhone(phone).length < 10
    ) {
      response.status(400).json({
        error: "Student name and a valid 10 digit phone number are required.",
      });
      return;
    }

    if (password.length < 8) {
      response.status(400).json({
        error: "Initial password must be at least 8 characters long.",
      });
      return;
    }

    if (
      body.active !== undefined &&
      typeof body.active !== "boolean"
    ) {
      response.status(400).json({
        error: "Student status must be Active or Inactive.",
      });
      return;
    }

    const parsedAdmissionDate =
      /^\d{4}-\d{2}-\d{2}$/.test(admissionDate)
        ? new Date(`${admissionDate}T00:00:00Z`)
        : null;

    const validAdmissionDate =
      parsedAdmissionDate &&
      !Number.isNaN(parsedAdmissionDate.valueOf()) &&
      parsedAdmissionDate.toISOString().slice(0, 10) ===
        admissionDate;

    if (
      !address ||
      !feeProvided ||
      !Number.isFinite(monthlyFees) ||
      monthlyFees < 0 ||
      !validAdmissionDate ||
      (gender && !["Male", "Female", "Other"].includes(gender)) ||
      profilePhoto.length > 700_000 ||
      (profilePhoto &&
        !/^data:image\/(png|jpeg|webp);base64,/.test(profilePhoto))
    ) {
      response.status(400).json({
        error:
          "Enter a valid address, admission date, monthly fee, gender, and image.",
      });
      return;
    }

    if (batchId && !Types.ObjectId.isValid(batchId)) {
      response.status(400).json({
        error: "Choose a valid batch.",
      });
      return;
    }

    if (
      batchId &&
      !(await Batch.exists({ _id: batchId, active: true }))
    ) {
      response.status(400).json({
        error:
          "Choose an active batch. Inactive batches cannot receive new students.",
      });
      return;
    }

    const cleanName = name.trim().replace(/\s+/g, " ");
    const cleanFather = fatherName.trim().replace(/\s+/g, " ");
    const cleanPhone = phone.trim();

    const identity = {
      nameKey: normalizeText(cleanName),
      phoneKey: normalizePhone(cleanPhone),
      fatherNameKey: normalizeText(cleanFather),
    };

    const existing = await Student.findOne(identity).lean();

    if (existing) {
      response.status(409).json({
        error:
          "This student already exists. Select the existing student instead of creating a duplicate.",
        existingStudent: existing,
      });
      return;
    }

    const existingUser = await User.findOne({
      mobile: cleanPhone,
      role: "student",
    }).lean();

    if (existingUser) {
      response.status(409).json({
        error:
          "A student login account already exists with this mobile number.",
      });
      return;
    }

    const studentId = await generateStudentId();
    const studentActive = body.active !== false;
    const passwordHash = await bcrypt.hash(password, 12);

    // Create Student profile first.
    const student = await Student.create({
      studentId,
      name: cleanName,
      phone: cleanPhone,
      fatherName: cleanFather,
      ...identity,
      address,
      gender,
      className,
      admissionDate,
      monthlyFees,
      profilePhoto,
      batchId,
      active: studentActive,
    });

    try {
      // Create linked login account.
      await User.create({
        name: cleanName,
        mobile: cleanPhone,
        passwordHash,
        role: "student",
        studentId: student._id,
        active: studentActive,
        mustChangePassword: false,
      });
    } catch (userError) {
      // Remove Student if User creation fails.
      await Student.deleteOne({ _id: student._id });
      throw userError;
    }

    response.status(201).json({
      message: "Student profile and login account created successfully.",
      student,
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      response.status(409).json({
        error:
          "A student or login account already exists with these details.",
      });
      return;
    }

    next(error);
  }
}


// UPDATE STUDENT PROFILE
export async function updateStudent(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    if (!isValidObjectId(request.params.id)) {
      response.status(400).json({
        error: "Invalid student ID.",
      });
      return;
    }

    const body = request.body as Record<string, unknown>;

    const current = await Student.findById(request.params.id);

    if (!current) {
      response.status(404).json({
        error: "Student not found.",
      });
      return;
    }

    const name =
      typeof body.name === "string"
        ? body.name.trim().replace(/\s+/g, " ")
        : current.name;

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : current.phone;

    const fatherName =
      typeof body.fatherName === "string"
        ? body.fatherName.trim().replace(/\s+/g, " ")
        : current.fatherName;

    if (!name || normalizePhone(phone).length < 10) {
      response.status(400).json({
        error:
          "Student name and a valid 10 digit phone number are required.",
      });
      return;
    }

    const identity = {
      nameKey: normalizeText(name),
      phoneKey: normalizePhone(phone),
      fatherNameKey: normalizeText(fatherName),
    };

    const duplicate = await Student.findOne({
      ...identity,
      _id: { $ne: current._id },
    }).lean();

    if (duplicate) {
      response.status(409).json({
        error:
          "Another student already has this name, phone number and father's name combination.",
        existingStudent: duplicate,
      });
      return;
    }

    const updates: Record<string, unknown> = {
      name,
      phone,
      fatherName,
      ...identity,
    };

    if (body.gender !== undefined) {
      if (
        typeof body.gender !== "string" ||
        !["", "Male", "Female", "Other"].includes(body.gender)
      ) {
        response.status(400).json({
          error: "Choose a valid gender.",
        });
        return;
      }

      updates.gender = body.gender;
    }

    if (body.address !== undefined) {
      if (
        typeof body.address !== "string" ||
        !body.address.trim()
      ) {
        response.status(400).json({
          error: "Address is required.",
        });
        return;
      }

      updates.address = body.address.trim().replace(/\s+/g, " ");
    }

    if (body.className !== undefined) {
      if (typeof body.className !== "string") {
        response.status(400).json({
          error: "Class is invalid.",
        });
        return;
      }

      updates.className = body.className.trim();
    }

    if (body.monthlyFees !== undefined) {
      const monthlyFees = Number(body.monthlyFees);

      if (!Number.isFinite(monthlyFees) || monthlyFees < 0) {
        response.status(400).json({
          error: "Monthly fees must be zero or more.",
        });
        return;
      }

      updates.monthlyFees = monthlyFees;
    }

    if (body.admissionDate !== undefined) {
      const date =
        typeof body.admissionDate === "string"
          ? body.admissionDate
          : "";

      const parsedDate =
        /^\d{4}-\d{2}-\d{2}$/.test(date)
          ? new Date(`${date}T00:00:00Z`)
          : null;

      if (
        !parsedDate ||
        Number.isNaN(parsedDate.valueOf()) ||
        parsedDate.toISOString().slice(0, 10) !== date
      ) {
        response.status(400).json({
          error: "Admission date is invalid.",
        });
        return;
      }

      updates.admissionDate = date;
    }

    if (body.profilePhoto !== undefined) {
      if (
        typeof body.profilePhoto !== "string" ||
        body.profilePhoto.length > 700_000 ||
        (body.profilePhoto &&
          !/^data:image\/(png|jpeg|webp);base64,/.test(
            body.profilePhoto
          ))
      ) {
        response.status(400).json({
          error: "Profile photo is invalid or too large.",
        });
        return;
      }

      updates.profilePhoto = body.profilePhoto;
    }

    if (body.batchId !== undefined) {
      const batchId =
        typeof body.batchId === "string"
          ? body.batchId.trim()
          : "";

      if (batchId && !isValidObjectId(batchId)) {
        response.status(400).json({
          error: "Choose a valid batch.",
        });
        return;
      }

      const retainingCurrentBatch =
        batchId &&
        current.batchId &&
        String(current.batchId) === batchId;

      if (
        batchId &&
        !(await Batch.exists({
          _id: batchId,
          ...(retainingCurrentBatch ? {} : { active: true }),
        }))
      ) {
        response.status(400).json({
          error: "Students can only be moved to an active batch.",
        });
        return;
      }

      updates.batchId = batchId || null;
    }

    // Keep the linked student login account in sync with profile changes.
    const linkedUser = await User.findOne({
      studentId: current._id,
      role: "student",
    });

    if (linkedUser) {
      const duplicateUser = await User.findOne({
        mobile: phone,
        role: "student",
        _id: { $ne: linkedUser._id },
      }).lean();

      if (duplicateUser) {
        response.status(409).json({
          error:
            "Another student login account already uses this mobile number.",
        });
        return;
      }
    }

    const student = await Student.findByIdAndUpdate(
      current._id,
      updates,
      { new: true, runValidators: true }
    ).populate("batchId", "name startTime endTime active");

    if (linkedUser) {
      linkedUser.name = name;
      linkedUser.mobile = phone;
      await linkedUser.save();
    }

    response.json({ student });
  } catch (error) {
    next(error);
  }
}

// DELETE STUDENT
// FeePayment and FeeLedger records are never permanently deleted here.
export async function deleteStudent(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const session = await mongoose.startSession();

  try {
    if (!isValidObjectId(request.params.id)) {
      response.status(400).json({ error: "Invalid student ID." });
      return;
    }

    const studentIdParam = Array.isArray(request.params.id)
       ? request.params.id[0]
      : request.params.id;

        const studentObjectId = new Types.ObjectId(studentIdParam);

    let studentFound = false;
    let hasFinancialHistory = false;
    let deletedStudentId: string | undefined;

    await session.withTransaction(async () => {
      const student = await Student.findById(studentObjectId)
        .session(session)
        .lean();

      if (!student) return;

      studentFound = true;
      deletedStudentId = student.studentId;

      const [paymentCount, ledgerCount] = await Promise.all([
        FeePayment.countDocuments({
          studentId: studentObjectId,
        }).session(session),

        FeeLedger.countDocuments({
          studentId: studentObjectId,
        }).session(session),
      ]);

      if (paymentCount > 0 || ledgerCount > 0) {
        hasFinancialHistory = true;
        return;
      }

      await Attendance.updateMany(
        { "records.studentId": studentObjectId },
        {
          $pull: {
            records: { studentId: studentObjectId },
          },
        },
        { session }
      );

      await ExamResult.deleteMany({
        studentId: studentObjectId,
      }).session(session);

      await Exam.updateMany(
        { studentIds: studentObjectId },
        {
          $pull: {
            studentIds: studentObjectId,
          },
        },
        { session }
      );

      await Notice.deleteMany({
        recipientType: "SINGLE_STUDENT",
        studentId: studentObjectId,
      }).session(session);

      await User.deleteOne({
        studentId: studentObjectId,
        role: "student",
      }).session(session);

      await Student.deleteOne({
        _id: studentObjectId,
      }).session(session);
    });

    if (!studentFound) {
      response.status(404).json({
        error: "Student not found.",
      });
      return;
    }

    if (hasFinancialHistory) {
      response.status(409).json({
        error:
          "This student has fee/payment history and cannot be deleted. Deactivate the student account instead.",
      });
      return;
    }

    response.json({
      message: "Student deleted successfully.",
      studentId: deletedStudentId,
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
}

// ADMIN RESET STUDENT PASSWORD
export async function resetStudentPassword(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    if (!isValidObjectId(request.params.id)) {
      response.status(400).json({
        error: "Invalid student ID.",
      });
      return;
    }

    const body = request.body as { password?: unknown };

    const password =
      typeof body.password === "string" ? body.password : "";

    if (password.length < 8 || password.length > 128) {
      response.status(400).json({
        error: "Password must be between 8 and 128 characters.",
      });
      return;
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
      response.status(400).json({
        error: "Password must not exceed 72 UTF-8 bytes.",
      });
      return;
    }

    const student = await Student.findById(request.params.id);

    if (!student) {
      response.status(404).json({
        error: "Student not found.",
      });
      return;
    }

    const user = await User.findOne({
      studentId: student._id,
      role: "student",
    });

    if (!user) {
      response.status(404).json({
        error: "Student login account not found.",
      });
      return;
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.mustChangePassword = false;
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;

    await user.save();

    response.json({
      message: "Student password reset successfully.",
    });
  } catch (error) {
    next(error);
  }
}

// ACTIVATE / DEACTIVATE STUDENT
export async function updateStudentActiveStatus(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const session = await mongoose.startSession();

  try {
    if (!isValidObjectId(request.params.id)) {
      response.status(400).json({
        error: "Invalid student ID.",
      });
      return;
    }

    const active = (request.body as { active?: unknown }).active;

    if (typeof active !== "boolean") {
      response.status(400).json({
        error: "active must be true or false.",
      });
      return;
    }

    let updatedStudent = null;

    await session.withTransaction(async () => {
      const student = await Student.findById(request.params.id).session(
        session
      );

      if (!student) {
        return;
      }

      // Update linked student login account.
      const user = await User.findOne({
        studentId: student._id,
        role: "student",
      }).session(session);

      if (user) {
        user.active = active;

        // Invalidate all existing sessions.
        user.sessionVersion += 1;

        await user.save({ session });
      }

      // Update student profile status.
      student.active = active;

      await student.save({ session });

      updatedStudent = student;
    });

    if (!updatedStudent) {
      response.status(404).json({
        error: "Student not found.",
      });
      return;
    }

    response.json({
      message: active
        ? "Student account activated successfully."
        : "Student account deactivated successfully.",

      student: updatedStudent,
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
}
