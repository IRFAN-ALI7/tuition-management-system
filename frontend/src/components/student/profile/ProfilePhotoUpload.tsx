
"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface ProfilePhotoUploadProps {
  currentPhoto?: string;
  onPhotoChange: (file: File | null) => void;
}

export default function ProfilePhotoUpload({
  currentPhoto,
  onPhotoChange,
}: ProfilePhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(currentPhoto || "");
  const [error, setError] = useState("");

  function handleFileChange(file?: File) {
    if (!file) return;

    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageUrl = String(reader.result);
      setPreview(imageUrl);
      onPhotoChange(file);
    };

    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-gray-100 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
        {preview ? (
            <Image
  src={preview}
  alt="Profile preview"
  width={96}
  height={96}
  unoptimized
  className="h-full w-full object-cover"
/>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-gray-400">
            ?
          </div>
        )}
      </div>

      <div className="text-center sm:text-left">
        <p className="font-semibold text-gray-900 dark:text-white">
          Profile Photo
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          JPG, PNG or WebP. Maximum original size 10 MB. Server compresses the
          image to 200 KB or less.
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Choose Photo
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => handleFileChange(event.target.files?.[0])}
        />

        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
}
