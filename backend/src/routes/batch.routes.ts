
import { Router } from "express";

import {
  getAllBatches,
  createBatch,
  updateBatch,
  updateBatchActiveStatus,
  deleteBatch,
} from "../controllers/admin/batch.controller";

const router = Router();

router.get("/", getAllBatches);
router.post("/", createBatch);
router.patch("/:id", updateBatch);
router.patch("/:id/active", updateBatchActiveStatus);
router.delete("/:id", deleteBatch);

export default router;
