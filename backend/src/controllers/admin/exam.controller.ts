
import type { Request, Response, NextFunction } from "express";
import { isValidObjectId, Types } from "mongoose";

import Batch from "../../models/Batch.model";
import Exam from "../../models/Exam.model";
import ExamResult from "../../models/ExamResult.model";
import Student from "../../models/Student.model";

import type { AuthRequest } from "../../middleware/authenticate";

const validDate = (date: unknown): date is string =>
  typeof date === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  !Number.isNaN(Date.parse(date + "T00:00:00Z")) &&
  new Date(date + "T00:00:00Z").toISOString().slice(0, 10) === date;

const validMarks = (value: unknown, max: number) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= max;

// GET /students/:studentId/history
export async function getStudentExamHistory(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const studentId = Array.isArray(request.params.studentId)
  ? request.params.studentId[0]
  : request.params.studentId;

    if (!isValidObjectId(studentId)) {
      response.status(400).json({
        error: "A valid student ID is required.",
      });
      return;
    }

    const page = Math.max(1, Number(request.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(request.query.limit) || 20));

    const student = await Student.findById(studentId)
      .select("studentId name")
      .lean();

    if (!student) {
      response.status(404).json({ error: "Student not found." });
      return;
    }

    const records = await ExamResult.find({
      studentId: new Types.ObjectId(studentId),
    })
      .sort({ createdAt: 1 })
      .populate({
        path: "examId",
        populate: {
          path: "batchId",
          select: "name startTime endTime",
        },
      })
      .lean();

    const results = records.flatMap((record: any) => {
      const exam = record.examId;

      if (!exam) return [];

      return [
        {
          examId: String(exam._id),
          examDate: exam.examDate,
          name: exam.name,
          subject: exam.subject,
          batch: exam.batchId,
          totalMarks: exam.totalMarks,
          obtainedMarks: record.obtainedMarks,
          percentage: Number(
            ((record.obtainedMarks / exam.totalMarks) * 100).toFixed(2)
          ),
        },
      ];
    });

    const subjectGroups = new Map<
      string,
      { obtained: number; possible: number; count: number }
    >();

    for (const item of results) {
      const stats = subjectGroups.get(item.subject) ?? {
        obtained: 0,
        possible: 0,
        count: 0,
      };

      stats.obtained += item.obtainedMarks;
      stats.possible += item.totalMarks;
      stats.count += 1;

      subjectGroups.set(item.subject, stats);
    }

    results.sort((left, right) =>
      right.examDate.localeCompare(left.examDate)
    );

    const percentages = results.map((item) => item.percentage);
    const totalObtained = results.reduce(
      (sum, item) => sum + item.obtainedMarks,
      0
    );
    const totalPossible = results.reduce(
      (sum, item) => sum + item.totalMarks,
      0
    );

    response.json({
      student,
      results: results.slice((page - 1) * limit, page * limit),
      pagination: {
        page,
        limit,
        total: results.length,
        totalPages: Math.max(1, Math.ceil(results.length / limit)),
      },
      summary: {
        examsTaken: results.length,
        totalObtained,
        totalPossible,
        overallAverage: totalPossible
          ? Number(((totalObtained / totalPossible) * 100).toFixed(2))
          : null,
        subjectAverages: Array.from(subjectGroups, ([subject, values]) => ({
          subject,
          average: Number(
            ((values.obtained / values.possible) * 100).toFixed(2)
          ),
          count: values.count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /
export async function getAllExams(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const year =
      typeof request.query.year === "string" &&
      /^\d{4}$/.test(request.query.year)
        ? Number(request.query.year)
        : undefined;

    const month =
      typeof request.query.month === "string" &&
      /^(?:[1-9]|1[0-2])$/.test(request.query.month)
        ? Number(request.query.month)
        : undefined;

    const batchId = request.query.batchId;

    const subject =
      typeof request.query.subject === "string"
        ? request.query.subject
        : "all";

    const query =
      typeof request.query.q === "string"
        ? request.query.q.trim().slice(0, 100)
        : "";

    const page = Math.max(1, Number(request.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(request.query.limit) || 20));

    const filter: Record<string, unknown> = {};

    if (year || month) {
      filter.examDate = {
        $regex: year
          ? month
            ? "^" + year + "-" + String(month).padStart(2, "0") + "-"
            : "^" + year + "-"
          : "^\\d{4}-" + String(month).padStart(2, "0") + "-",
      };
    }

    if (
      typeof batchId === "string" &&
      batchId !== "all" &&
      isValidObjectId(batchId)
    ) {
      filter.batchId = new Types.ObjectId(batchId);
    }

    if (subject !== "all") filter.subject = subject;

    if (query) {
      const safeQuery = query.replace(/[^a-zA-Z0-9 _-]/g, "");

      filter.$or = [
        { name: { $regex: safeQuery, $options: "i" } },
        { subject: { $regex: safeQuery, $options: "i" } },
      ];
    }

    const now = new Date();

    const [total, exams, subjects, monthCount, matchingExamIds] =
      await Promise.all([
        Exam.countDocuments(filter),

        Exam.find(filter)
          .sort({ examDate: -1, createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("batchId", "name startTime endTime active")
          .lean(),

        Exam.distinct("subject"),

        Exam.countDocuments({
          examDate: {
            $regex:
              "^" +
              now.getFullYear() +
              "-" +
              String(now.getMonth() + 1).padStart(2, "0") +
              "-",
          },
        }),

        Exam.distinct("_id", filter),
      ]);

    const examIds = exams.map((exam: any) => exam._id);

    const stats = examIds.length
      ? await ExamResult.aggregate([
          { $match: { examId: { $in: examIds } } },
          {
            $group: {
              _id: "$examId",
              count: { $sum: 1 },
              average: { $avg: "$obtainedMarks" },
            },
          },
        ])
      : [];

    const statById = new Map(
      stats.map((item: any) => [String(item._id), item])
    );

    const resultCounts = matchingExamIds.length
      ? await ExamResult.distinct("studentId", {
          examId: { $in: matchingExamIds },
        })
      : [];

    response.json({
      exams: exams.map((exam: any) => {
        const stat = statById.get(String(exam._id));
        const { batchId: batch, ...rest } = exam;

        return {
          ...rest,
          batch,
          studentsCount: exam.studentIds.length,
          resultsEntered: stat?.count ?? 0,
          averagePercentage: stat
            ? Number(((stat.average / exam.totalMarks) * 100).toFixed(2))
            : null,
        };
      }),

      summary: {
        totalExams: total,
        testsConductedThisMonth: monthCount,
        studentsEvaluated: resultCounts.length,
      },

      subjects,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

// POST /
export async function createExam(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const {
      examDate,
      name,
      batchId,
      subject,
      totalMarks,
    } = request.body as Record<string, unknown>;

    if (
      !validDate(examDate) ||
      !isValidObjectId(String(batchId ?? "")) ||
      typeof subject !== "string" ||
      !subject.trim() ||
      subject.trim().length > 80 ||
      (name !== undefined &&
        (typeof name !== "string" || name.trim().length > 120)) ||
      typeof totalMarks !== "number" ||
      !Number.isFinite(totalMarks) ||
      totalMarks <= 0
    ) {
      response.status(400).json({
        error: "Enter a valid exam date, batch, subject and positive total marks.",
      });
      return;
    }

    const batch = await Batch.findById(batchId);

    if (!batch) {
      response.status(404).json({ error: "Batch not found." });
      return;
    }

    if (!batch.active) {
      response.status(409).json({
        error: "Inactive batches cannot be selected for new exams.",
      });
      return;
    }

    const students = await Student.find({
      batchId: batch._id,
      active: true,
    })
      .select("_id")
      .sort({ name: 1 })
      .lean();

    const auth = (request as AuthRequest).auth!;

    const exam = await Exam.create({
      examDate,
      name: typeof name === "string" ? name.trim() : "",
      batchId: batch._id,
      subject: subject.trim(),
      totalMarks,
      studentIds: students.map((student) => student._id),
      createdBy: auth.userId,
    });

    await exam.populate("batchId", "name startTime endTime active");

    response.status(201).json({
      exam: {
        ...exam.toObject(),
        batch: exam.batchId,
        studentsCount: students.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /:examId
export async function getExamById(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const { examId } = request.params;

    if (!isValidObjectId(examId)) {
      response.status(400).json({
        error: "A valid exam ID is required.",
      });
      return;
    }

    const exam: any = await Exam.findById(examId)
      .populate("batchId", "name startTime endTime active")
      .lean();

    if (!exam) {
      response.status(404).json({ error: "Exam not found." });
      return;
    }

     const students = await Student.find({
  _id: { $in: exam.studentIds },
})
  .select("studentId name className active profilePhoto")
  .sort({ name: 1 })
  .lean();

    const marks = await ExamResult.find({ examId }).lean();

    const byStudent = new Map(
      marks.map((item: any) => [
        String(item.studentId),
        item.obtainedMarks,
      ])
    );

    const results = students.map((student: any) => {
      const obtainedMarks = byStudent.has(String(student._id))
        ? (byStudent.get(String(student._id)) as number)
        : null;

      return {
        student,
        obtainedMarks,
        percentage:
          obtainedMarks === null
            ? null
            : Number(
                ((obtainedMarks / exam.totalMarks) * 100).toFixed(2)
              ),
        saveStatus: obtainedMarks === null ? "Not Entered" : "Saved",
      };
    });

    const entered = results.filter(
      (item) => item.obtainedMarks !== null
    );

    const percentages = entered.map(
      (item) => item.percentage as number
    );

    const marksValues = entered.map(
      (item) => item.obtainedMarks as number
    );

    const { batchId: batch, ...rest } = exam;

    response.json({
      exam: { ...rest, batch },
      results,
      summary: {
        studentsCount: results.length,
        entered: entered.length,
        pending: results.length - entered.length,
        averagePercentage: percentages.length
          ? Number(
              (
                percentages.reduce((a, b) => a + b, 0) /
                percentages.length
              ).toFixed(2)
            )
          : null,
        highestMarks: marksValues.length
          ? Math.max(...marksValues)
          : null,
        lowestMarks: marksValues.length
          ? Math.min(...marksValues)
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

// PUT /:examId/results
export async function saveExamResults(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const { examId } = request.params;
    const { results } = request.body as { results?: unknown };

    if (!isValidObjectId(examId) || !Array.isArray(results)) {
      response.status(400).json({
        error: "A valid exam ID and results array are required.",
      });
      return;
    }

    const exam: any = await Exam.findById(examId).lean();

    if (!exam) {
      response.status(404).json({ error: "Exam not found." });
      return;
    }

    if (
      results.some(
        (item: any) =>
          !item ||
          !isValidObjectId(String(item.studentId ?? "")) ||
          !(
            item.obtainedMarks === null ||
            validMarks(item.obtainedMarks, exam.totalMarks)
          )
      )
    ) {
      response.status(400).json({
        error:
          "Each mark must be blank or between 0 and " +
          exam.totalMarks +
          ".",
      });
      return;
    }

    const ids = results.map((item: any) => String(item.studentId));

    if (
      new Set(ids).size !== ids.length ||
      ids.length !== exam.studentIds.length ||
      exam.studentIds.some(
        (id: Types.ObjectId) => !ids.includes(String(id))
      )
    ) {
      response.status(400).json({
        error:
          "Submit exactly one marks entry for every student assigned to this exam.",
      });
      return;
    }

    const auth = (request as AuthRequest).auth!;

    const operations = (
      results as {
        studentId: string;
        obtainedMarks: number | null;
      }[]
    ).map((item) =>
      item.obtainedMarks === null
        ? {
            deleteOne: {
              filter: {
                examId: exam._id,
                studentId: new Types.ObjectId(item.studentId),
              },
            },
          }
        : {
            updateOne: {
              filter: {
                examId: exam._id,
                studentId: new Types.ObjectId(item.studentId),
              },
              update: {
                $set: {
                  obtainedMarks: item.obtainedMarks,
                  updatedBy: auth.userId,
                },
              },
              upsert: true,
            },
          }
    );

    if (operations.length) {
      await ExamResult.bulkWrite(operations, { ordered: true });
    }

    response.json({ message: "Marks saved successfully." });
  } catch (error) {
    next(error);
  }
}

// DELETE /:examId
export async function deleteExam(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const { examId } = request.params;

    if (!isValidObjectId(examId)) {
      response.status(400).json({
        error: "A valid exam ID is required.",
      });
      return;
    }

    const exam = await Exam.findByIdAndDelete(examId);

    if (!exam) {
      response.status(404).json({ error: "Exam not found." });
      return;
    }

    await ExamResult.deleteMany({ examId: exam._id });

    response.json({
      message: "Exam and its associated results were deleted.",
    });
  } catch (error) {
    next(error);
  }
}
