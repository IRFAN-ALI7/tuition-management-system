import { model, models, Schema, Types } from "mongoose";

const examResultSchema = new Schema({
  examId: { type: Types.ObjectId, ref: "Exam", required: true },
  studentId: { type: Types.ObjectId, ref: "Student", required: true },
  obtainedMarks: { type: Number, required: true, min: 0 },
  updatedBy: { type: Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
examResultSchema.index({ examId: 1, studentId: 1 }, { unique: true });
examResultSchema.index({ studentId: 1, createdAt: -1 });

export default models.ExamResult ?? model("ExamResult", examResultSchema);
