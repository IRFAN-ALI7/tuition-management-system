"use client";

import type { FormEvent } from "react";
import type {
  Student,
  Batch,
  StudentEditDraft,
} from "../shared/types";

type Props = {
  student: Student;
  draft: StudentEditDraft;
  setDraft: (draft: StudentEditDraft) => void;
  batches: Batch[];
  error: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function prettyTime(time: string) {
  const [h, m] = time.split(":").map(Number);

  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${
    h >= 12 ? "PM" : "AM"
  }`;
}

export default function StudentEditorModal({
  student,
  draft,
  setDraft,
  batches,
  error,
  onClose,
  onSubmit,
}: Props) {
  const currentBatch =
    typeof student.batchId === "object" && student.batchId
      ? student.batchId
      : null;

  const set = (key: keyof StudentEditDraft, value: string) => {
    setDraft({ ...draft, [key]: value });
  };

  const inputClass =
    "w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-950 dark:focus:ring-blue-950";

  const labelClass = "flex min-w-0 flex-col gap-1.5 text-sm font-medium";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <section
        className="relative my-auto max-h-[95dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl dark:bg-gray-900 sm:max-h-[90dvh] sm:max-w-2xl sm:rounded-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-edit-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="mb-2 pr-10 text-xs font-semibold tracking-wider text-blue-600">
          STUDENT MANAGEMENT
        </div>

        <h2 id="student-edit-title" className="text-xl font-bold">
          Edit student
        </h2>

        <p className="mb-5 mt-1 text-sm text-gray-500">
          Update profile details or move this student to another active batch.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Student Name
              <input
                required
                maxLength={100}
                className={inputClass}
                value={draft.name}
                onChange={(event) => set("name", event.target.value)}
              />
            </label>

            <label className={labelClass}>
              Father's Name
              <input
                className={inputClass}
                value={draft.fatherName}
                onChange={(event) => set("fatherName", event.target.value)}
              />
            </label>

            <label className={labelClass}>
              Phone
              <input
                required
                type="tel"
                className={inputClass}
                value={draft.phone}
                onChange={(event) => set("phone", event.target.value)}
              />
            </label>

            <label className={labelClass}>
              Gender
              <select
                className={inputClass}
                value={draft.gender}
                onChange={(event) => set("gender", event.target.value)}
              >
                <option value="">Not specified</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </label>

            <label className={labelClass}>
              Class
              <select
                className={inputClass}
                value={draft.className}
                onChange={(event) => set("className", event.target.value)}
              >
                <option value="">Not specified</option>

                {Array.from(
                  { length: 12 },
                  (_, index) => `Class ${index + 1}`,
                ).map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              Batch
              <select
                className={inputClass}
                value={draft.batchId}
                onChange={(event) => set("batchId", event.target.value)}
              >
                <option value="">Unassigned</option>

                {currentBatch && !currentBatch.active && (
                  <option value={currentBatch._id}>
                    {currentBatch.name} (Inactive batch)
                  </option>
                )}

                {batches
                  .filter((batch) => batch.active)
                  .map((batch) => (
                    <option value={batch._id} key={batch._id}>
                      {batch.name} — {prettyTime(batch.startTime)}–
                      {prettyTime(batch.endTime)}
                    </option>
                  ))}
              </select>
            </label>

            <label className={labelClass}>
              Monthly Fees (₹)
              <input
                required
                min="0"
                step="0.01"
                type="number"
                className={inputClass}
                value={draft.monthlyFees}
                onChange={(event) => set("monthlyFees", event.target.value)}
              />
            </label>

            <label className={labelClass}>
              Admission Date
              <input
                required
                type="date"
                className={inputClass}
                value={draft.admissionDate}
                onChange={(event) => set("admissionDate", event.target.value)}
              />
            </label>

            <label className={`${labelClass} sm:col-span-2`}>
              Address
              <textarea
                required
                rows={3}
                className={`${inputClass} resize-y`}
                value={draft.address}
                onChange={(event) => set("address", event.target.value)}
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 sm:w-auto"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
            >
              Save changes →
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}