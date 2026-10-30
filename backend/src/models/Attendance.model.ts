import { model, models, Schema, Types } from "mongoose";

const attendanceSchema = new Schema({
  batchId: { type: Types.ObjectId, ref: "Batch", required: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  records: [{ studentId: { type: Types.ObjectId, ref: "Student", required: true }, status: { type: String, enum: ["present", "absent"], required: true } }],
  savedBy: { type: Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
attendanceSchema.index({ batchId: 1, date: 1 }, { unique: true, name: "batch_date_attendance_unique" });

export default models.Attendance ?? model("Attendance", attendanceSchema);
