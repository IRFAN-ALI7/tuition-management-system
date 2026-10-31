
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NextImage from "next/image";
import { useTheme } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type Batch = {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  active: boolean;
};

type ExistingStudent = {
  _id: string;
  studentId?: string;
  name: string;
  phone: string;
  fatherName?: string;
};

type Draft = {
  name: string;
  fatherName: string;
  phone: string;
  password: string;
  gender: string;
  address: string;
  className: string;
  batchId: string;
  admissionDate: string;
  monthlyFees: string;
  profilePhoto: string;
  active: boolean;
};

const initialDraft: Draft = {
  name: "",
  fatherName: "",
  phone: "",
  password: "",
  gender: "",
  address: "",
  className: "",
  batchId: "",
  admissionDate: "",
  monthlyFees: "",
  profilePhoto: "",
  active: true,
};

const time = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function NewStudentPage() {
  const router = useRouter();
  const { dark, activateRole, clearRole } = useTheme();

  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [existing, setExisting] = useState<ExistingStudent | null>(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let live = true;

    const dateTimer = window.setTimeout(
      () => setDraft((current) => ({ ...current, admissionDate: today() })),
      0
    );

    void fetch(`${API}/auth/session`, { credentials: "include" })
      .then(async (response) =>
        response.ok ? response.json() : null
      )
      .then(async (session) => {
        if (!live) return;

        if (!session || session.user?.role !== "admin") {
          clearRole();
          router.replace("/admin/login");
          return;
        }

        activateRole("admin");

        const response = await fetch(`${API}/batches`, {
          credentials: "include",
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.error ?? "Could not load batches.");
        }

        if (live) {
          setBatches(
            (result.batches as Batch[]).filter((batch) => batch.active)
          );
        }
      })
      .catch((reason: unknown) => {
        if (live) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not load the student form."
          );
        }
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
      window.clearTimeout(dateTimer);
    };
  }, [activateRole, clearRole, router]);

  const update = (key: keyof Draft, value: string | boolean) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const choosePhoto = (file?: File) => {
    setError("");

    if (!file) {
      update("profilePhoto", "");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Choose an image file for the profile photo.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Choose a photo smaller than 5 MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      const scale = Math.min(
        1,
        1000 / Math.max(image.naturalWidth, image.naturalHeight)
      );

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(objectUrl);
        setError("This photo could not be prepared. Please choose another.");
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      let quality = 0.82;
      let encoded = canvas.toDataURL("image/jpeg", quality);

      while (encoded.length > 680_000 && quality > 0.35) {
        quality -= 0.1;
        encoded = canvas.toDataURL("image/jpeg", quality);
      }

      URL.revokeObjectURL(objectUrl);

      if (encoded.length > 680_000) {
        setError("This photo is too large after compression. Choose a smaller image.");
        return;
      }

      update("profilePhoto", encoded);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError("This photo could not be read. Please choose another.");
    };

    image.src = objectUrl;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setExisting(null);

    if (draft.password.length < 8) {
      setError("Initial password must be at least 8 characters long.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API}/students`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          monthlyFees: Number(draft.monthlyFees),
          active: draft.active,
          batchId: draft.batchId || null,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (result.existingStudent) {
          setExisting(result.existingStudent as ExistingStudent);
        }

        throw new Error(result.error ?? "Could not add the student.");
      }

      setSuccess(
        `Student profile and login account created. Student ID: ${result.student.studentId}`
      );

      setDraft(initialDraft);

      window.setTimeout(() => {
        router.push("/admin?section=Students");
      }, 1500);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not add the student."
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "min-h-[45px] w-full min-w-0 rounded-[10px] border border-[#e1e8f2] bg-white px-3 py-[10px] text-[14px] font-medium text-[#172444] outline-none focus:border-[#8b71e8] focus:shadow-[0_0_0_3px_#7655e31b] dark:border-[#403b50] dark:bg-[#282534] dark:text-[#f0eff8]";

  const labelClass =
    "grid content-start gap-[7px] text-[13px] font-bold text-[#172444] dark:text-[#f0eff8]";

  return (
    <main
      className={`min-h-screen bg-[linear-gradient(135deg,#f3f7ff_0%,#f8f7ff_50%,#f2f5fc_100%)] px-6 pb-11 text-[14px] text-[#172444] max-[640px]:px-[15px] max-[640px]:pb-[30px] ${
        dark
          ? "dark bg-[linear-gradient(135deg,#171622,#1c1929)] text-[#f0eff8]"
          : ""
      }`}
    >
      <header className="mx-auto flex min-h-[78px] max-w-[1280px] items-center justify-between border-b border-[#e2e8f3] dark:border-[#373345]">
        <Link
          className="flex items-center gap-[11px] text-[#172444] no-underline dark:text-[#e4def8]"
          href="/admin"
        >
          <span className="grid size-11 place-items-center rounded-[14px] bg-[linear-gradient(145deg,#7e61ec,#6947dd)] text-[25px] text-white">
            ✳
          </span>
          <span className="grid gap-[2px]">
            <strong className="text-[19px] leading-[1.1]">Udaan</strong>
            <small className="text-[9px] font-bold tracking-[1.2px] text-[#7775b2]">
              LEARNING CENTRE
            </small>
          </span>
        </Link>

        <div className="flex items-center gap-[18px]">
          <ThemeToggle />
          <Link
            href="/admin?section=Students"
            className="text-[13px] font-bold text-[#5b55a6] no-underline"
          >
            Back to Students
          </Link>
        </div>
      </header>

      <section className="mx-auto mt-8 w-full max-w-[900px]">
        <div className="mb-[19px]">
          <span className="text-[10px] font-extrabold tracking-[1.25px] text-[#7660c9]">
            STUDENT MANAGEMENT
          </span>
          <h1 className="my-[5px] text-[clamp(26px,4vw,34px)] font-bold text-[#172444] dark:text-[#f0eff8]">
            Add New Student
          </h1>
          <p className="text-[14px] text-[#71809a]">
            Create a student profile and login account.
          </p>
        </div>

        {loading ? (
          <div className="rounded-[14px] bg-white p-[22px] text-[#71809a] dark:bg-[#211f2b]">
            Checking your Admin session…
          </div>
        ) : (
          <form
            className="rounded-[19px] border border-[#e5eaf2] bg-white p-6 shadow-[0_14px_42px_#263b6910] dark:border-[#3a3548] dark:bg-[#211f2b] max-[640px]:px-[14px]"
            onSubmit={(event) => void submit(event)}
          >
            {error && (
              <div
                className="mb-4 rounded-[10px] border border-[#f1c8ce] bg-[#fff2f3] px-[14px] py-3 text-[13px] text-[#9f3546] dark:border-[#74414b] dark:bg-[#38252a] dark:text-[#ffbcc5]"
                role="alert"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="mb-4 rounded-[10px] border border-[#bfe7d2] bg-[#effbf5] px-[14px] py-3 text-[13px] text-[#147345] dark:border-[#315d48] dark:bg-[#20352b] dark:text-[#a5e6c1]"
                role="status"
              >
                {success}
              </div>
            )}

            {existing && (
              <div className="mb-4 rounded-[10px] border border-[#efdca6] bg-[#fff9e9] px-[14px] py-3 text-[13px] text-[#805d2e]">
                <strong>Possible duplicate student found</strong>
                <p>
                  {existing.name} · {existing.phone} · Father&apos;s name:{" "}
                  {existing.fatherName || "Not provided"}
                </p>
                <Link
                  className="font-bold text-[#684ec4]"
                  href="/admin?section=Students"
                >
                  Open Students
                </Link>
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-[19px] gap-y-[17px] max-[640px]:grid-cols-1">
              <label className={labelClass}>
                Student Name *
                <input
                  className={inputClass}
                  required
                  maxLength={100}
                  autoComplete="name"
                  value={draft.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Enter student's full name"
                />
              </label>

              <label className={labelClass}>
                Father&apos;s Name
                <input
                  className={inputClass}
                  maxLength={100}
                  value={draft.fatherName}
                  onChange={(e) => update("fatherName", e.target.value)}
                  placeholder="Enter father's name"
                />
              </label>

              <label className={labelClass}>
                Phone Number *
                <input
                  className={inputClass}
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  pattern="[+0-9() .-]{10,18}"
                  value={draft.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="10 digit mobile number"
                />
              </label>

              <label className={labelClass}>
                Initial Password *
                <input
                  className={inputClass}
                  required
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={draft.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Set student login password"
                />
                <small className="font-medium text-[#71809a]">
                  Minimum 8 characters. Share this password securely with the student.
                </small>
              </label>

              <label className={labelClass}>
                Gender
                <select
                  className={inputClass}
                  value={draft.gender}
                  onChange={(e) => update("gender", e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </label>

              <label className={`${labelClass} col-span-full`}>
                Address *
                <textarea
                  className={`${inputClass} min-h-[84px]`}
                  required
                  maxLength={500}
                  rows={3}
                  autoComplete="street-address"
                  value={draft.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Enter student's address"
                />
              </label>

              <label className={labelClass}>
                Class
                <select
                  className={inputClass}
                  value={draft.className}
                  onChange={(e) => update("className", e.target.value)}
                >
                  <option value="">Select class</option>
                  {Array.from(
                    { length: 12 },
                    (_, index) => `Class ${index + 1}`
                  ).map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>

              <label className={labelClass}>
                Batch Selection
                <select
                  className={inputClass}
                  value={draft.batchId}
                  onChange={(e) => update("batchId", e.target.value)}
                >
                  <option value="">No batch yet</option>
                  {batches.map((batch) => (
                    <option key={batch._id} value={batch._id}>
                      {batch.name} — {time(batch.startTime)} –{" "}
                      {time(batch.endTime)}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClass}>
                Admission Date *
                <input
                  className={inputClass}
                  required
                  type="date"
                  value={draft.admissionDate}
                  onChange={(e) => update("admissionDate", e.target.value)}
                />
              </label>

              <label className={labelClass}>
                Monthly Fees (₹) *
                <input
                  className={inputClass}
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={draft.monthlyFees}
                  onChange={(e) => update("monthlyFees", e.target.value)}
                  placeholder="0.00"
                />
              </label>

              <div className={`${labelClass} col-span-full`}>
                <span>Profile Photo (Optional)</span>
                <div className="flex min-h-[66px] items-center gap-3">
                  {draft.profilePhoto ? (
                    <NextImage
                      className="size-[58px] rounded-[13px] object-cover"
                      src={draft.profilePhoto}
                      alt="Student photo preview"
                      width={64}
                      height={64}
                      unoptimized
                    />
                  ) : (
                    <span className="grid size-[58px] place-items-center rounded-[13px] bg-[#f1f3f8] text-[11px] dark:bg-[#302c3b]">
                      Photo
                    </span>
                  )}

                  <label className="relative inline-flex min-h-[39px] cursor-pointer items-center rounded-[9px] border border-[#ddd6fa] bg-[#f7f5ff] px-[14px] text-xs font-bold text-[#6553b0]">
                    Choose photo
                    <input
                      className="absolute h-px w-px opacity-0"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => choosePhoto(e.target.files?.[0])}
                    />
                  </label>

                  {draft.profilePhoto && (
                    <button
                      type="button"
                      className="text-xs font-semibold text-[#a64757]"
                      onClick={() => update("profilePhoto", "")}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <fieldset className="col-span-full flex items-center gap-[18px] rounded-[10px] border border-[#e1e8f2] px-[14px] py-[13px] dark:border-[#403b50]">
                <legend className="px-[5px] text-[13px] font-bold">
                  Status
                </legend>

                <label className="flex items-center gap-[7px] text-[13px]">
                  <input
                    className="accent-[#7055dc]"
                    type="radio"
                    name="student-status"
                    checked={draft.active}
                    onChange={() => update("active", true)}
                  />
                  Active
                </label>

                <label className="flex items-center gap-[7px] text-[13px]">
                  <input
                    className="accent-[#7055dc]"
                    type="radio"
                    name="student-status"
                    checked={!draft.active}
                    onChange={() => update("active", false)}
                  />
                  Inactive
                </label>
              </fieldset>
            </div>

            <div className="mt-[21px] flex justify-end gap-[10px] border-t border-[#edf0f5] pt-[17px]">
              <Link
                href="/admin?section=Students"
                className="inline-flex min-h-[43px] items-center justify-center rounded-[10px] border border-[#e1e8f2] bg-white px-[17px] text-[13px] font-bold text-[#5d6c84] no-underline dark:border-[#403b50] dark:bg-[#211f2b] dark:text-[#d4cfe0]"
              >
                Cancel
              </Link>

              <button
                className="inline-flex min-h-[43px] items-center justify-center rounded-[10px] border border-[#694ed7] bg-[linear-gradient(135deg,#785de4,#6546cf)] px-[17px] text-[13px] font-bold text-white disabled:cursor-wait disabled:opacity-[.65]"
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving student…" : "Create Student"}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
