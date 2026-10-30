import { model, models, Schema, Types } from "mongoose";

const allocationSchema = new Schema({
  year: { type: Number, required: true, min: 2000, max: 9999 },
  month: { type: Number, required: true, min: 1, max: 12 },
  amount: { type: Number, required: true, min: 0.01 },
}, { _id: false });

const feePaymentSchema = new Schema({
  receiptNumber: { type: String, required: true, unique: true },
  idempotencyKey: { type: String, required: true, unique: true },
  studentId: { type: Types.ObjectId, ref: "Student", required: true, index: true },
  amount: { type: Number, required: true, min: 0.01 },
  paymentDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  method: { type: String, enum: ["Cash", "UPI", "Bank Transfer"], required: true },
  referenceNumber: { type: String, default: "", trim: true, maxlength: 100 },
  allocations: { type: [allocationSchema], required: true, validate: { validator: (items: unknown[]) => items.length > 0, message: "At least one monthly allocation is required." } },
  receivedBy: { type: Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

feePaymentSchema.index({ studentId: 1, paymentDate: -1, createdAt: -1 });

export default models.FeePayment ?? model("FeePayment", feePaymentSchema);
