
import { model, models, Model, Schema, Types } from "mongoose";

export interface StudentDocument {
  studentId?: string;
  name: string;
  nameKey: string;
  phone: string;
  phoneKey: string;
  fatherName: string;
  fatherNameKey: string;
  batchId: Types.ObjectId | null;
  gender: "Male" | "Female" | "Other" | "";
  address: string;
  className: string;
  admissionDate: string;
  monthlyFees: number | null;
  profilePhoto: string;
  profilePhotoPublicId: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const studentSchema = new Schema<StudentDocument>(
  {
    studentId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nameKey: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    phoneKey: {
      type: String,
      required: true,
    },
    fatherName: {
      type: String,
      default: "",
      trim: true,
    },
    fatherNameKey: {
      type: String,
      default: "",
    },
    batchId: {
      type: Types.ObjectId,
      ref: "Batch",
      default: null,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", ""],
      default: "",
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    className: {
      type: String,
      default: "",
      trim: true,
    },
    admissionDate: {
      type: String,
      default: "",
    },
    monthlyFees: {
      type: Number,
      default: null,
      min: 0,
    },
    profilePhoto: {
      type: String,
      default: "",
    },
    profilePhotoPublicId: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

studentSchema.index(
  { nameKey: 1, phoneKey: 1, fatherNameKey: 1 },
  { unique: true, name: "student_identity_unique" }
);

studentSchema.index({ batchId: 1, active: 1 });
studentSchema.index({ className: 1, batchId: 1, active: 1 });
studentSchema.index({ createdAt: -1, _id: -1 });

const StudentModel =
  (models.Student as Model<StudentDocument> | undefined) ??
  model<StudentDocument>("Student", studentSchema);

export default StudentModel;
