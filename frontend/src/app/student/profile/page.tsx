
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Student } from "@/types/student";

import PageHeader from "@/components/student/ui/PageHeader";
import SectionCard from "@/components/student/ui/SectionCard";
import LoadingState from "@/components/student/ui/LoadingState";
import ProfileForm from "@/components/student/profile/ProfileForm";

function extractProfile(value: unknown): Student | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Record<string, unknown>;

  // Backend returns { profile: {...} }
  if (data.profile && typeof data.profile === "object") {
    return data.profile as Student;
  }

  // Support { student: {...} } as well.
  if (data.student && typeof data.student === "object") {
    return data.student as Student;
  }

  // Support nested { data: { profile: {...} } } responses.
  if (data.data && typeof data.data === "object") {
    return extractProfile(data.data);
  }

  // Support a direct Student object.
  if (typeof data.name === "string") {
    return data as unknown as Student;
  }

  return null;
}

export default function StudentProfilePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const response: unknown = await api("/student/profile");
        const profile = extractProfile(response);

        if (mounted) {
          setStudent(profile);

          if (!profile) {
            setError("Student profile data is unavailable.");
          }
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load profile."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSave(data: {
    phone: string;
    address: string;
    profilePhoto: File | null;
  }) {
    let profilePhoto: string | undefined;

    if (data.profilePhoto) {
      profilePhoto = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () =>
          reject(new Error("Unable to read image."));

        reader.readAsDataURL(data.profilePhoto!);
      });
    }

    const payload: Record<string, string> = {
      phone: data.phone,
      address: data.address,
    };

    if (profilePhoto) {
      payload.profilePhoto = profilePhoto;
    }

    const response: unknown = await api("/student/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    const updatedProfile = extractProfile(response);

    if (updatedProfile) {
      setStudent(updatedProfile);
    } else {
      setStudent((previous) =>
        previous
          ? {
              ...previous,
              phone: data.phone,
              address: data.address,
            }
          : previous
      );
    }
  }

  if (loading) {
    return <LoadingState message="Loading your profile..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="View your personal information and update permitted details."
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {student ? (
        <SectionCard
          title="Personal Information"
          description="Only your mobile number, address and profile photo can be changed."
        >
          <ProfileForm
            initialData={{
              name: student.name || "",
              fatherName: student.fatherName || "",
              phone: student.phone || "",
              address: student.address || "",
              profilePhoto: student.profilePhoto || "",
              className: student.className || "",
            }}
            onSave={handleSave}
          />
        </SectionCard>
      ) : (
        <SectionCard>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {error || "Student profile could not be found."}
          </p>
        </SectionCard>
      )}
    </div>
  );
}
