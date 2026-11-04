
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/authenticate";
import { getStudentByUserId } from "../../services/student/studentData.service";
import Attendance from "../../models/Attendance.model";
import Batch from "../../models/Batch.model";

const validYear = (value: unknown): number | undefined => {
  if (value === undefined || value === "all") return undefined;
  if (typeof value !== "string" || !/^\d{4}$/.test(value)) return -1;
  const year = Number(value);
  return year >= 2000 && year <= 9999 ? year : -1;
};

const validMonth = (value: unknown): number | undefined => {
  if (value === undefined || value === "all") return undefined;
  if (typeof value !== "string" || !/^(?:[1-9]|1[0-2])$/.test(value)) return -1;
  return Number(value);
};

// GET /api/student/attendance
export async function getStudentAttendance(
  request: AuthRequest,
  response: Response,
  next: NextFunction
) {
  try {
    const student = await getStudentByUserId(request.auth!.userId);

    if (!student) {
      response.status(404).json({ error: "Student record not found." });
      return;
    }

    const year = validYear(request.query.year);
    const month = validMonth(request.query.month);

    if (year === -1 || month === -1) {
      response.status(400).json({ error: "Choose a valid year and month." });
      return;
    }

    const page = Math.max(1, Number(request.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(request.query.limit) || 20));

    const studentId = student._id;

    const base: any[] = [
      { $match: { "records.studentId": studentId } },
      { $unwind: "$records" },
      { $match: { "records.studentId": studentId } },
    ];

    const filters: any[] = [...base];

    if (year) {
      filters.push({ $match: { date: { $regex: `^${year}-` } } });
    }

    if (month) {
      const monthText = String(month).padStart(2, "0");
      filters.push({
        $match: {
          date: {
            $regex: year
              ? `^${year}-${monthText}-`
              : `^\\d{4}-${monthText}-`,
          },
        },
      });
    }

    const [overall, filtered, total, records, monthly] = await Promise.all([
      Attendance.aggregate([
        ...base,
        { $group: { _id: "$records.status", count: { $sum: 1 } } },
      ]),
      Attendance.aggregate([
        ...filters,
        { $group: { _id: "$records.status", count: { $sum: 1 } } },
      ]),
      Attendance.aggregate([...filters, { $count: "count" }]),
      Attendance.aggregate([
        ...filters,
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
        { $unwind: { path: "$batch", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            date: 1,
            status: "$records.status",
            batch: { _id: "$batch._id", name: "$batch.name" },
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
        { $sort: { "_id.year": -1, "_id.month": -1 } },
      ]),
    ]);

    const getCounts = (items: any[]) => {
      const present = items.find((item) => item._id === "present")?.count ?? 0;
      const absent = items.find((item) => item._id === "absent")?.count ?? 0;
      const totalCount = present + absent;

      return {
        total: totalCount,
        present,
        absent,
        percentage: totalCount
          ? Number(((present / totalCount) * 100).toFixed(2))
          : null,
      };
    };

    const totalCount = total[0]?.count ?? 0;

    response.json({
      summary: getCounts(overall),
      filteredSummary: getCounts(filtered),
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
