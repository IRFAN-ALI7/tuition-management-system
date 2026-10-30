import { model, models, Schema, Types } from "mongoose";

const examSchema = new Schema({
  examDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  name: { type: String, default: "", trim: true, maxlength: 120 },
  batchId: { type: Types.ObjectId, ref: "Batch", required: true, index: true },
  subject: { type: String, required: true, trim: true, maxlength: 80 },
  totalMarks: { type: Number, required: true, min: 0.01 },
  studentIds: { type: [Types.ObjectId], ref: "Student", default: [] },
  createdBy: { type: Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
examSchema.index({ examDate: -1, batchId: 1, subject: 1 });

export default models.Exam ?? model("Exam", examSchema);
