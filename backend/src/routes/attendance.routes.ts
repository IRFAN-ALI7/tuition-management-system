
import { Router } from "express";

import {
  getStudentAttendanceHistory,
  getBatchAttendance,
  saveAttendance,
} from "../controllers/admin/attendance.controller";

const router = Router();

router.get("/history/:studentId", getStudentAttendanceHistory);
router.get("/:batchId", getBatchAttendance);
router.post("/", saveAttendance);

export default router;
