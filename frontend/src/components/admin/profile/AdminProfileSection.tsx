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
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-2 text-xs font-semibold tracking-wider text-blue-600">
        ACCOUNT
      </div>

      <h2 className="text-xl font-bold">Admin profile</h2>

      <p className="mb-6 mt-1 text-sm text-gray-500">
        Manage your contact details and verify any new email address.
      </p>

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full bg-gray-100 text-lg font-semibold dark:bg-gray-800">
            {profileDraft.image ? (
              <NextImage
                src={profileDraft.image}
                alt="Admin profile preview"
                width={72}
                height={72}
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

          <div>
            <label className="inline-flex cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700">
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

            <small className="mt-2 block text-xs text-gray-500">
              Optional · resized before saving
            </small>
          </div>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium">
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
            className="rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
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
            className="rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
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
            className="rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700"
          />
        </label>

        <div>
          {adminProfile?.emailVerified ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              Verified email
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              Email not verified
            </span>
          )}
        </div>

        {adminProfile?.pendingEmail && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <p className="mb-4 text-sm">
              Enter the verification code sent to{" "}
              <strong>{adminProfile.pendingEmail}</strong>. Your current email
              stays active until verification is complete.
            </p>

            <form onSubmit={onVerifyEmail} className="flex flex-col gap-3">
              <label className="flex flex-col gap-2 text-sm font-medium">
                Six-digit code
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={emailOtp}
                  onChange={(event) =>
                    setEmailOtp(event.target.value.replace(/\D/g, ""))
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700"
                  onClick={onResendOtp}
                >
                  Resend code
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Verify email
                </button>
              </div>
            </form>
          </div>
        )}

        <button
          className="self-start rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
          type="button"
          onClick={onSave}
        >
          Save profile →
        </button>
      </div>
    </section>
  );
}