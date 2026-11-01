
import { Router } from "express";

import {
  getAllNotices,
  createNotice,
  deleteNotice,
} from "../controllers/admin/notice.controller";

const router = Router();

router.get("/", getAllNotices);
router.post("/", createNotice);
router.delete("/:id", deleteNotice);

export default router;
