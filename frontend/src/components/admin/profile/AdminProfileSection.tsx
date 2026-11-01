
"use client";

import NextImage from "next/image";
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
  onChooseImage: (file?: File) => void;
  onSave: () => void;
  onVerifyEmail: (event: React.FormEvent<HTMLFormElement>) => void;
  onResendOtp: () => void;
};

export default function AdminProfileSection({
  adminProfile,
  profileDraft,
  setProfileDraft,
  emailOtp,
  setEmailOtp,
  onChooseImage,
  onSave,
  onVerifyEmail,
  onResendOtp,
}: Props) {
  const inputClass =
    "w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-950";

  return (
    <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      <div className="mb-2 text-xs font-semibold tracking-wider text-blue-600">
        ACCOUNT
      </div>

      <h2 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
        Admin profile
      </h2>

      <p className="mb-6 mt-1 text-sm leading-6 text-gray-500">
        Manage your contact details and verify any new email address.
      </p>

      <div className="flex min-w-0 flex-col gap-6">
        {/* Profile Photo */}
        <div className="flex flex-col gap-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-950/50 sm:flex-row sm:items-center">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-lg font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200 sm:h-[72px] sm:w-[72px]">
            {profileDraft.image ? (
              <NextImage
                src={profileDraft.image}
                alt="Admin profile preview"
                width={72}
                height={72}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              adminProfile?.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() ?? "AD"
            )}
          </span>

          <div className="min-w-0">
            <label className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 sm:w-auto">
              Choose photo

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) =>
                  onChooseImage(event.target.files?.[0])
                }
              />
            </label>

            <small className="mt-2 block text-xs leading-5 text-gray-500">
              Optional · resized before saving
            </small>
          </div>
        </div>

        {/* Profile Fields */}
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Full name

            <input
              required
              maxLength={100}
              value={profileDraft.name}
              onChange={(event) =>
                setProfileDraft({
                  ...profileDraft,
                  name: event.target.value,
                })
              }
              className={inputClass}
            />
          </label>

          <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Phone number

            <input
              type="tel"
              maxLength={30}
              value={profileDraft.phone}
              onChange={(event) =>
                setProfileDraft({
                  ...profileDraft,
                  phone: event.target.value,
                })
              }
              className={inputClass}
            />
          </label>

          <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
            Email address

            <input
              required
              type="email"
              value={profileDraft.email}
              onChange={(event) =>
                setProfileDraft({
                  ...profileDraft,
                  email: event.target.value,
                })
              }
              className={inputClass}
            />
          </label>
        </div>

        {/* Email Verification Status */}
        <div>
          {adminProfile?.emailVerified ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-2 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Verified email
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Email not verified
            </span>
          )}
        </div>

        {/* Pending Email OTP */}
        {adminProfile?.pendingEmail && (
          <div className="min-w-0 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40 sm:p-5">
            <h3 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-300">
              Verify your new email
            </h3>

            <p className="mb-4 break-words text-sm leading-6 text-gray-700 dark:text-gray-300">
              Enter the verification code sent to{" "}
              <strong>{adminProfile.pendingEmail}</strong>. Your current email
              stays active until verification is complete.
            </p>

            <form onSubmit={onVerifyEmail} className="flex flex-col gap-4">
              <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Six-digit code

                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={emailOtp}
                  onChange={(event) =>
                    setEmailOtp(event.target.value.replace(/\D/g, ""))
                  }
                  className={inputClass}
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 sm:w-auto"
                  onClick={onResendOtp}
                >
                  Resend code
                </button>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
                >
                  Verify email
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Save Profile */}
        <div className="border-t border-gray-200 pt-5 dark:border-gray-800">
          <button
            className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
            type="button"
            onClick={onSave}
          >
            Save profile →
          </button>
        </div>
      </div>
    </section>
  );
}
