
"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import type { BatchOption, ExamDraft } from "./examTypes";

type Props = {
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

function BatchDropdown({
  batches,
  value,
  onChange,
  time,
}: {
  batches: BatchOption[];
  value: string;
  onChange: (value: string) => void;
  time: (value: string) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const activeBatches = batches.filter((item) => item.active);
  const selected = activeBatches.find((item) => item._id === value);

  useEffect(() => {
    if (!open) return;

    const outside = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };

    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);

    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-[46px] w-full items-center justify-between gap-3 rounded-xl border bg-white px-3.5 text-left text-sm font-medium outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:bg-slate-950 dark:focus:ring-indigo-900 ${
          open
            ? "border-indigo-500"
            : "border-slate-200 dark:border-slate-700"
        }`}
      >
        <span className="min-w-0 truncate text-slate-700 dark:text-slate-200">
          {selected
            ? `${selected.name} · ${time(selected.startTime)} – ${time(selected.endTime)}`
            : "Select an active batch"}
        </span>
        <span className="shrink-0 text-slate-400">⌄</span>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-[110] w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="max-h-52 overflow-y-auto overscroll-contain">
            {activeBatches.length ? (
              activeBatches.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => {
                    onChange(item._id);
                    setOpen(false);
                  }}
                  className={`flex w-full flex-col rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    value === item._id
                      ? "bg-indigo-50 dark:bg-indigo-950/40"
                      : ""
                  }`}
                >
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {item.name}
                  </span>
                  <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {time(item.startTime)} – {time(item.endTime)}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-4 text-center text-sm text-slate-500">
                No active batches available
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
}: Props) {
  if (!createOpen) return null;

  return (
    <div
      className={`${modalBackdropClass} z-[80] items-start sm:items-center`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setCreateOpen(false);
      }}
    >
      <section
        className={`${modalClass} my-3 max-h-[calc(100dvh-24px)] max-w-2xl overflow-y-auto sm:my-auto`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-exam-title"
      >
        <button
          type="button"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          onClick={() => setCreateOpen(false)}
          aria-label="Close"
        >
          ×
        </button>

        <div className={sectionKickerClass}>EXAMS MANAGEMENT</div>

        <h2
          id="create-exam-title"
          className="mt-2 pr-10 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl"
        >
          Create exam
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Students active in the selected batch will be included in this exam.
        </p>

        <form
          onSubmit={(event) => void createExam(event)}
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5"
        >
          <label className={labelClass}>
            Exam date
            <input
              className={`${inputClass} h-[46px]`}
              type="date"
              required
              value={draft.examDate}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  examDate: event.target.value,
                }))
              }
            />
          </label>

          <label className={labelClass}>
            Exam / Test name
            <span className="text-xs font-normal text-slate-400">
              Optional
            </span>
            <input
              className={`${inputClass} h-[46px]`}
              maxLength={120}
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Weekly Test 1"
            />
          </label>

          <label className={labelClass}>
            Batch
            <BatchDropdown
              batches={batches}
              value={draft.batchId}
              onChange={(batchId) =>
                setDraft((current) => ({ ...current, batchId }))
              }
              time={time}
            />
          </label>

          <label className={labelClass}>
            Subject
            <input
              className={`${inputClass} h-[46px]`}
              required
              maxLength={80}
              list="exam-subject-options"
              value={draft.subject}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  subject: event.target.value,
                }))
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
              className={`${inputClass} h-[46px]`}
              required
              type="number"
              min="0.01"
              step="0.01"
              value={draft.totalMarks}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  totalMarks: event.target.value,
                }))
              }
              placeholder="e.g. 100"
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

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 dark:border-slate-800 sm:col-span-2 sm:flex-row sm:justify-end">
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
