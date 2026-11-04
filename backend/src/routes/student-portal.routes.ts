
import { Router } from "express";

import {
  requireAuth,
  requireStudent,
} from "../middleware/authenticate";

import { getStudentDashboard } from "../controllers/student/dashboard.controller";

import {
  getStudentProfile,
  updateStudentProfile,
} from "../controllers/student/profile.controller";

import { getStudentAttendance } from "../controllers/student/attendance.controller";
import { getStudentBatch } from "../controllers/student/batch.controller";

import {
  getStudentFees,
  getStudentPaymentReceipt,
} from "../controllers/student/fee.controller";

import { getStudentExamHistory } from "../controllers/student/exam.controller";
import { getStudentNotices } from "../controllers/student/notice.controller";

const router = Router();

// All student routes require authentication and student role.
router.use(requireAuth, requireStudent);

// Dashboard
router.get("/dashboard", getStudentDashboard);

// Profile
router.get("/profile", getStudentProfile);
router.patch("/profile", updateStudentProfile);

// Batch
router.get("/batch", getStudentBatch);

// Attendance
router.get("/attendance", getStudentAttendance);

// Fees
router.get("/fees", getStudentFees);
router.get("/fees/payments/:paymentId", getStudentPaymentReceipt);

// Exams and results
router.get("/exams", getStudentExamHistory);

// Notices
router.get("/notices", getStudentNotices);

export default router;
