import cors from "cors";
import express from "express";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes";
import batchRoutes from "./routes/batch.routes";
import studentRoutes from "./routes/student.routes";
import studentPortalRoutes from "./routes/student-portal.routes";
import attendanceRoutes from "./routes/attendance.routes";
import feeRoutes from "./routes/fee.routes";
import examRoutes from "./routes/exam.routes";
import noticeRoutes from "./routes/notice.routes";

import { requireAdmin, requireAuth } from "./middleware/authenticate";
import { getSession } from "./controllers/auth.controller";

const app = express();

const isProduction = process.env.NODE_ENV === "production";

app.disable("x-powered-by");

// On Render / Railway / Vercel the app sits behind one proxy. Without this,
// every visitor looks like the same IP and the rate limiters block everyone.
if (isProduction) {
  app.set("trust proxy", 1);
}

app.use(helmet());

// FRONTEND_ORIGIN can hold one URL or several, separated by commas.
// Example: https://my-app.vercel.app,https://www.mydomain.com
const allowedOrigins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

if (isProduction && !process.env.FRONTEND_ORIGIN) {
  console.warn(
    "FRONTEND_ORIGIN is not set. Browsers will not be able to call this API.",
  );
}

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header (health checks, server to server).
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
  }),
);

// Normal API requests: maximum 1 MB.
// Student profile photo updates: maximum 15 MB.
const standardJsonParser = express.json({ limit: "1mb" });
const profileImageJsonParser = express.json({ limit: "15mb" });

app.use((request, response, next) => {
  if (
    request.method === "PATCH" &&
    request.path === "/api/student/profile"
  ) {
    return profileImageJsonParser(request, response, next);
  }

  return standardJsonParser(request, response, next);
});

// Private data must never be stored by the browser or a proxy.
app.use("/api", (_request, response, next) => {
  response.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    Pragma: "no-cache",
    Expires: "0",
  });

  next();
});

// Health check
app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "udaan-api",
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Auth session
app.get("/api/auth/session", requireAuth, getSession);

// Admin routes
app.use("/api/batches", requireAuth, requireAdmin, batchRoutes);
app.use("/api/students", requireAuth, requireAdmin, studentRoutes);
app.use("/api/attendance", requireAuth, requireAdmin, attendanceRoutes);
app.use("/api/fees", requireAuth, requireAdmin, feeRoutes);
app.use("/api/exams", requireAuth, requireAdmin, examRoutes);
app.use("/api/notices", requireAuth, requireAdmin, noticeRoutes);

// Student portal routes
app.use("/api/student", studentPortalRoutes);

// Handle unknown routes with JSON response
app.use((_request, response) => {
  response.status(404).json({
    error: "Route not found.",
  });
});

// Global error handler
app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    // If response has already started, let Express handle the error.
    if (response.headersSent) {
      return next(error);
    }

    const details =
      typeof error === "object" && error !== null
        ? (error as {
            message?: unknown;
            stack?: unknown;
            status?: unknown;
            statusCode?: unknown;
            type?: unknown;
          })
        : {};

    const errorType =
      typeof details.type === "string" ? details.type : undefined;

    const statusCandidate = details.status ?? details.statusCode;

    const statusCode =
      typeof statusCandidate === "number" &&
      Number.isInteger(statusCandidate) &&
      statusCandidate >= 400 &&
      statusCandidate <= 599
        ? statusCandidate
        : 500;

    // Log debugging details only on the server.
    console.error("[API ERROR]", {
      statusCode,
      type: errorType,
      message:
        typeof details.message === "string"
          ? details.message
          : "Unknown error",
      stack:
        typeof details.stack === "string" ? details.stack : undefined,
    });

    // Safe messages for JSON parser errors.
    if (errorType === "entity.parse.failed") {
      return response.status(400).json({
        error: "Invalid JSON request body.",
      });
    }

    if (errorType === "entity.too.large") {
      return response.status(413).json({
        error: "Request body is too large.",
      });
    }

    // Do not expose internal server errors.
    if (statusCode >= 500) {
      return response.status(500).json({
        error: "An unexpected server error occurred.",
      });
    }

    // Preserve valid client error status codes.
    return response.status(statusCode).json({
      error: "The request could not be processed.",
    });
  },
);

export default app;