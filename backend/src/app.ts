
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes";
import batchRoutes from "./routes/batch.routes";
import studentRoutes from "./routes/student.routes";
import attendanceRoutes from "./routes/attendance.routes";
import feeRoutes from "./routes/fee.routes";
import examRoutes from "./routes/exam.routes";
import noticeRoutes from "./routes/notice.routes";

import { requireAdmin, requireAuth } from "./middleware/authenticate";
import { getSession } from "./controllers/auth.controller";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));

app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "udaan-api",
  });
});

app.use("/api/auth", authRoutes);

// AUTH SESSION
// Prevent browsers and intermediate caches from storing session responses.
app.get(
  "/api/auth/session",
  (_request, response, next) => {
    response.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    });

    next();
  },
  requireAuth,
  getSession,
);

app.use("/api/batches", requireAuth, requireAdmin, batchRoutes);
app.use("/api/students", requireAuth, requireAdmin, studentRoutes);
app.use("/api/attendance", requireAuth, requireAdmin, attendanceRoutes);
app.use("/api/fees", requireAuth, requireAdmin, feeRoutes);
app.use("/api/exams", requireAuth, requireAdmin, examRoutes);
app.use("/api/notices", requireAuth, requireAdmin, noticeRoutes);

app.use(
  (
    error: Error,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(error.message);

    response.status(500).json({
      error: "An unexpected server error occurred.",
    });
  },
);

export default app;
