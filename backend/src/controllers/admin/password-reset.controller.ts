
import type { Request, Response, NextFunction } from "express";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";

import User from "../../models/User.model";
import PasswordReset from "../../models/PasswordReset.model";

import {
  isEmailServiceConfigured,
  sendAdminPasswordOtp,
} from "../../services/email.service";

const otpRequestLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many password reset requests. Please wait and try again.",
  },
});

export const otpVerifyLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many verification attempts. Please wait and try again.",
  },
});

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const resetSecurityConfigured = () =>
  Boolean(process.env.PASSWORD_RESET_SECRET || process.env.JWT_SECRET);

function resetHash(value: string) {
  const secret = process.env.PASSWORD_RESET_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is required for password reset security.");
  }

  return createHmac("sha256", secret).update(value).digest("hex");
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function genericOtpReply(response: Response) {
  response.status(202).json({
    message:
      "If an active admin account matches and email delivery is available, a verification code will arrive shortly.",
  });
}

async function issueAdminOtp(
  emailInput: unknown,
  response: Response
) {
  const email =
    typeof emailInput === "string" ? emailInput.trim().toLowerCase() : "";

  if (!isEmailServiceConfigured() || !resetSecurityConfigured()) {
    response.status(503).json({
      error:
        "Password reset email is temporarily unavailable. Please contact the tuition administrator.",
    });
    return;
  }

  if (!validEmail(email)) {
    genericOtpReply(response);
    return;
  }

  const user = await User.findOne({
    role: "admin",
    active: true,
    email,
  }).select("_id email");

  if (!user) {
    genericOtpReply(response);
    return;
  }

  const now = new Date();

  const previous = await PasswordReset.findOne({
    userId: user._id,
  }).select("resendAvailableAt");

  if (previous && previous.resendAvailableAt.getTime() > now.getTime()) {
    genericOtpReply(response);
    return;
  }

  const otp = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  await PasswordReset.findOneAndUpdate(
    { userId: user._id },
    {
      $set: {
        otpHash: resetHash(`${user.id}:${otp}`),
        otpExpiresAt: expiresAt,
        attempts: 0,
        resendAvailableAt: new Date(now.getTime() + RESEND_COOLDOWN_MS),
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        expiresAt,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await sendAdminPasswordOtp(user.email!, otp);
  } catch (error) {
    await PasswordReset.deleteOne({ userId: user._id });
    console.error("Admin password reset email delivery failed.", error);
  }

  genericOtpReply(response);
}

// POST /password-reset/request
export async function requestPasswordReset(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    await issueAdminOtp(request.body?.email, response);
  } catch (error) {
    next(error);
  }
}

// POST /password-reset/resend
export async function resendPasswordResetOtp(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    await issueAdminOtp(request.body?.email, response);
  } catch (error) {
    next(error);
  }
}

// POST /password-reset/verify
export async function verifyPasswordResetOtp(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    if (!resetSecurityConfigured()) {
      response.status(503).json({
        error:
          "Password reset is temporarily unavailable. Please contact the tuition administrator.",
      });
      return;
    }

    const email =
      typeof request.body?.email === "string"
        ? request.body.email.trim().toLowerCase()
        : "";

    const otp =
      typeof request.body?.otp === "string" ? request.body.otp.trim() : "";

    const invalid = () =>
      response.status(400).json({
        error: "The code is invalid or expired. Request a new code and try again.",
      });

    if (!validEmail(email) || !/^\d{6}$/.test(otp)) {
      invalid();
      return;
    }

    const user = await User.findOne({
      role: "admin",
      active: true,
      email,
    }).select("_id");

    if (!user) {
      invalid();
      return;
    }

    const now = new Date();
    const otpHash = resetHash(`${user.id}:${otp}`);
    const resetToken = randomBytes(32).toString("base64url");

    const record = await PasswordReset.findOneAndUpdate(
      {
        userId: user._id,
        otpHash,
        otpExpiresAt: { $gt: now },
        attempts: { $lt: MAX_OTP_ATTEMPTS },
        resetTokenHash: null,
      },
      {
        $set: {
          otpHash: null,
          otpExpiresAt: null,
          resetTokenHash: resetHash(resetToken),
          resetTokenExpiresAt: new Date(now.getTime() + RESET_TTL_MS),
          expiresAt: new Date(now.getTime() + RESET_TTL_MS),
        },
      },
      { new: true }
    );

    if (!record) {
      const current = await PasswordReset.findOne({
        userId: user._id,
        otpExpiresAt: { $gt: now },
        resetTokenHash: null,
      });

      if (current) {
        current.attempts += 1;

        if (current.attempts >= MAX_OTP_ATTEMPTS) {
          current.otpHash = null;
          current.otpExpiresAt = null;
        }

        await current.save();
      }

      invalid();
      return;
    }

    response.json({
      resetToken,
      expiresInSeconds: RESET_TTL_MS / 1000,
    });
  } catch (error) {
    next(error);
  }
}

// POST /password-reset/complete
export async function completePasswordReset(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    if (!resetSecurityConfigured()) {
      response.status(503).json({
        error:
          "Password reset is temporarily unavailable. Please contact the tuition administrator.",
      });
      return;
    }

    const resetToken =
      typeof request.body?.resetToken === "string"
        ? request.body.resetToken
        : "";

    const password =
      typeof request.body?.password === "string"
        ? request.body.password
        : "";

    if (!/^[A-Za-z0-9_-]{40,60}$/.test(resetToken)) {
      response.status(400).json({
        error:
          "The reset authorization is invalid or expired. Verify your code again.",
      });
      return;
    }

    if (password.length < 12 || password.length > 128) {
      response.status(400).json({
        error: "Password must be between 12 and 128 characters.",
      });
      return;
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
      response.status(400).json({
        error: "Password must be no more than 72 UTF-8 bytes.",
      });
      return;
    }

    const now = new Date();

    const record = await PasswordReset.findOneAndUpdate(
      {
        resetTokenHash: resetHash(resetToken),
        resetTokenExpiresAt: { $gt: now },
      },
      {
        $set: {
          resetTokenHash: null,
          resetTokenExpiresAt: null,
        },
      },
      { new: true }
    );

    if (!record) {
      response.status(400).json({
        error:
          "The reset authorization is invalid or expired. Verify your code again.",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.findOneAndUpdate(
      {
        _id: record.userId,
        role: "admin",
        active: true,
      },
      {
        $set: {
          passwordHash,
          mustChangePassword: false,
        },
        $inc: { sessionVersion: 1 },
      },
      { new: true }
    );

    await PasswordReset.deleteOne({ userId: record.userId });

    if (!user) {
      response.status(400).json({
        error:
          "The reset authorization is invalid or expired. Verify your code again.",
      });
      return;
    }

    response.json({ message: "Password reset successfully." });
  } catch (error) {
    next(error);
  }
}

export { otpRequestLimit };
