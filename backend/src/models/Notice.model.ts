import { model, models, Schema, Types } from "mongoose";

export const NOTICE_RECIPIENT_TYPES = ["ALL_STUDENTS", "BATCH_WISE", "SINGLE_STUDENT"] as const;

const noticeSchema = new Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  recipientType: { type: String, enum: NOTICE_RECIPIENT_TYPES, required: true },
  batchId: { type: Types.ObjectId, ref: "Batch", default: null },
  studentId: { type: Types.ObjectId, ref: "Student", default: null },
}, { timestamps: true });

noticeSchema.index({ createdAt: -1 });

export default models.Notice ?? model("Notice", noticeSchema);
