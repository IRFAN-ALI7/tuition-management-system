
"use client";

import { useState } from "react";
import ProfilePhotoUpload from "./ProfilePhotoUpload";

interface ProfileFormProps {
  initialData: {
    name: string;
    fatherName?: string;
    phone: string;
    address?: string;
    profilePhoto?: string;
    className?: string;
  };
  onSave: (data: {
    phone: string;
    address: string;
    profilePhoto: File | null;
  }) => Promise<void>;
}

export default function ProfileForm({
  initialData,
  onSave,
}: ProfileFormProps) {
  const [phone, setPhone] = useState(initialData.phone || "");
  const [address, setAddress] = useState(initialData.address || "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!phone.trim()) {
      setError("Mobile number is required.");
      return;
    }

    if (phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid mobile number.");
      return;
    }

    if (address.length > 300) {
      setError("Address cannot exceed 300 characters.");
      return;
    }

    try {
      setSaving(true);
      await onSave({ phone: phone.trim(), address: address.trim(), profilePhoto: photo });
      setSuccess("Profile updated successfully.");
      setPhoto(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ProfilePhotoUpload
        currentPhoto={initialData.profilePhoto}
        onPhotoChange={setPhoto}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Student Name
          </label>
          <input
            value={initialData.name}
            disabled
            className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-500 outline-none dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Father&apos;s Name
          </label>
          <input
            value={initialData.fatherName || ""}
            disabled
            className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-500 outline-none dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Mobile Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            maxLength={15}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Class
          </label>
          <input
            value={initialData.className || "—"}
            disabled
            className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-500 outline-none dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Address
          </label>
          <textarea
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            maxLength={300}
            rows={3}
            placeholder="Enter your address"
            className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {address.length}/300
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
          {success}
        </p>
      )}

      <div className="flex justify-end border-t border-gray-100 pt-5 dark:border-gray-800">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
