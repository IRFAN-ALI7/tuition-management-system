
import { Router } from "express";

import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  resetStudentPassword,
  updateStudentActiveStatus,
} from "../controllers/admin/student.controller";

const router = Router();

router.get("/", getAllStudents);
router.get("/:id", getStudentById);

router.post("/", createStudent);
router.patch("/:id", updateStudent);
router.delete("/:id", deleteStudent);

router.patch("/:id/reset-password", resetStudentPassword);
router.patch("/:id/active", updateStudentActiveStatus);

export default router;
