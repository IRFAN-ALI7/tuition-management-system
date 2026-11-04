
import { Router } from "express";

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
  resendAdminProfileEmailOtp,
  verifyAdminProfileEmail,
  profileOtpLimit,
} from "../controllers/admin/profile.controller";

import { login, logout } from "../controllers/auth.controller";

import {
  requireAuth,
  requireAdmin,
} from "../middleware/authenticate";

const router = Router();

// ADMIN FORGOT PASSWORD: REQUEST OTP
router.post(
  "/password-reset/request",
  otpRequestLimit,
  requestPasswordReset
);

// ADMIN FORGOT PASSWORD: RESEND OTP
router.post(
  "/password-reset/resend",
  otpRequestLimit,
  resendPasswordResetOtp
);

// ADMIN FORGOT PASSWORD: VERIFY OTP
router.post(
  "/password-reset/verify",
  otpVerifyLimit,
  verifyPasswordResetOtp
);

// ADMIN FORGOT PASSWORD: SET NEW PASSWORD
router.post(
  "/password-reset/complete",
  otpVerifyLimit,
  completePasswordReset
);

// ADMIN PROFILE
router.get(
  "/admin/profile",
  requireAuth,
  requireAdmin,
  getAdminProfile
);

// UPDATE ADMIN PROFILE
router.patch(
  "/admin/profile",
  requireAuth,
  requireAdmin,
  updateAdminProfile
);

// RESEND ADMIN PROFILE EMAIL VERIFICATION OTP
router.post(
  "/admin/profile/email/resend",
  requireAuth,
  requireAdmin,
  profileOtpLimit,
  resendAdminProfileEmailOtp
);

// VERIFY ADMIN PROFILE EMAIL
router.post(
  "/admin/profile/email/verify",
  requireAuth,
  requireAdmin,
  otpVerifyLimit,
  verifyAdminProfileEmail
);

// ADMIN AND STUDENT LOGIN
router.post("/login", login);

// LOGOUT
router.post("/logout", requireAuth, logout);

export default router;
