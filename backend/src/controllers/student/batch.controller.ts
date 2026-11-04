
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/authenticate";
import { getStudentByUserId } from "../../services/student/studentData.service";
import Batch from "../../models/Batch.model";

// GET /api/student/batch
export async function getStudentBatch(
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

    if (!student.batchId) {
      response.json({ batch: null });
      return;
    }

    const batch = await Batch.findById(student.batchId)
      .select("name startTime endTime active")
      .lean<any>();

    response.json({
      batch: batch
        ? {
            _id: batch._id,
            name: batch.name,
            startTime: batch.startTime,
            endTime: batch.endTime,
            active: batch.active,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
}
