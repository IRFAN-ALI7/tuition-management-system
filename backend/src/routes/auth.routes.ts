import { Router } from "express";
import bcrypt from "bcryptjs";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";

import User from "../models/User.model";
import PasswordReset from "../models/PasswordReset.model";
import { AuthRequest, requireAdmin, requireAuth } from "../middleware/authenticate";
import {
  isEmailServiceConfigured,
  sendAdminEmailVerificationOtp,
  sendAdminPasswordOtp,
} from "../services/email.service";

const router = Router();

const otpRequestLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many password reset requests. Please wait and try again.",
  },
});

const otpVerifyLimit = rateLimit({
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
const PROFILE_IMAGE_MAX_LENGTH = 650_000;

const resetSecurityConfigured = () =>
  Boolean(process.env.PASSWORD_RESET_SECRET || process.env.JWT_SECRET);

function resetHash(value: string) {
  const secret = process.env.PASSWORD_RESET_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is required for password reset security.");
  }

  return createHmac("sha256", secret).update(value).digest("hex");
}

function sameHash(left: string, right: string) {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");

  return a.length === b.length && timingSafeEqual(a, b);
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function profileResponse(user: {
  id: string;
  name: string;
  mobile?: string;
  email?: string;
  emailVerified: boolean;
  image?: string;
  pendingEmail?: string;
}) {
  return {
    id: user.id,
    name: user.name,
    phone: user.mobile ?? "",
    email: user.email ?? "",
    emailVerified: user.emailVerified,
    pendingEmail: user.pendingEmail ?? "",
    image: user.image ?? "",
  };
}

async function issueProfileEmailOtp(
  userId: string,
  response: import("express").Response,
  force = false
) {
  if (!isEmailServiceConfigured() || !resetSecurityConfigured()) {
    response.status(503).json({
      error: "Email verification is temporarily unavailable. Please try again later.",
    });
    return;
  }

  const user = await User.findOne({
    _id: userId,
    role: "admin",
    active: true,
  }).select(
    "+pendingEmail +emailOtpHash +emailOtpExpiresAt +emailOtpAttempts +emailOtpResendAt"
  );

  if (!user?.pendingEmail) {
    response.status(400).json({
      error: "Save a new email address before requesting verification.",
    });
    return;
  }

  const now = new Date();

  if (!force && user.emailOtpResendAt && user.emailOtpResendAt > now) {
    response.status(429).json({
      error: "Please wait before requesting another code.",
    });
    return;
  }

  const otp = String(randomInt(0, 1_000_000)).padStart(6, "0");

  user.emailOtpHash = resetHash(`${user.id}:${user.pendingEmail}:${otp}`);
  user.emailOtpExpiresAt = new Date(now.getTime() + OTP_TTL_MS);
  user.emailOtpAttempts = 0;
  user.emailOtpResendAt = new Date(now.getTime() + RESEND_COOLDOWN_MS);

  await user.save();

  try {
    await sendAdminEmailVerificationOtp(user.pendingEmail, otp);
  } catch {
    user.pendingEmail = undefined;
    user.emailOtpHash = undefined;
    user.emailOtpExpiresAt = undefined;
    user.emailOtpAttempts = 0;
    user.emailOtpResendAt = undefined;

    await user.save();

    response.status(502).json({
      error:
        "We could not send the verification code. Your current email remains unchanged; please try again.",
    });
    return;
  }

  response.json({
    message: "Verification code sent to the new email address.",
    resendAfterSeconds: RESEND_COOLDOWN_MS / 1000,
  });
}

function genericOtpReply(response: import("express").Response) {
  response.status(202).json({
    message:
      "If an active admin account matches and email delivery is available, a verification code will arrive shortly.",
  });
}

async function issueAdminOtp(
  emailInput: unknown,
  response: import("express").Response
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

// ADMIN FORGOT PASSWORD: REQUEST OTP
router.post("/password-reset/request", otpRequestLimit, async (request, response, next) => {
  try {
    await issueAdminOtp(request.body?.email, response);
  } catch (error) {
    next(error);
  }
});

// ADMIN FORGOT PASSWORD: RESEND OTP
router.post("/password-reset/resend", otpRequestLimit, async (request, response, next) => {
  try {
    await issueAdminOtp(request.body?.email, response);
  } catch (error) {
    next(error);
  }
});

// ADMIN FORGOT PASSWORD: VERIFY OTP
router.post("/password-reset/verify", otpVerifyLimit, async (request, response, next) => {
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
});

// ADMIN FORGOT PASSWORD: SET NEW PASSWORD
router.post("/password-reset/complete", otpVerifyLimit, async (request, response, next) => {
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
      typeof request.body?.password === "string" ? request.body.password : "";

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
});

// ADMIN PROFILE
router.get("/admin/profile", requireAuth, requireAdmin, async (request, response, next) => {
  try {
    const auth = (request as AuthRequest).auth!;

    const user = await User.findById(auth.userId).select(
      "name mobile email emailVerified image +pendingEmail"
    );

    if (!user) {
      response.status(404).json({ error: "Admin profile not found." });
      return;
    }

    response.json({ profile: profileResponse(user) });
  } catch (error) {
    next(error);
  }
});

// UPDATE ADMIN PROFILE
router.patch("/admin/profile", requireAuth, requireAdmin, async (request, response, next) => {
  try {
    const auth = (request as AuthRequest).auth!;
    const { name, phone, email, image } = request.body ?? {};

    if (
      name !== undefined &&
      (typeof name !== "string" || !name.trim() || name.trim().length > 100)
    ) {
      response.status(400).json({
        error: "Name must be between 1 and 100 characters.",
      });
      return;
    }

    if (
      phone !== undefined &&
      (typeof phone !== "string" || phone.trim().length > 30)
    ) {
      response.status(400).json({ error: "Enter a valid phone number." });
      return;
    }

    if (
      image !== undefined &&
      (typeof image !== "string" ||
        image.length > PROFILE_IMAGE_MAX_LENGTH ||
        (image &&
          !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(
            image
          )))
    ) {
      response.status(400).json({
        error: "Choose a valid image under 450 KB.",
      });
      return;
    }

    if (email !== undefined && typeof email !== "string") {
      response.status(400).json({ error: "Enter a valid email address." });
      return;
    }

    const user = await User.findById(auth.userId).select(
      "name mobile email emailVerified image +pendingEmail +emailOtpHash +emailOtpExpiresAt +emailOtpAttempts +emailOtpResendAt"
    );

    if (!user) {
      response.status(404).json({ error: "Admin profile not found." });
      return;
    }

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.mobile = phone.trim();
    if (image !== undefined) user.image = image;

    let emailChanged = false;

    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();

      if (!validEmail(normalizedEmail)) {
        response.status(400).json({ error: "Enter a valid email address." });
        return;
      }

      if (normalizedEmail !== user.email || !user.emailVerified) {
        if (
          await User.exists({
            email: normalizedEmail,
            _id: { $ne: user._id },
          })
        ) {
          response.status(409).json({
            error: "That email address is already in use.",
          });
          return;
        }

        if (normalizedEmail !== user.pendingEmail) {
          user.pendingEmail = normalizedEmail;
          user.emailOtpHash = undefined;
          user.emailOtpExpiresAt = undefined;
          user.emailOtpAttempts = 0;
          user.emailOtpResendAt = undefined;
          emailChanged = true;
        }
      }
    }

    await user.save();

    if (emailChanged) {
      await issueProfileEmailOtp(user.id, response, true);
      return;
    }

    response.json({ profile: profileResponse(user) });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      response.status(409).json({
        error: "That email address or phone number is already in use.",
      });
      return;
    }

    next(error);
  }
});

const profileOtpLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many verification requests. Please wait and try again.",
  },
});

// RESEND ADMIN PROFILE EMAIL VERIFICATION OTP
router.post(
  "/admin/profile/email/resend",
  requireAuth,
  requireAdmin,
  profileOtpLimit,
  async (request, response, next) => {
    try {
      await issueProfileEmailOtp(
        (request as AuthRequest).auth!.userId,
        response
      );
    } catch (error) {
      next(error);
    }
  }
);

// VERIFY ADMIN PROFILE EMAIL
router.post(
  "/admin/profile/email/verify",
  requireAuth,
  requireAdmin,
  otpVerifyLimit,
  async (request, response, next) => {
    try {
      if (!resetSecurityConfigured()) {
        response.status(503).json({
          error: "Email verification is temporarily unavailable.",
        });
        return;
      }

      const otp =
        typeof request.body?.otp === "string"
          ? request.body.otp.trim()
          : "";

      if (!/^\d{6}$/.test(otp)) {
        response.status(400).json({
          error: "Enter the six-digit verification code.",
        });
        return;
      }

      const auth = (request as AuthRequest).auth!;

      const user = await User.findById(auth.userId).select(
        "email emailVerified +pendingEmail +emailOtpHash +emailOtpExpiresAt +emailOtpAttempts +emailOtpResendAt"
      );

      const now = new Date();

      if (
        !user?.pendingEmail ||
        !user.emailOtpHash ||
        !user.emailOtpExpiresAt ||
        user.emailOtpExpiresAt <= now ||
        user.emailOtpAttempts >= MAX_OTP_ATTEMPTS
      ) {
        response.status(400).json({
          error:
            "The code is invalid or expired. Request a new code and try again.",
        });
        return;
      }

      const expected = resetHash(
        `${user.id}:${user.pendingEmail}:${otp}`
      );

      if (!sameHash(user.emailOtpHash, expected)) {
        user.emailOtpAttempts += 1;

        if (user.emailOtpAttempts >= MAX_OTP_ATTEMPTS) {
          user.emailOtpHash = undefined;
          user.emailOtpExpiresAt = undefined;
        }

        await user.save();

        response.status(400).json({
          error:
            "The code is invalid or expired. Request a new code and try again.",
        });
        return;
      }

      const pendingEmail = user.pendingEmail;

      const updated = await User.findOneAndUpdate(
        {
          _id: user._id,
          pendingEmail,
          emailOtpHash: user.emailOtpHash,
          emailOtpExpiresAt: { $gt: now },
          emailOtpAttempts: { $lt: MAX_OTP_ATTEMPTS },
        },
        {
          $set: {
            email: pendingEmail,
            emailVerified: true,
          },
          $unset: {
            pendingEmail: 1,
            emailOtpHash: 1,
            emailOtpExpiresAt: 1,
            emailOtpAttempts: 1,
            emailOtpResendAt: 1,
          },
        },
        { new: true, runValidators: true }
      ).select("name mobile email emailVerified image");

      if (!updated) {
        response.status(400).json({
          error:
            "The code is invalid or expired. Request a new code and try again.",
        });
        return;
      }

      response.json({
        message: "Email address verified.",
        profile: profileResponse(updated),
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        response.status(409).json({
          error: "That email address is already in use. Choose a different address.",
        });
        return;
      }

      next(error);
    }
  }
);

// ADMIN AND STUDENT LOGIN
router.post("/login", async (request, response, next) => {
  try {
    const { identifier, password, role } = request.body as {
      identifier?: string;
      password?: string;
      role?: string;
    };

    if (
      !identifier?.trim() ||
      !password ||
      !["admin", "student"].includes(role ?? "")
    ) {
      response.status(400).json({
        error: "Role, phone number and password are required.",
      });
      return;
    }

    // Both Admin and Student login using phone number + password.
    const filter = {
      role,
      mobile: identifier.trim(),
    };

    const user = await User.findOne(filter).select("+passwordHash");

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      response.status(401).json({
        error: "Invalid sign in details.",
      });
      return;
    }

    // Inactive student account check
    if (role === "student" && !user.active) {
      response.status(403).json({
        code: "STUDENT_ACCOUNT_INACTIVE",
        error:
          "Your account is currently inactive. Please contact your tuition administrator to reactivate your account.",
      });
      return;
    }

    // Inactive admin account check
    if (!user.active) {
      response.status(401).json({
        error: "Invalid sign in details.",
      });
      return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not configured.");
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        version: user.sessionVersion,
      },
      secret,
      { expiresIn: "12h" }
    );

    response.cookie("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 12 * 60 * 60 * 1000,
    });

    response.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    next(error);
  }
});

// LOGOUT
router.post("/logout", (_request, response) => {
  response.clearCookie("session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  response.status(204).end();
});

export default router;