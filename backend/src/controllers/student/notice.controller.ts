
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
      response.status(404).json({ error: "Student record not found." });
      return;
    }

    const page = Math.max(1, Number(request.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(request.query.limit) || 20));

    const filters: any[] = [
      { recipientType: "ALL_STUDENTS" },
      { recipientType: "SINGLE_STUDENT", studentId: student._id },
    ];

    if (student.batchId) {
      filters.push({
        recipientType: "BATCH_WISE",
        batchId: student.batchId,
      });
    }

    const query = { $or: filters };

    const [notices, total] = await Promise.all([
      Notice.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("batchId", "name")
        .lean(),

      Notice.countDocuments(query),
    ]);

    response.json({
      notices: notices.map((notice: any) => ({
        _id: notice._id,
        title: notice.title,
        message: notice.message,
        recipientType: notice.recipientType,
        batch: notice.batchId
          ? {
              _id: notice.batchId._id,
              name: notice.batchId.name,
            }
          : null,
        createdAt: notice.createdAt,
      })),
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
