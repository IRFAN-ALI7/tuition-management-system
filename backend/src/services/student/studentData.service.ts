
import { Types } from "mongoose";
import User from "../../models/User.model";
import Student from "../../models/Student.model";

interface StudentUserData {
  role: "admin" | "student";
  studentId?: Types.ObjectId | null;
  active: boolean;
}

// Get authenticated student's own record
export async function getStudentByUserId(userId: string) {
  const user = await User.findById(userId)
    .select("role studentId active")
    .lean<StudentUserData>();

  if (
    !user ||
    user.role !== "student" ||
    !user.active ||
    !user.studentId
  ) {
    return null;
  }

  const student = await Student.findOne({
    _id: user.studentId,
    active: true,
  });

  return student;
}
