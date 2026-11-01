
import { Router } from "express";

import {
  getFees,
  getFeeStudentOptions,
  getStudentFees,
  getPaymentReceipt,
  createFeePayment,
} from "../controllers/admin/fee.controller";

const router = Router();

router.get("/", getFees);
router.get("/students/options", getFeeStudentOptions);
router.get("/students/:studentId", getStudentFees);
router.get("/payments/:paymentId", getPaymentReceipt);
router.post("/payments", createFeePayment);

export default router;
