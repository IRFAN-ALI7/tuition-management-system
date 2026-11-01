
import { Router } from "express";

import {
  getStudentExamHistory,
  getAllExams,
  createExam,
  getExamById,
  saveExamResults,
  deleteExam,
} from "../controllers/admin/exam.controller";

const router = Router();

router.get("/students/:studentId/history", getStudentExamHistory);

router.get("/", getAllExams);
router.post("/", createExam);

router.get("/:examId", getExamById);
router.put("/:examId/results", saveExamResults);
router.delete("/:examId", deleteExam);

export default router;
