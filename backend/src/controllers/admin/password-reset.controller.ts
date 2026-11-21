import type { Request, Response, NextFunction } from "express";
import { createHmac, randomBytes, randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";

import User from "../../models/User.model";
import PasswordReset from "../../models/PasswordReset.model";

import {
  isEmailServiceConfigured,
  sendAdminPasswordOtp,
} from "../../services/email.service";

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_BYTES = 72; // bcrypt only uses the first 72 bytes

/**
 * false (recommended): the same message is shown whether or not the email exists,
 * so outsiders cannot find out which email belongs to the admin.
 * true: shows a clear "no admin account found" message for unknown emails.
 */
const REVEAL_UNKNOWN_EMAIL = true;

/* ------------------------------------------------------------------ */
/* Messages                                                            */
/* ------------------------------------------------------------------ */

const MESSAGES = {
  otpSent:
     "A verification code has been sent. Please check your inbox or spam folder.",
  unknownEmail:
    "We couldn't find an admin account with this email address. Please check the email and try again.",
  invalidEmail: "Please enter a valid email address.",
  emailUnavailable:
    "We couldn't send the verification email right now. Please try again in a few minutes or contact the tuition administrator.",
  resetUnavailable:
    "Password reset is temporarily unavailable. Please try again later or contact the tuition administrator.",
  invalidCode:
    "That code is incorrect or has expired. Codes are valid for 10 minutes and you have 5 attempts. " +
    "Please request a new code and try again.",
  invalidResetToken:
    "Your reset session is invalid or has expired. Please verify a new code to continue.",
  weakPassword: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
  longPassword: `Password is too long. Please use at most ${MAX_PASSWORD_BYTES} characters.`,
  resetSuccess:
    "Your password has been reset successfully. Please log in with your new password.",
  tooManyRequests:
    "Too many password reset requests. Please wait 15 minutes and try again.",
  tooManyAttempts:
    "Too many verification attempts. Please wait 15 minutes and try again.",
};

/* ------------------------------------------------------------------ */
/* Rate limiters                                                       */
/* ------------------------------------------------------------------ */

export const otpRequestLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: MESSAGES.tooManyRequests },
});

export const otpVerifyLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: MESSAGES.tooManyAttempts },
});

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

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
  response.status(202).json({ message: MESSAGES.otpSent });
}

/* ------------------------------------------------------------------ */
/* Send OTP (used by request + resend)                                 */
/* ------------------------------------------------------------------ */

async function issueAdminOtp(emailInput: unknown, response: Response) {
  const email =
    typeof emailInput === "string" ? emailInput.trim().toLowerCase() : "";

  if (!isEmailServiceConfigured() || !resetSecurityConfigured()) {
    console.error("Password reset: email service or secret is not configured.");
    response.status(503).json({ error: MESSAGES.emailUnavailable });
    return;
  }

  if (!validEmail(email)) {
    response.status(400).json({ error: MESSAGES.invalidEmail });
    return;
  }

  const user = await User.findOne({
    role: "admin",
    active: true,
    email,
  }).select("_id email");

  if (!user) {
    if (REVEAL_UNKNOWN_EMAIL) {
      response.status(404).json({ error: MESSAGES.unknownEmail });
      return;
    }
    genericOtpReply(response);
    return;
  }

  const now = new Date();

  const previous = await PasswordReset.findOne({
    userId: user._id,
  }).select("resendAvailableAt");

  if (previous && previous.resendAvailableAt.getTime() > now.getTime()) {
    // Cooldown active: reply with the same generic message (it already mentions the 1-minute wait).
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
      response.status(503).json({ error: MESSAGES.resetUnavailable });
      return;
    }

    const email =
      typeof request.body?.email === "string"
        ? request.body.email.trim().toLowerCase()
        : "";

    const otp =
      typeof request.body?.otp === "string" ? request.body.otp.trim() : "";

    const invalid = () =>
      response.status(400).json({ error: MESSAGES.invalidCode });

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
      // Wrong code: count the failed attempt atomically.
      const current = await PasswordReset.findOneAndUpdate(
        {
          userId: user._id,
          otpHash: { $ne: null },
          otpExpiresAt: { $gt: now },
          resetTokenHash: null,
        },
        { $inc: { attempts: 1 } },
        { new: true }
      );

      // Too many wrong attempts: invalidate the code.
      if (current && current.attempts >= MAX_OTP_ATTEMPTS) {
        await PasswordReset.updateOne(
          { _id: current._id },
          { $set: { otpHash: null, otpExpiresAt: null } }
        );
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
      response.status(503).json({ error: MESSAGES.resetUnavailable });
      return;
    }

    const resetToken =
      typeof request.body?.resetToken === "string"
        ? request.body.resetToken
        : "";

    const password =
      typeof request.body?.password === "string" ? request.body.password : "";

    if (!/^[A-Za-z0-9_-]{40,60}$/.test(resetToken)) {
      response.status(400).json({ error: MESSAGES.invalidResetToken });
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      response.status(400).json({ error: MESSAGES.weakPassword });
      return;
    }

    if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
      response.status(400).json({ error: MESSAGES.longPassword });
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
      response.status(400).json({ error: MESSAGES.invalidResetToken });
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
      response.status(400).json({ error: MESSAGES.invalidResetToken });
      return;
    }

    response.json({ message: MESSAGES.resetSuccess });
  } catch (error) {
    next(error);
  }
}