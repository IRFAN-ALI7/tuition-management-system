
import type { Request, Response, NextFunction } from "express";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";

import User from "../../models/User.model";

import {
  isEmailServiceConfigured,
  sendAdminEmailVerificationOtp,
} from "../../services/email.service";

import {
  AuthRequest,
} from "../../middleware/authenticate";

import {
  uploadProfileImage,
  deleteProfileImage,
} from "../../services/image/imageUpload.service";

const OTP_TTL_MS = 10 * 60 * 1000;
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
  response: Response,
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

const profileOtpLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many verification requests. Please wait and try again.",
  },
});

// GET /admin/profile
export async function getAdminProfile(
  request: Request,
  response: Response,
  next: NextFunction
) {
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
}

// PATCH /admin/profile
export async function updateAdminProfile(
  request: Request,
  response: Response,
  next: NextFunction
) {
  let uploadedPublicId = "";

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

    if (email !== undefined && typeof email !== "string") {
      response.status(400).json({ error: "Enter a valid email address." });
      return;
    }

    if (
      image !== undefined &&
      (typeof image !== "string" ||
        image.length > PROFILE_IMAGE_MAX_LENGTH ||
        (image !== "" &&
          !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(
            image
          ) &&
          !/^https?:\/\/.+/i.test(image)))
    ) {
      response.status(400).json({
        error: "Choose a valid image under 450 KB.",
      });
      return;
    }

    const user = await User.findById(auth.userId).select(
      "name mobile email emailVerified image imagePublicId +pendingEmail +emailOtpHash +emailOtpExpiresAt +emailOtpAttempts +emailOtpResendAt"
    );

    if (!user) {
      response.status(404).json({ error: "Admin profile not found." });
      return;
    }

    const oldPublicId = user.imagePublicId ?? "";

    // Validate email and check duplicates BEFORE uploading an image.
    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();

      if (!validEmail(normalizedEmail)) {
        response.status(400).json({ error: "Enter a valid email address." });
        return;
      }

      if (normalizedEmail !== user.email || !user.emailVerified) {
        const existingUser = await User.exists({
          email: normalizedEmail,
          _id: { $ne: user._id },
        });

        if (existingUser) {
          response.status(409).json({
            error: "That email address is already in use.",
          });
          return;
        }
      }
    }

    let nextImage = user.image ?? "";
    let nextImagePublicId = oldPublicId;

    // Handle profile image only after all email checks have passed.
    if (image !== undefined) {
      if (image === "") {
        nextImage = "";
        nextImagePublicId = "";
      } else if (image.startsWith("data:image/")) {
        const uploadResult = await uploadProfileImage({
          file: image,
          type: "admin",
        });

        nextImage = uploadResult.url;
        nextImagePublicId = uploadResult.publicId;
        uploadedPublicId = uploadResult.publicId;
      } else if (image === user.image) {
        // Existing image URL: keep its Cloudinary public ID.
        nextImage = user.image ?? "";
        nextImagePublicId = oldPublicId;
      } else {
        // External URL: it is not managed by our Cloudinary account.
        nextImage = image;
        nextImagePublicId = "";
      }
    }

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (phone !== undefined) {
      user.mobile = phone.trim();
    }

    if (image !== undefined) {
      user.image = nextImage;
      user.imagePublicId = nextImagePublicId;
    }

    let emailChanged = false;

    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();

      if (normalizedEmail !== user.email || !user.emailVerified) {
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

    // Database save succeeded. The new Cloudinary image is now in use.
    uploadedPublicId = "";

    // Delete the previous Cloudinary image only after successful save.
    if (
      image !== undefined &&
      oldPublicId &&
      oldPublicId !== nextImagePublicId
    ) {
      try {
        await deleteProfileImage(oldPublicId);
      } catch (deleteError) {
        console.error("Could not delete old admin profile image:", deleteError);
      }
    }

    if (emailChanged) {
      await issueProfileEmailOtp(user.id, response, true);
      return;
    }

    response.json({ profile: profileResponse(user) });
  } catch (error) {
    // If saving failed, clean up the newly uploaded image.
    if (uploadedPublicId) {
      try {
        await deleteProfileImage(uploadedPublicId);
      } catch (deleteError) {
        console.error("Could not clean up uploaded admin profile image:", deleteError);
      }
    }

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
}

// POST /admin/profile/email/resend
export async function resendAdminProfileEmailOtp(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    await issueProfileEmailOtp(
      (request as AuthRequest).auth!.userId,
      response
    );
  } catch (error) {
    next(error);
  }
}

// POST /admin/profile/email/verify
export async function verifyAdminProfileEmail(
  request: Request,
  response: Response,
  next: NextFunction
) {
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


export async function changeAdminPassword(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const auth = (request as AuthRequest).auth!;

    const { currentPassword, newPassword } = request.body ?? {};

    if (
      typeof currentPassword !== "string" ||
      !currentPassword ||
      typeof newPassword !== "string"
    ) {
      response.status(400).json({
        error: "Enter your current and new password.",
      });
      return;
    }

    if (newPassword.length < 12 || newPassword.length > 128) {
      response.status(400).json({
        error: "New password must be between 12 and 128 characters.",
      });
      return;
    }

    if (Buffer.byteLength(newPassword, "utf8") > 72) {
      response.status(400).json({
        error: "Password must not exceed 72 UTF-8 bytes.",
      });
      return;
    }

    if (currentPassword === newPassword) {
      response.status(400).json({
        error: "New password must be different from current password.",
      });
      return;
    }

    const user = await User.findOne({
      _id: auth.userId,
      role: "admin",
      active: true,
    }).select("+passwordHash");

    if (!user) {
      response.status(404).json({
        error: "Admin account not found.",
      });
      return;
    }

    const valid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!valid) {
      response.status(400).json({
        error: "Current password is incorrect.",
      });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;

    await user.save();

    response.json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    next(error);
  }
}


export { profileOtpLimit };
