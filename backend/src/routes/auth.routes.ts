import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  otpRequestLimit,
  otpVerifyLimit,
  requestPasswordReset,
  resendPasswordResetOtp,
  verifyPasswordResetOtp,
  completePasswordReset,
} from "../controllers/admin/password-reset.controller";

import {
  getAdminProfile,
  updateAdminProfile,
  requestAdminProfileEmailOtp,
  cancelAdminProfileEmailVerification,
  resendAdminProfileEmailOtp,
  verifyAdminProfileEmail,
  profileOtpLimit,
  changeAdminPassword,
} from "../controllers/admin/profile.controller";

import { login, logout } from "../controllers/auth.controller";

import {
  requireAuth,
  requireAdmin,
} from "../middleware/authenticate";

const router = Router();

// Apply the login-attempt limit only to login requests.
// Session checks, logout and profile requests do not consume this limit.
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_request, response) => {
    response.status(429).json({
      error: "Too many login attempts. Please wait a few minutes before trying again.",
    });
  },
});

// ADMIN FORGOT PASSWORD: REQUEST OTP
router.post(
  "/password-reset/request",
  otpRequestLimit,
  requestPasswordReset,
);

// ADMIN FORGOT PASSWORD: RESEND OTP
router.post(
  "/password-reset/resend",
  otpRequestLimit,
  resendPasswordResetOtp,
);

// ADMIN FORGOT PASSWORD: VERIFY OTP
router.post(
  "/password-reset/verify",
  otpVerifyLimit,
  verifyPasswordResetOtp,
);

// ADMIN FORGOT PASSWORD: SET NEW PASSWORD
router.post(
  "/password-reset/complete",
  otpVerifyLimit,
  completePasswordReset,
);

// ADMIN PROFILE
router.get(
  "/admin/profile",
  requireAuth,
  requireAdmin,
  getAdminProfile,
);

// UPDATE ADMIN PROFILE - FINAL SAVE ONLY
router.patch(
  "/admin/profile",
  requireAuth,
  requireAdmin,
  updateAdminProfile,
);

// REQUEST OTP FOR NEW PROFILE EMAIL
router.post(
  "/admin/profile/email/request",
  requireAuth,
  requireAdmin,
  profileOtpLimit,
  requestAdminProfileEmailOtp,
);

// CANCEL PENDING PROFILE EMAIL VERIFICATION
router.post(
  "/admin/profile/email/cancel",
  requireAuth,
  requireAdmin,
  cancelAdminProfileEmailVerification,
);

// CHANGE ADMIN PASSWORD
router.post(
  "/admin/change-password",
  requireAuth,
  requireAdmin,
  changeAdminPassword,
);

// RESEND ADMIN PROFILE EMAIL VERIFICATION OTP
router.post(
  "/admin/profile/email/resend",
  requireAuth,
  requireAdmin,
  profileOtpLimit,
  resendAdminProfileEmailOtp,
);

// VERIFY ADMIN PROFILE EMAIL
router.post(
  "/admin/profile/email/verify",
  requireAuth,
  requireAdmin,
  otpVerifyLimit,
  verifyAdminProfileEmail,
);

// ADMIN AND STUDENT LOGIN
router.post("/login", loginRateLimit, login);

// LOGOUT
router.post("/logout", requireAuth, logout);

export default router;