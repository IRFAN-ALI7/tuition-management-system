
"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { BatchOption, ExamDraft } from "./examTypes";

type ExamFormProps = {
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  draft: ExamDraft;
  setDraft: Dispatch<SetStateAction<ExamDraft>>;
  batches: BatchOption[];
  subjects: string[];
  error: string;
  saving: boolean;
  inputClass: string;
  labelClass: string;
  buttonClass: string;
  primaryButtonClass: string;
  modalBackdropClass: string;
  modalClass: string;
  sectionKickerClass: string;
  time: (value: string) => string;
  createExam: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
};

export function ExamForm({
  createOpen,
  setCreateOpen,
  draft,
  setDraft,
  batches,
  subjects,
  error,
  saving,
  inputClass,
  labelClass,
  buttonClass,
  primaryButtonClass,
  modalBackdropClass,
  modalClass,
  sectionKickerClass,
  time,
  createExam,
}: ExamFormProps) {
  if (!createOpen) return null;

  return (
    <div
      className={modalBackdropClass}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setCreateOpen(false);
      }}
    >
      <section
        className={modalClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-exam-title"
      >
        <button
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          type="button"
          onClick={() => setCreateOpen(false)}
          aria-label="Close"
        >
          ×
        </button>

        <div className={sectionKickerClass}>EXAMS MANAGEMENT</div>

        <h2
          id="create-exam-title"
          className="mt-2 text-2xl font-bold text-slate-900 dark:text-white"
        >
          Create exam
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Students active in the selected batch will be included in this exam.
        </p>

        <form
          onSubmit={(event) => void createExam(event)}
          className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2"
        >
          <label className={labelClass}>
            Exam date
            <input
              className={inputClass}
              type="date"
              required
              value={draft.examDate}
              onChange={(event) =>
                setDraft({ ...draft, examDate: event.target.value })
              }
            />
          </label>

          <label className={labelClass}>
            Exam / Test name
            <small className="font-normal text-slate-400">Optional</small>
            <input
              className={inputClass}
              maxLength={120}
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
              placeholder="Weekly Test 1"
            />
          </label>

          <label className={labelClass}>
            Batch
            <select
              className={inputClass}
              required
              value={draft.batchId}
              onChange={(event) =>
                setDraft({ ...draft, batchId: event.target.value })
              }
            >
              <option value="">Select an active batch</option>
              {batches
                .filter((item) => item.active)
                .map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} — {time(item.startTime)} – {time(item.endTime)}
                  </option>
                ))}
            </select>
          </label>

          <label className={labelClass}>
            Subject
            <input
              className={inputClass}
              required
              maxLength={80}
              list="exam-subject-options"
              value={draft.subject}
              onChange={(event) =>
                setDraft({ ...draft, subject: event.target.value })
              }
              placeholder="Maths, Science, English..."
            />
            <datalist id="exam-subject-options">
              {subjects.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </label>

          <label className={`${labelClass} sm:col-span-2`}>
            Total marks
            <input
              className={inputClass}
              required
              type="number"
              min="0.01"
              step="0.01"
              value={draft.totalMarks}
              onChange={(event) =>
                setDraft({ ...draft, totalMarks: event.target.value })
              }
            />
          </label>

          {error && (
            <div
              className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200 sm:col-span-2"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:col-span-2">
            <button
              type="button"
              className={buttonClass}
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={primaryButtonClass}
              disabled={saving}
            >
              {saving ? "Creating…" : "Create Exam"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
