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

  // Email verification is tied to the exact email address.
  const [emailVerificationSentFor, setEmailVerificationSentFor] =
    useState("");

  const [verifiedEmailForDraft, setVerifiedEmailForDraft] =
    useState("");

  const setProfileEmail = (email: string) => {
    setProfileDraft((current) => ({
      ...current,
      email,
    }));

    setEmailOtp("");
    setEmailVerificationSentFor("");
    setVerifiedEmailForDraft("");
    setPageError("");
    setNotice("");
  };

  // Send OTP only when the user clicks Verify Email.
  const requestProfileEmailVerification = async () => {
    setPageError("");
    setNotice("");

    const currentEmail = (adminProfile?.email ?? "").trim().toLowerCase();
    const newEmail = profileDraft.email.trim().toLowerCase();

    if (!newEmail) {
      setPageError("Please enter an email address.");
      return;
    }

    if (newEmail === currentEmail && adminProfile?.emailVerified) {
      setVerifiedEmailForDraft(newEmail);
      setEmailVerificationSentFor("");
      setNotice("This email address is already verified.");
      return;
    }

    if (emailVerificationSentFor === newEmail) {
      setNotice("Verification code has already been sent to this email.");
      return;
    }

    try {
      const result = await api("/auth/admin/profile", {
        method: "PATCH",
        body: JSON.stringify({
          email: newEmail,
        }),
      });

      const profileResult = result.profile
        ? result
        : await api("/auth/admin/profile");

      const profile = profileResult.profile as AdminProfile;

      setAdminProfile(profile);
      setEmailVerificationSentFor(newEmail);
      setVerifiedEmailForDraft("");

      setProfileDraft((current) => ({
        ...current,
        email: newEmail,
      }));

      setNotice(
        result.message ??
          `Verification code sent to ${newEmail}.`,
      );
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Could not send verification code.",
      );
    }
  };

  const saveProfile = async () => {
    setPageError("");
    setNotice("");

    try {
      const currentEmail = (adminProfile?.email ?? "").trim().toLowerCase();
      const newEmail = profileDraft.email.trim().toLowerCase();

      const emailChanged = currentEmail !== newEmail;

      if (
        emailChanged &&
        verifiedEmailForDraft !== newEmail
      ) {
        setPageError("Please verify your new email address before saving.");
        throw new Error("Please verify your new email address before saving.");
      }

      const result = await api("/auth/admin/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: profileDraft.name.trim(),
          phone: profileDraft.phone.trim(),
          email: newEmail,
          image: profileDraft.image,
        }),
      });

      const profileResult = result.profile
        ? result
        : await api("/auth/admin/profile");

      const profile = profileResult.profile as AdminProfile;

      setAdminProfile(profile);

      setProfileDraft({
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        image: profile.image,
      });

      setEmailVerificationSentFor("");
      setVerifiedEmailForDraft(
        profile.emailVerified ? profile.email.trim().toLowerCase() : "",
      );
      setEmailOtp("");

      setNotice(result.message ?? "Profile updated successfully.");
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Please verify your new email address before saving."
      ) {
        throw error;
      }

      setPageError(
        error instanceof Error
          ? error.message
          : "Could not update profile.",
      );

      throw error;
    }
  };

  const verifyProfileEmail = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setPageError("");
    setNotice("");

    const targetEmail = profileDraft.email.trim().toLowerCase();

    if (!emailOtp.trim()) {
      setPageError("Please enter the 6-digit verification code.");
      return;
    }

    if (emailVerificationSentFor !== targetEmail) {
      setPageError("Please request a verification code for this email first.");
      return;
    }

    try {
      const result = await api("/auth/admin/profile/email/verify", {
        method: "POST",
        body: JSON.stringify({
          otp: emailOtp,
        }),
      });

      const profileResult = result.profile
        ? result
        : await api("/auth/admin/profile");

      const profile = profileResult.profile as AdminProfile;

      setAdminProfile(profile);

      setProfileDraft((current) => ({
        ...current,
        email: targetEmail,
      }));

      setVerifiedEmailForDraft(targetEmail);
      setEmailVerificationSentFor("");
      setEmailOtp("");

      setNotice("Email address verified successfully. Now click Save Changes.");
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Could not verify email.",
      );
    }
  };

  const resendProfileEmailOtp = async () => {
    setPageError("");
    setNotice("");

    const targetEmail = profileDraft.email.trim().toLowerCase();

    if (!targetEmail || emailVerificationSentFor !== targetEmail) {
      setPageError("Please request email verification first.");
      return;
    }

    try {
      const result = await api("/auth/admin/profile/email/resend", {
        method: "POST",
      });

      setNotice(result.message ?? "Verification code sent again.");
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Could not send a new code.",
      );
    }
  };

  const chooseProfileImage = async (file?: File) => {
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPageError("Choose a JPG, PNG or WebP image.");
      return;
    }

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

      const context = canvas.getContext("2d");

      if (!context) {
        setPageError("Could not process this image.");
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const data = canvas.toDataURL("image/jpeg", 0.76);

      if (data.length > 600_000) {
        setPageError(
          "This image is too large after compression. Choose a smaller image.",
        );
        return;
      }

      setProfileDraft((current) => ({
        ...current,
        image: data,
      }));

      setPageError("");
      setNotice("Photo selected. Save your profile to apply the change.");
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      setPageError("Could not read that image.");
    };

    image.src = imageUrl;
  };

  const changeAdminPassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    setPageError("");
    setNotice("");

    try {
      const result = await api("/auth/admin/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      setNotice(result.message ?? "Password changed successfully.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not change password.";

      setPageError(message);
      throw new Error(message);
    }
  };

  return {
    adminProfile,
    setAdminProfile,
    profileDraft,
    setProfileDraft,
    setProfileEmail,
    emailOtp,
    setEmailOtp,
    emailVerificationSentFor,
    verifiedEmailForDraft,
    requestProfileEmailVerification,
    saveProfile,
    verifyProfileEmail,
    resendProfileEmailOtp,
    chooseProfileImage,
    changeAdminPassword,
  };
}