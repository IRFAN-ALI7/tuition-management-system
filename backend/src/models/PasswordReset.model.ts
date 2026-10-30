import { model, models, Schema, Types } from "mongoose";

const passwordResetSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  otpHash: { type: String, default: null },
  otpExpiresAt: { type: Date, default: null },
  attempts: { type: Number, default: 0 },
  resendAvailableAt: { type: Date, required: true },
  resetTokenHash: { type: String, default: null },
  resetTokenExpiresAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PasswordResetRecord = { userId: Types.ObjectId; otpHash: string | null; otpExpiresAt: Date | null; attempts: number; resendAvailableAt: Date; resetTokenHash: string | null; resetTokenExpiresAt: Date | null; expiresAt: Date };
export default models.PasswordReset ?? model("PasswordReset", passwordResetSchema);
