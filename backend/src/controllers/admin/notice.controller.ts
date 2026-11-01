
import type { Request, Response, NextFunction } from "express";
import { isValidObjectId, Types } from "mongoose";

import Batch from "../../models/Batch.model";
import Notice, {
  NOTICE_RECIPIENT_TYPES,
} from "../../models/Notice.model";
import Student from "../../models/Student.model";

// GET /
export async function getAllNotices(
  _request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const notices = await Notice.find()
      .populate("batchId", "name")
      .populate("studentId", "name phone")
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    response.json({ notices });
  } catch (error) {
    next(error);
  }
}

// POST /
export async function createNotice(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const body = request.body as Record<string, unknown>;

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    const recipientType = body.recipientType;

    if (
      !title ||
      !message ||
      typeof recipientType !== "string" ||
      !NOTICE_RECIPIENT_TYPES.includes(
        recipientType as (typeof NOTICE_RECIPIENT_TYPES)[number]
      )
    ) {
      response.status(400).json({
        error: "Title, message, and a valid recipient type are required.",
      });
      return;
    }

    let batchId: Types.ObjectId | null = null;
    let studentId: Types.ObjectId | null = null;

    if (recipientType === "BATCH_WISE") {
      if (
        typeof body.batchId !== "string" ||
        !isValidObjectId(body.batchId)
      ) {
        response.status(400).json({
          error: "Choose a valid batch.",
        });
        return;
      }

      batchId = new Types.ObjectId(body.batchId);

      if (!(await Batch.exists({ _id: batchId }))) {
        response.status(404).json({
          error: "Batch not found.",
        });
        return;
      }
    } else if (recipientType === "SINGLE_STUDENT") {
      if (
        typeof body.studentId !== "string" ||
        !isValidObjectId(body.studentId)
      ) {
        response.status(400).json({
          error: "Choose a valid student.",
        });
        return;
      }

      studentId = new Types.ObjectId(body.studentId);

      if (!(await Student.exists({ _id: studentId }))) {
        response.status(404).json({
          error: "Student not found.",
        });
        return;
      }
    }

    const notice = await Notice.create({
      title,
      message,
      recipientType,
      batchId,
      studentId,
    });

    await notice.populate([
      { path: "batchId", select: "name" },
      { path: "studentId", select: "name phone" },
    ]);

    response.status(201).json({ notice });
  } catch (error) {
    next(error);
  }
}

// DELETE /:id
export async function deleteNotice(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const id = Array.isArray(request.params.id)
      ? request.params.id[0]
      : request.params.id;

    if (!isValidObjectId(id)) {
      response.status(400).json({
        error: "Invalid notice ID.",
      });
      return;
    }

    const notice = await Notice.findByIdAndDelete(id);

    if (!notice) {
      response.status(404).json({
        error: "Notice not found.",
      });
      return;
    }

    response.json({ message: "Notice deleted." });
  } catch (error) {
    next(error);
  }
}
