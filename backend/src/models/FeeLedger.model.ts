import { model, models, Schema, Types } from "mongoose";

const feeLedgerSchema = new Schema({
  studentId: { type: Types.ObjectId, ref: "Student", required: true },
  year: { type: Number, required: true, min: 2000, max: 9999 },
  month: { type: Number, required: true, min: 1, max: 12 },
  feeAmount: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, required: true, min: 0, default: 0 },
}, { timestamps: true });

feeLedgerSchema.index({ studentId: 1, year: 1, month: 1 }, { unique: true, name: "student_fee_month_unique" });
feeLedgerSchema.index({ year: 1, month: 1, studentId: 1 });

export default models.FeeLedger ?? model("FeeLedger", feeLedgerSchema);
