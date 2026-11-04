
"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { Student, StudentBatch } from "@/types/student";

import LoadingState from "@/components/student/ui/LoadingState";
import ProfileForm from "@/components/student/profile/ProfileForm";

interface ProfileFormData {
  phone: string;
  address: string;
  profilePhoto: File | null;
}

function extractProfile(value: unknown): Student | null {
  if (!value || typeof value !== "object") return null;

  const data = value as Record<string, unknown>;

  if (data.profile && typeof data.profile === "object") {
    return data.profile as Student;
  }

  if (data.student && typeof data.student === "object") {
    return data.student as Student;
  }

  if (data.data && typeof data.data === "object") {
    return extractProfile(data.data);
  }

  if (typeof data.name === "string") {
    return data as unknown as Student;
  }

  return null;
}

function formatAdmissionDate(value?: string) {
  if (!value) return "Not available";

  const parts = value.split("-");

  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number);

    if (year && month && day) {
      return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function formatTime(value?: string) {
  if (!value) return "Not set";

  const [hour, minute] = value.split(":").map(Number);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return value;
  }

  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function DetailTile({
  label,
  value,
  wide = false,
}: {
  label: string;
  value?: string | null;
  wide?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-800/70 ${
        wide ? "col-span-2" : ""
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[11px]">
        {label}
      </p>

      <p className="mt-1 break-words text-[13px] font-bold leading-5 text-slate-800 dark:text-slate-100 sm:text-sm">
        {value?.trim() || "Not provided"}
      </p>
    </div>
  );
}

function SectionIcon({ type }: { type: "personal" | "academic" | "contact" }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-[18px] w-[18px]",
    "aria-hidden": true as const,
  };

  if (type === "personal") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    );
  }

  if (type === "academic") {
    return (
      <svg {...common}>
        <path d="m2 9 10-5 10 5-10 5L2 9Z" />
        <path d="M6 11v5c3.5 2.5 8.5 2.5 12 0v-5M22 9v6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M5 4h4l2 5-3 2a15 15 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2C9 21 3 15 3 6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function InformationCard({
  title,
  type,
  children,
}: {
  title: string;
  type: "personal" | "academic" | "contact";
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800 sm:px-5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
          <SectionIcon type={type} />
        </span>

        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-2.5 p-3.5 sm:gap-3 sm:p-4">
        {children}
      </div>
    </section>
  );
}

function EditProfileModal({
  student,
  onSave,
  onClose,
}: {
  student: Student;
  onSave: (data: ProfileFormData) => Promise<void>;
  onClose: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-950 sm:h-auto sm:max-h-[min(90dvh,760px)] sm:max-w-[560px] sm:rounded-2xl sm:border sm:border-slate-200 sm:dark:border-slate-800"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div>
            <h2
              id="edit-profile-title"
              className="text-lg font-extrabold text-slate-900 dark:text-white"
            >
              Edit Profile
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Update your permitted profile details
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit profile"
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="m18 6-12 12M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
          <ProfileForm
            initialData={{
              phone: student.phone || "",
              address: student.address || "",
              profilePhoto: student.profilePhoto || "",
            }}
            onSave={onSave}
            onCancel={onClose}
          />
        </div>
      </section>
    </div>
  );
}

export default function StudentProfilePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [batch, setBatch] = useState<StudentBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const [profileResponse, batchResponse] = await Promise.all([
          api("/student/profile"),
          api("/student/batch").catch(() => ({ batch: null })),
        ]);

        if (!mounted) return;

        const profile = extractProfile(profileResponse);

        if (!profile) {
          throw new Error("Student profile data is unavailable.");
        }

        setStudent(profile);

        setBatch(
          batchResponse.batch ??
            batchResponse.data?.batch ??
            batchResponse.data ??
            null
        );
      } catch (caught) {
        if (mounted) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load your profile."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSave(data: ProfileFormData) {
    if (!student) return;

    let profilePhoto: string | undefined;

    if (data.profilePhoto) {
      profilePhoto = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Unable to read image."));

        reader.readAsDataURL(data.profilePhoto!);
      });
    }

    const payload: Record<string, string> = {
      phone: data.phone,
      address: data.address,
    };

    if (profilePhoto) payload.profilePhoto = profilePhoto;

    const response = await api("/student/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    const updatedProfile = extractProfile(response);

    setStudent(
      updatedProfile ?? {
        ...student,
        phone: data.phone,
        address: data.address,
        ...(profilePhoto ? { profilePhoto } : {}),
      }
    );

    setEditing(false);
    setSuccess("Profile updated successfully.");
  }

  if (loading) {
    return <LoadingState message="Loading your profile..." />;
  }

  if (!student) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
        <p className="font-bold">Unable to open your profile</p>
        <p className="mt-1">{error || "Student profile not found."}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    );
  }

  const initial = student.name?.trim().charAt(0).toUpperCase() || "S";

  return (
    <div className="mx-auto max-w-[1120px] space-y-5 sm:space-y-6">
      {/* Heading */}
      <div>
        <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">
          STUDENT PORTAL / MY PROFILE
        </p>

        <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          My Profile
        </h1>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your personal and academic information.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300"
        >
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {/* Profile header */}
      <section className="relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-indigo-50 p-4 dark:border-violet-900/40 dark:from-violet-950/40 dark:via-slate-900 dark:to-indigo-950/30 sm:rounded-3xl sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-violet-300/20 blur-3xl" />

        <div className="relative flex items-center gap-3.5 sm:gap-5">
          <div className="relative h-[76px] w-[76px] shrink-0 sm:h-24 sm:w-24">
            <div className="h-full w-full overflow-hidden rounded-full border-[3px] border-white bg-violet-100 shadow-md dark:border-slate-700 dark:bg-slate-800">
              {student.profilePhoto ? (
                <Image
                  src={student.profilePhoto}
                  alt={`${student.name} profile photo`}
                  width={96}
                  height={96}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-extrabold text-violet-700 dark:text-violet-300 sm:text-4xl">
                  {initial}
                </div>
              )}
            </div>

            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-green-500 dark:border-slate-900" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-extrabold text-slate-950 dark:text-white sm:text-2xl">
              {student.name}
            </h2>

            <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
              Udaan Learning Centre
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {student.studentId && (
                <span className="rounded-full border border-violet-200 bg-white/80 px-2.5 py-1 text-[10px] font-bold text-violet-800 dark:border-violet-800 dark:bg-slate-900/70 dark:text-violet-300">
                  ID: {student.studentId}
                </span>
              )}

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  student.active === false
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                    : "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300"
                }`}
              >
                {student.active === false ? "Inactive" : "Active Student"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSuccess("");
              setEditing(true);
            }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-violet-200 bg-white text-violet-700 shadow-sm transition hover:bg-violet-50 dark:border-violet-800 dark:bg-slate-900 dark:text-violet-300 dark:hover:bg-violet-950/50 sm:flex sm:h-11 sm:w-auto sm:gap-2 sm:px-4"
            aria-label="Edit profile"
            title="Edit profile"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15l-.8 5Z" />
            </svg>
            <span className="hidden text-xs font-bold sm:inline">
              Edit Profile
            </span>
          </button>
        </div>

        <div className="relative mt-4 flex items-center justify-between border-t border-violet-100 pt-3 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Admission Date
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {formatAdmissionDate(student.admissionDate)}
          </span>
        </div>
      </section>

      {/* Compact information cards */}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <InformationCard title="Personal Information" type="personal">
          <DetailTile label="Full Name" value={student.name} />
          <DetailTile label="Father's Name" value={student.fatherName} />
          <DetailTile label="Gender" value={student.gender} />
          <DetailTile
            label="Admission Date"
            value={formatAdmissionDate(student.admissionDate)}
          />
        </InformationCard>

        <InformationCard title="Academic Information" type="academic">
          <DetailTile label="Student ID" value={student.studentId} />
          <DetailTile label="Class" value={student.className} />
          <DetailTile
            label="Assigned Batch"
            value={batch?.name || "Not assigned"}
          />
          <DetailTile
            label="Batch Timing"
            value={
              batch
                ? `${formatTime(batch.startTime)} – ${formatTime(batch.endTime)}`
                : "Not assigned"
            }
          />
        </InformationCard>

        <InformationCard title="Contact Information" type="contact">
          <DetailTile label="Mobile Number" value={student.phone} />
          <DetailTile
            label="Contact Type"
            value="Registered Mobile"
          />
          <DetailTile
            label="Address"
            value={student.address}
            wide
          />
        </InformationCard>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
          <span className="font-bold text-slate-700 dark:text-slate-200">
            Need to correct your details?
          </span>{" "}
          Your name, father&apos;s name, gender, class and Student ID are managed
          by your Tuition Admin. Contact the admin if any of these details need
          correction.
        </p>
      </div>

      {/* Fixed modal: does not push profile content down */}
      {editing && (
        <EditProfileModal
          student={student}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
