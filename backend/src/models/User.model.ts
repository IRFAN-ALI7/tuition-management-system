import { model, models, Schema } from "mongoose";

export type UserRole = "admin" | "student";

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true, sparse: true, unique: true },
  emailVerified: { type: Boolean, default: false },
  pendingEmail: { type: String, trim: true, lowercase: true, select: false },
  emailOtpHash: { type: String, select: false },
  emailOtpExpiresAt: { type: Date, select: false },
  emailOtpAttempts: { type: Number, default: 0, select: false },
  emailOtpResendAt: { type: Date, select: false },
  image: { type: String, default: "" },
  mobile: { type: String, trim: true, sparse: true, unique: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["admin", "student"], required: true },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "Student",
    unique: true,
    sparse: true,
  },
  active: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: false },
  sessionVersion: { type: Number, default: 0 },
}, { timestamps: true });

export default models.User ?? model("User", userSchema);