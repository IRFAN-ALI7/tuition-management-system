import type { Request, Response, NextFunction } from "express";
import { isValidObjectId, Types } from "mongoose";

import Attendance from "../../models/Attendance.model";
import Batch from "../../models/Batch.model";
import Student from "../../models/Student.model";

import type { AuthRequest } from "../../middleware/authenticate";

const validDate = (date: unknown): date is string =>
  typeof date === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) &&
  new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;

// GET /history/:studentId
export async function getStudentAttendanceHistory(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const studentId = Array.isArray(request.params.studentId)
      ? request.params.studentId[0]
      : request.params.studentId;

    if (typeof studentId !== "string" || !isValidObjectId(studentId)) {
      response.status(400).json({ error: "Invalid student ID." });
      return;
    }

    if (!(await Student.exists({ _id: studentId }))) {
      response.status(404).json({ error: "Student not found." });
      return;
    }

    const yearRaw = request.query.year;
    const monthRaw = request.query.month;

    const year =
      typeof yearRaw === "string" && /^\d{4}$/.test(yearRaw)
        ? Number(yearRaw)
        : undefined;

    const month =
      typeof monthRaw === "string" && /^(?:[1-9]|1[0-2])$/.test(monthRaw)
        ? Number(monthRaw)
        : undefined;

    if (yearRaw !== undefined && yearRaw !== "all" && year === undefined) {
      response.status(400).json({ error: "Choose a valid year." });
      return;
    }

    if (monthRaw !== undefined && monthRaw !== "all" && month === undefined) {
      response.status(400).json({ error: "Choose a valid month." });
      return;
    }

    const page = Math.max(1, Number(request.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(request.query.limit) || 20));

    const studentObjectId = new Types.ObjectId(studentId);

    const base: any[] = [
      { $match: { "records.studentId": studentObjectId } },
      { $unwind: "$records" },
      { $match: { "records.studentId": studentObjectId } },
    ];

    const filtered = [...base];

    if (year) {
      filtered.push({ $match: { date: { $regex: "^" + year + "-" } } });
    }

    if (month) {
      filtered.push({
        $match: {
          date: {
            $regex: year
              ? "^" + year + "-" + String(month).padStart(2, "0") + "-"
              : "^\\d{4}-" + String(month).padStart(2, "0") + "-",
          },
        },
      });
    }

    const [overall, filteredSummary, total, records, monthly] =
      await Promise.all([
        Attendance.aggregate([
          ...base,
          { $group: { _id: "$records.status", count: { $sum: 1 } } },
        ]),

        Attendance.aggregate([
          ...filtered,
          { $group: { _id: "$records.status", count: { $sum: 1 } } },
        ]),

        Attendance.aggregate([...filtered, { $count: "count" }]),

        Attendance.aggregate([
          ...filtered,
          { $sort: { date: -1, _id: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $lookup: {
              from: "batches",
              localField: "batchId",
              foreignField: "_id",
              as: "batch",
            },
          },
          {
            $unwind: {
              path: "$batch",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              date: 1,
              status: "$records.status",
              batch: {
                _id: "$batch._id",
                name: "$batch.name",
              },
            },
          },
        ]),

        Attendance.aggregate([
          ...base,
          {
            $group: {
              _id: {
                year: { $substrBytes: ["$date", 0, 4] },
                month: { $substrBytes: ["$date", 5, 2] },
                status: "$records.status",
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]),
      ]);

    const counts = (items: { _id: string; count: number }[]) => ({
      present: items.find((item) => item._id === "present")?.count ?? 0,
      absent: items.find((item) => item._id === "absent")?.count ?? 0,
    });

    const allCounts = counts(overall);
    const shownCounts = counts(filteredSummary);
    const totalCount = total[0]?.count ?? 0;

    response.json({
      summary: {
        total: allCounts.present + allCounts.absent,
        present: allCounts.present,
        absent: allCounts.absent,
        percentage:
          allCounts.present + allCounts.absent
            ? Number(
                (
                  (allCounts.present /
                    (allCounts.present + allCounts.absent)) *
                  100
                ).toFixed(2)
              )
            : null,
      },

      filteredSummary: {
        total: shownCounts.present + shownCounts.absent,
        present: shownCounts.present,
        absent: shownCounts.absent,
        percentage:
          shownCounts.present + shownCounts.absent
            ? Number(
                (
                  (shownCounts.present /
                    (shownCounts.present + shownCounts.absent)) *
                  100
                ).toFixed(2)
              )
            : null,
      },

      monthlySummary: monthly.map((item) => ({
        year: Number(item._id.year),
        month: Number(item._id.month),
        status: item._id.status,
        count: item.count,
      })),

      records,

      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /:batchId
export async function getBatchAttendance(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const batchId = Array.isArray(request.params.batchId)
      ? request.params.batchId[0]
      : request.params.batchId;

    const date = request.query.date;

    if (
      typeof batchId !== "string" ||
      !isValidObjectId(batchId) ||
      !validDate(date)
    ) {
      response.status(400).json({
        error: "A valid batch ID and date (YYYY-MM-DD) are required.",
      });
      return;
    }

    const batch = await Batch.findById(batchId).lean();

    if (!batch) {
      response.status(404).json({ error: "Batch not found." });
      return;
    }

    const [record, students] = await Promise.all([
      Attendance.findOne({ batchId, date }).lean(),

      Student.find({ batchId, active: true })
        .select(
          "studentId name phone fatherName className batchId active profilePhoto"
        )
        .sort({ name: 1 })
        .lean(),
    ]);

    const savedStatuses = new Map(
      (((record as any)?.records ?? []) as any[]).map((entry) => [
        String(entry.studentId),
        entry.status,
      ])
    );

    response.json({
      batch,
      attendance: {
        date,
        saved: Boolean(record),
        records: students.map((student) => ({
          student,
          status: savedStatuses.get(String(student._id)) ?? "present",
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

// POST /
export async function saveAttendance(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const {
      batchId,
      date,
      records,
    } = request.body as {
      batchId?: unknown;
      date?: unknown;
      records?: unknown;
    };

    if (
      typeof batchId !== "string" ||
      !isValidObjectId(batchId) ||
      !validDate(date) ||
      !Array.isArray(records) ||
      !records.length
    ) {
      response.status(400).json({
        error: "Batch, date and at least one attendance entry are required.",
      });
      return;
    }

    if (
      records.some(
        (record) =>
          !record ||
          typeof record !== "object" ||
          !isValidObjectId(
            (record as { studentId?: string }).studentId ?? ""
          ) ||
          !["present", "absent"].includes(
            String((record as { status?: string }).status)
          )
      )
    ) {
      response.status(400).json({
        error:
          "Every entry must include a valid student ID and present/absent status.",
      });
      return;
    }

    const normalized = records as {
      studentId: string;
      status: "present" | "absent";
    }[];

    const ids = normalized.map((record) => record.studentId);

    if (new Set(ids).size !== ids.length) {
      response.status(400).json({
        error: "Duplicate student entries are not allowed.",
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
        error:
          "This batch is inactive. Existing attendance history is available, but new attendance cannot be recorded.",
      });
      return;
    }

    const assigned = await Student.find({
      batchId,
      active: true,
    })
      .select("_id")
      .lean();

    if (
      assigned.length !== ids.length ||
      assigned.some((student) => !ids.includes(String(student._id)))
    ) {
      response.status(409).json({
        error:
          "Attendance must include every active student currently assigned to this batch.",
      });
      return;
    }

    const auth = (request as AuthRequest).auth!;

    const attendance = await Attendance.findOneAndUpdate(
      { batchId, date },
      {
        $set: {
          records: normalized,
          savedBy: auth.userId,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).populate("records.studentId", "name phone fatherName");

    response.json({
      attendance: {
        date,
        saved: true,
        records: attendance.records.map((entry: any) => ({
          student: entry.studentId,
          status: entry.status,
        })),
      },
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      response.status(409).json({
        error:
          "Attendance for this batch and date was saved at the same time. Reload the record before making changes.",
      });
      return;
    }

    next(error);
  }
}