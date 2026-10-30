import { Router } from "express";
import { isValidObjectId, Types } from "mongoose";

import Student from "../models/Student.model";
import Batch from "../models/Batch.model";
import Counter from "../models/Counter.model";

import { normalizePhone, normalizeText } from "../utils/normalization";

const router = Router();

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

router.get("/", async (request, response, next) => {
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
      const escaped = normalizeText(q).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const normalizedPhone = normalizePhone(q);

      match.$or = [
        { nameKey: { $regex: escaped, $options: "i" } },
        { studentId: { $regex: escaped, $options: "i" } },
        ...(normalizedPhone
          ? [
              {
                phoneKey: {
                  $regex: normalizedPhone.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                  ),
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
});

router.get("/:id", async (request, response, next) => {
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
});

router.post("/", async (request, response, next) => {
  try {
    const body = request.body as Record<string, unknown>;

    const { name, phone } = body;

    const fatherName =
      typeof body.fatherName === "string"
        ? body.fatherName
        : "";

    const address =
      typeof body.address === "string"
        ? body.address.trim().replace(/\s+/g, " ")
        : "";

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
      typeof body.gender === "string"
        ? body.gender
        : "";

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
        error:
          "Student name and a valid 10 digit phone number are required.",
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
      (gender &&
        !["Male", "Female", "Other"].includes(gender)) ||
      profilePhoto.length > 700_000 ||
      (profilePhoto &&
        !/^data:image\/(png|jpeg|webp);base64,/.test(
          profilePhoto
        ))
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

    const cleanFather = fatherName
      .trim()
      .replace(/\s+/g, " ");

    const identity = {
      nameKey: normalizeText(cleanName),
      phoneKey: normalizePhone(phone),
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

    // Automatically generate a unique 4-character Student ID.
    const studentId = await generateStudentId();

    const student = await Student.create({
      studentId,
      name: cleanName,
      phone: phone.trim(),
      fatherName: cleanFather,
      ...identity,
      address,
      gender,
      className,
      admissionDate,
      monthlyFees,
      profilePhoto,
      batchId,
      active: body.active !== false,
    });

    response.status(201).json({ student });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      response.status(409).json({
        error:
          "This student already exists. Select the existing student instead of creating a duplicate.",
      });
      return;
    }

    next(error);
  }
});

router.patch("/:id", async (request, response, next) => {
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

    const student = await Student.findByIdAndUpdate(
      current._id,
      updates,
      { new: true, runValidators: true }
    ).populate("batchId", "name startTime endTime active");

    response.json({ student });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/active", async (request, response, next) => {
  try {
    const active = (request.body as { active?: unknown }).active;

    if (typeof active !== "boolean") {
      response.status(400).json({
        error: "active must be true or false.",
      });
      return;
    }

    const student = await Student.findByIdAndUpdate(
      request.params.id,
      { active },
      { new: true }
    );

    if (!student) {
      response.status(404).json({
        error: "Student not found.",
      });
      return;
    }

    response.json({ student });
  } catch (error) {
    next(error);
  }
});

export default router;