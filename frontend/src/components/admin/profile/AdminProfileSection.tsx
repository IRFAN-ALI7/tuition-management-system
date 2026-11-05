
"use client";

import Image from "next/image";
import { useState } from "react";
import type { FormEvent } from "react";
import type { AdminProfile } from "../shared/types";

type ProfileDraft = {
  name: string;
  phone: string;
  email: string;
  image: string;
};

type Props = {
  adminProfile: AdminProfile | null;
  profileDraft: ProfileDraft;
  setProfileDraft: (draft: ProfileDraft) => void;
  emailOtp: string;
  setEmailOtp: (value: string) => void;
  emailVerificationSentFor: string;
  verifiedEmailForDraft: string;
  onRequestEmailVerification: () => Promise<void>;
  onChooseImage: (file?: File) => void;
  onSave: () => void | Promise<void>;
  onVerifyEmail: (event: FormEvent<HTMLFormElement>) => void;
  onResendOtp: () => void;
  onChangePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
};

export default function AdminProfileSection({
  adminProfile,
  profileDraft,
  setProfileDraft,
  emailOtp,
  setEmailOtp,
  emailVerificationSentFor,
  verifiedEmailForDraft,
  onRequestEmailVerification,
  onChooseImage,
  onSave,
  onVerifyEmail,
  onResendOtp,
  onChangePassword,
}: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [emailVerificationLoading, setEmailVerificationLoading] =
    useState(false);

  const displayName =
    adminProfile?.name || profileDraft.name || "Administrator";

  const displayImage = adminProfile?.image || profileDraft.image;

  const currentEmail = (adminProfile?.email ?? "").trim().toLowerCase();
  const draftEmail = profileDraft.email.trim().toLowerCase();

  const emailIsVerified =
    (Boolean(adminProfile?.emailVerified) && draftEmail === currentEmail) ||
    (Boolean(verifiedEmailForDraft) &&
      draftEmail === verifiedEmailForDraft.trim().toLowerCase());

  const otpSentForCurrentEmail =
    Boolean(draftEmail) &&
    emailVerificationSentFor.toLowerCase() === draftEmail &&
    !emailIsVerified;

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AD";

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white";

  const closeEdit = () => {
    setEditOpen(false);
    setEmailOtp("");
  };

  const handleSaveProfile = async () => {
    setProfileLoading(true);

    try {
      await onSave();
      closeEdit();
    } catch {
      // Error notification is handled by the profile hook.
    } finally {
      setProfileLoading(false);
    }
  };

  const handleRequestEmailVerification = async () => {
    setEmailVerificationLoading(true);

    try {
      await onRequestEmailVerification();
    } finally {
      setEmailVerificationLoading(false);
    }
  };

  const handlePasswordSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 12) {
      setPasswordError("New password must contain at least 12 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError(
        "New password must be different from current password.",
      );
      return;
    }

    setPasswordLoading(true);

    try {
      await onChangePassword(currentPassword, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordOpen(false);
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "Could not change password.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const closePassword = () => {
    setPasswordOpen(false);
    setPasswordError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const updateDraft = (key: keyof ProfileDraft, value: string) => {
    setProfileDraft({
      ...profileDraft,
      [key]: value,
    });
  };

  return (
    <>
      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {/* Heading */}
        <div className="border-b border-gray-100 px-5 py-5 dark:border-gray-800 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="8" r="3.5" />
                <path
                  d="M4.5 20c.5-4 3.2-6 7.5-6s7 2 7.5 6"
                  strokeLinecap="round"
                />
              </svg>
            </span>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              Admin Profile
            </h2>
          </div>
        </div>

        <div className="space-y-7 p-5 sm:p-7">
          {/* Profile Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100/80 p-6 dark:border-blue-900/60 dark:from-blue-950/60 dark:via-gray-900 dark:to-blue-950/40 sm:p-8">
            <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 right-20 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />

            <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
              <div className="relative shrink-0">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-blue-100 text-3xl font-bold text-blue-700 shadow-lg dark:border-gray-700 dark:bg-blue-950 dark:text-blue-300 sm:h-32 sm:w-32">
                  {displayImage ? (
                    <Image
                      src={displayImage}
                      alt="Admin profile"
                      width={128}
                      height={128}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
              </div>

              <div className="min-w-0 text-center sm:text-left">
                <h3 className="break-words text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                  {displayName}
                </h3>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="12" cy="8" r="3.5" />
                  <path
                    d="M4.5 20c.5-4 3.2-6 7.5-6s7 2 7.5 6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Personal Information
              </h3>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
              {/* Full Name */}
              <div className="grid grid-cols-[36px_1fr] items-center gap-3 border-b border-gray-100 px-4 py-4 sm:grid-cols-[42px_170px_1fr] sm:px-5 dark:border-gray-800">
                <span className="text-blue-600 dark:text-blue-400">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-6 w-6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="8" r="3.5" />
                    <path
                      d="M4.5 20c.5-4 3.2-6 7.5-6s7 2 7.5 6"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>

                <span className="text-xs font-medium text-gray-500 sm:text-sm">
                  Full Name
                </span>

                <strong className="col-start-2 break-words text-sm font-semibold text-gray-900 sm:col-start-auto dark:text-white">
                  {adminProfile?.name || profileDraft.name || "—"}
                </strong>
              </div>

              {/* Phone */}
              <div className="grid grid-cols-[36px_1fr] items-center gap-3 border-b border-gray-100 px-4 py-4 sm:grid-cols-[42px_170px_1fr] sm:px-5 dark:border-gray-800">
                <span className="text-blue-600 dark:text-blue-400">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-6 w-6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      d="M7 3h3l2 5-2 2c1.2 2.2 2.8 3.8 5 5l2-2 5 2v3c0 1.1-.9 2-2 2C10.5 20 4 13.5 4 5c0-1.1.9-2 2-2z"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>

                <span className="text-xs font-medium text-gray-500 sm:text-sm">
                  Phone Number
                </span>

                <strong className="col-start-2 break-words text-sm font-semibold text-gray-900 sm:col-start-auto dark:text-white">
                  {adminProfile?.phone || profileDraft.phone || "—"}
                </strong>
              </div>

              {/* Email */}
              <div className="grid grid-cols-[36px_1fr] items-center gap-3 px-4 py-4 sm:grid-cols-[42px_170px_1fr_auto] sm:px-5">
                <span className="text-blue-600 dark:text-blue-400">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-6 w-6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path
                      d="m4 7 8 6 8-6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>

                <span className="text-xs font-medium text-gray-500 sm:text-sm">
                  Email Address
                </span>

                <strong className="col-start-2 break-all text-sm font-semibold text-gray-900 sm:col-start-auto dark:text-white">
                  {adminProfile?.email || profileDraft.email || "—"}
                </strong>

                {adminProfile?.emailVerified ? (
                  <span className="col-start-2 mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 sm:col-start-auto sm:mt-0 dark:bg-green-950 dark:text-green-400">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Verified Email
                  </span>
                ) : (
                  <span className="col-start-2 mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 sm:col-start-auto sm:mt-0 dark:bg-amber-950 dark:text-amber-400">
                    Not verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path
                    d="m19.4 15 .1.1 1.4 1.1-1.5 2.6-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-3l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.5-2.6 1.4-1.1a8 8 0 0 1 0-1.8l-1.4-1.1 1.5-2.6 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8h3l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.5 2.6-1.4 1.1a8 8 0 0 1 0 1.8Z"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Account Actions
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="m14 6 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Edit Profile
              </button>

              <button
                type="button"
                onClick={() => setPasswordOpen(true)}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
                  <circle cx="12" cy="15.5" r="1" />
                </svg>
                Change Password
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Edit Profile Modal */}
      {editOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto bg-gray-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEdit();
          }}
        >
          <div className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Edit Profile
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Update your personal information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEdit}
                aria-label="Close"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[75vh] space-y-4 overflow-y-auto p-5 sm:p-6">
              {/* Profile Photo */}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xl font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {profileDraft.image ? (
                    <Image
                      src={profileDraft.image}
                      alt="Profile preview"
                      width={64}
                      height={64}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                <label className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
                  Change photo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      onChooseImage(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>

              {/* Full Name */}
              <label className="block space-y-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
                <input
                  required
                  maxLength={100}
                  className={inputClass}
                  value={profileDraft.name}
                  onChange={(event) => updateDraft("name", event.target.value)}
                />
              </label>

              {/* Phone Number */}
              <label className="block space-y-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
                <input
                  type="tel"
                  maxLength={30}
                  className={inputClass}
                  value={profileDraft.phone}
                  onChange={(event) => updateDraft("phone", event.target.value)}
                />
              </label>

              {/* Email Address */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="email"
                    required
                    className={`${inputClass} min-w-0 flex-1`}
                    value={profileDraft.email}
                    onChange={(event) => {
                      updateDraft("email", event.target.value);
                      setEmailOtp("");
                    }}
                  />

                  {emailIsVerified ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-green-100 px-3 py-2 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-400 sm:self-auto">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={
                        emailVerificationLoading ||
                        !draftEmail ||
                        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draftEmail)
                      }
                      onClick={() => void handleRequestEmailVerification()}
                      className="shrink-0 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {emailVerificationLoading
                        ? "Sending..."
                        : "Verify Email"}
                    </button>
                  )}
                </div>

                {!emailIsVerified && (
                  <p className="text-xs text-gray-500">
                    Verify your email address before saving your profile.
                  </p>
                )}
              </div>

              {/* OTP appears only after Verify Email is clicked */}
              {otpSentForCurrentEmail && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                    Verify your new email
                  </h4>

                  <p className="mt-1 break-all text-xs text-gray-600 dark:text-gray-300">
                    Verification code sent to {profileDraft.email}
                  </p>

                  <form onSubmit={onVerifyEmail} className="mt-3 space-y-3">
                    <input
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      className={inputClass}
                      value={emailOtp}
                      onChange={(event) =>
                        setEmailOtp(event.target.value.replace(/\D/g, ""))
                      }
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={onResendOtp}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold dark:border-gray-700"
                      >
                        Resend OTP
                      </button>

                      <button
                        type="submit"
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Verify OTP
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {emailIsVerified && (
                <p className="rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
                  Email verified successfully. You can now save your profile.
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 p-5 dark:border-gray-800 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={profileLoading || !emailIsVerified}
                onClick={() => void handleSaveProfile()}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {profileLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {passwordOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto bg-gray-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePassword();
          }}
        >
          <div className="my-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Change Password
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Keep your account secure.
                </p>
              </div>

              <button
                type="button"
                onClick={closePassword}
                aria-label="Close"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handlePasswordSubmit}
              className="space-y-4 p-5 sm:p-6"
            >
              {[
                {
                  label: "Current Password",
                  value: currentPassword,
                  setValue: setCurrentPassword,
                  visible: showCurrent,
                  setVisible: setShowCurrent,
                },
                {
                  label: "New Password",
                  value: newPassword,
                  setValue: setNewPassword,
                  visible: showNew,
                  setVisible: setShowNew,
                },
                {
                  label: "Confirm New Password",
                  value: confirmPassword,
                  setValue: setConfirmPassword,
                  visible: showConfirm,
                  setVisible: setShowConfirm,
                },
              ].map((field) => (
                <label
                  key={field.label}
                  className="block space-y-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {field.label}

                  <span className="relative block">
                    <input
                      required
                      type={field.visible ? "text" : "password"}
                      autoComplete="current-password"
                      className={`${inputClass} pr-16`}
                      value={field.value}
                      onChange={(event) =>
                        field.setValue(event.target.value)
                      }
                    />

                    <button
                      type="button"
                      onClick={() => field.setVisible(!field.visible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600"
                    >
                      {field.visible ? "Hide" : "Show"}
                    </button>
                  </span>
                </label>
              ))}

              <p className="text-xs text-gray-500">
                New password must contain at least 12 characters.
              </p>

              {passwordError && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {passwordError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closePassword}
                  className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
