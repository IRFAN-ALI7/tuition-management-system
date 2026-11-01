import { useState } from "react";
import type { FormEvent } from "react";

import { api } from "@/lib/api";
import type { AdminProfile } from "@/components/admin/shared/types";

type ProfileDraft = {
  name: string;
  phone: string;
  email: string;
  image: string;
};

type Props = {
  setPageError: (message: string) => void;
  setNotice: (message: string) => void;
};

export default function useAdminProfile({
  setPageError,
  setNotice,
}: Props) {
  const [adminProfile, setAdminProfile] =
    useState<AdminProfile | null>(null);

  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({
    name: "",
    phone: "",
    email: "",
    image: "",
  });

  const [emailOtp, setEmailOtp] = useState("");

  const saveProfile = async () => {
    setPageError("");
    setNotice("");

    try {
      const result = await api("/auth/admin/profile", {
        method: "PATCH",
        body: JSON.stringify(profileDraft),
      });

      const profileResult = result.profile
        ? result
        : await api("/auth/admin/profile");

      setAdminProfile(profileResult.profile as AdminProfile);

      setProfileDraft({
        name: profileResult.profile.name,
        phone: profileResult.profile.phone,
        email: profileResult.profile.email,
        image: profileResult.profile.image,
      });

      setNotice(
        result.message ??
          (profileResult.profile.pendingEmail
            ? "Verification code sent to the new email address."
            : "Profile updated."),
      );
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Could not update profile.",
      );
    }
  };

  const verifyProfileEmail = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setPageError("");

    try {
      const result = await api("/auth/admin/profile/email/verify", {
        method: "POST",
        body: JSON.stringify({ otp: emailOtp }),
      });

      setAdminProfile(result.profile as AdminProfile);

      setProfileDraft({
        name: result.profile.name,
        phone: result.profile.phone,
        email: result.profile.email,
        image: result.profile.image,
      });

      setEmailOtp("");
      setNotice("Email address verified.");
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Could not verify email.",
      );
    }
  };

  const resendProfileEmailOtp = async () => {
    setPageError("");

    try {
      const result = await api("/auth/admin/profile/email/resend", {
        method: "POST",
      });

      setNotice(result.message);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Could not send a new code.",
      );
    }
  };

  const chooseProfileImage = async (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPageError("Choose an image file.");
      return;
    }

    try {
      const imageUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        URL.revokeObjectURL(imageUrl);

        const canvas = document.createElement("canvas");

        const scale = Math.min(
          1,
          320 / Math.max(image.width, image.height),
        );

        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        canvas
          .getContext("2d")
          ?.drawImage(image, 0, 0, canvas.width, canvas.height);

        const data = canvas.toDataURL("image/jpeg", 0.76);

        if (data.length > 600_000) {
          setPageError(
            "This image is too large after compression. Choose a smaller image.",
          );
          return;
        }

        setProfileDraft((current) => ({ ...current, image: data }));
        setPageError("");
      };

      image.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        setPageError("Could not read that image.");
      };

      image.src = imageUrl;
    } catch {
      setPageError("Could not process that image.");
    }
  };

  return {
    adminProfile,
    setAdminProfile,
    profileDraft,
    setProfileDraft,
    emailOtp,
    setEmailOtp,
    saveProfile,
    verifyProfileEmail,
    resendProfileEmailOtp,
    chooseProfileImage,
  };
}