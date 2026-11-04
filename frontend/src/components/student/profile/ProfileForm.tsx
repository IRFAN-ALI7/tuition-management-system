
"use client";

import { useState, type FormEvent } from "react";
import ProfilePhotoUpload from "./ProfilePhotoUpload";

interface ProfileFormProps {
  initialData: {
    phone: string;
    address?: string;
    profilePhoto?: string;
  };
  onSave: (data: {
    phone: string;
    address: string;
    profilePhoto: File | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function ProfileForm({
  initialData,
  onSave,
  onCancel,
}: ProfileFormProps) {
  const [phone, setPhone] = useState(initialData.phone || "");
  const [address, setAddress] = useState(initialData.address || "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedPhone = phone.replace(/\D/g, "");

    if (normalizedPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!address.trim()) {
      setError("Address is required.");
      return;
    }

    if (address.trim().length > 300) {
      setError("Address cannot exceed 300 characters.");
      return;
    }

    try {
      setSaving(true);

      await onSave({
        phone: normalizedPhone,
        address: address.trim(),
        profilePhoto: photo,
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Profile photo */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <ProfilePhotoUpload
          currentPhoto={initialData.profilePhoto}
          onPhotoChange={setPhoto}
        />
      </div>

      {/* Mobile */}
      <div className="space-y-2">
        <label
          htmlFor="profile-phone"
          className="block text-sm font-bold text-slate-800 dark:text-slate-200"
        >
          Mobile Number
        </label>

        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center border-r border-slate-200 px-3 text-sm font-bold text-slate-500 dark:border-slate-700 dark:text-slate-400">
            +91
          </span>

          <input
            id="profile-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
            }
            maxLength={10}
            required
            placeholder="10-digit mobile number"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-[68px] pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <p className="text-[11px] text-slate-400">
          This number is linked to your student login account.
        </p>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="profile-address"
            className="text-sm font-bold text-slate-800 dark:text-slate-200"
          >
            Address
          </label>

          <span className="text-[11px] text-slate-400">
            {address.length}/300
          </span>
        </div>

        <textarea
          id="profile-address"
          value={address}
          onChange={(event) =>
            setAddress(event.target.value.slice(0, 300))
          }
          rows={3}
          maxLength={300}
          required
          placeholder="Enter your complete address"
          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {/* Modal actions */}
      <div className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 pb-1 pt-4 dark:border-slate-800 dark:bg-slate-950 sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-2 sm:dark:bg-transparent">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="min-h-11 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}
