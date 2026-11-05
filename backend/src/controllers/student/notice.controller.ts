
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/authenticate";

import { getStudentByUserId } from "../../services/student/studentData.service";
import Notice from "../../models/Notice.model";

// GET /api/student/notices
export async function getStudentNotices(
  request: AuthRequest,
  response: Response,
  next: NextFunction
) {
  try {
    const student = await getStudentByUserId(request.auth!.userId);

    if (!student) {
      response.status(404).json({
        error: "Student record not found.",
      });
      return;
    }

    const page = Math.max(1, Number(request.query.page) || 1);
    const limit = 10;

    const audience =
      typeof request.query.audience === "string"
        ? request.query.audience
        : "all";

    const filters: Record<string, unknown>[] = [
      { recipientType: "ALL_STUDENTS" },
      {
        recipientType: "SINGLE_STUDENT",
        studentId: student._id,
      },
    ];

    if (student.batchId) {
      filters.push({
        recipientType: "BATCH_WISE",
        batchId: student.batchId,
      });
    }

    const audienceFilter: Record<string, unknown> = {};

    if (audience === "all_students") {
      audienceFilter.recipientType = "ALL_STUDENTS";
    } else if (audience === "batch") {
      audienceFilter.recipientType = "BATCH_WISE";
      audienceFilter.batchId = student.batchId;
    } else if (audience === "personal") {
      audienceFilter.recipientType = "SINGLE_STUDENT";
      audienceFilter.studentId = student._id;
    }

    const query = {
      $and: [
        { $or: filters },
        ...(audience === "all" ? [] : [audienceFilter]),
      ],
    };

    const [
      notices,
      total,
      allStudentsCount,
      batchCount,
      personalCount,
    ] = await Promise.all([
      Notice.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("batchId", "name")
        .lean(),

      Notice.countDocuments(query),

      Notice.countDocuments({
        recipientType: "ALL_STUDENTS",
      }),

      student.batchId
        ? Notice.countDocuments({
            recipientType: "BATCH_WISE",
            batchId: student.batchId,
          })
        : Promise.resolve(0),

      Notice.countDocuments({
        recipientType: "SINGLE_STUDENT",
        studentId: student._id,
      }),
    ]);

    response.json({
      notices: notices.map((notice: any) => ({
        _id: String(notice._id),
        title: notice.title,
        message: notice.message,
        recipientType: notice.recipientType,
        batch: notice.batchId
          ? {
              _id: String(notice.batchId._id),
              name: notice.batchId.name,
            }
          : null,
        createdAt: notice.createdAt,
      })),

      summary: {
        total: allStudentsCount + batchCount + personalCount,
        allStudents: allStudentsCount,
        batch: batchCount,
        personal: personalCount,
      },

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}
