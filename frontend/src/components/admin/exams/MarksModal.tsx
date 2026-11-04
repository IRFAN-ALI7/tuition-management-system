
"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { ExamDetail } from "./examTypes";

type Props = {
  marksOpen: boolean;
  detail: ExamDetail | null;
  markDraft: Record<string, string>;
  setMarkDraft: Dispatch<SetStateAction<Record<string, string>>>;
  markError: string;
  markSaving: boolean;
  setMarksOpen: (open: boolean) => void;
  saveMarks: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  modalBackdropClass: string;
  modalClass: string;
  sectionKickerClass: string;
  tableClass: string;
  tableHeaderClass: string;
  cellClass: string;
  buttonClass: string;
  primaryButtonClass: string;
  date: (value: string) => string;
  statusClass: (pending: boolean) => string;
};

export function MarksModal({
  marksOpen,
  detail,
  markDraft,
  setMarkDraft,
  markError,
  markSaving,
  setMarksOpen,
  saveMarks,
  modalBackdropClass,
  modalClass,
  sectionKickerClass,
  tableClass,
  tableHeaderClass,
  cellClass,
  buttonClass,
  primaryButtonClass,
  date,
  statusClass,
}: Props) {
  if (!marksOpen || !detail) return null;

  return (
    <div
      className={`${modalBackdropClass} z-[90] items-start sm:items-center`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setMarksOpen(false);
      }}
    >
      <section
        className={`${modalClass} my-3 max-h-[calc(100dvh-24px)] max-w-6xl sm:my-auto`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exam-marks-title"
      >
        <button
          type="button"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          onClick={() => setMarksOpen(false)}
          aria-label="Close"
        >
          ×
        </button>

        <div className={sectionKickerClass}>BATCH-WISE MARKS</div>

        <h2
          id="exam-marks-title"
          className="mt-2 pr-10 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl"
        >
          {detail.exam.name || detail.exam.subject}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {date(detail.exam.examDate)} · {detail.exam.batch?.name} ·{" "}
          {detail.exam.subject} · Total {detail.exam.totalMarks} marks
        </p>

        <form onSubmit={(event) => void saveMarks(event)}>
          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className={tableClass}>
              <thead className={tableHeaderClass}>
                <tr>
                  {[
                    "Student ID",
                    "Student Name",
                    "Total",
                    "Obtained Marks",
                    "Percentage",
                    "Save Status",
                  ].map((heading) => (
                    <th className="whitespace-nowrap px-4 py-3.5" key={heading}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {detail.results.map((row) => {
                  const raw = markDraft[row.student._id] ?? "";
                  const value =
                    raw === "" || !Number.isFinite(Number(raw))
                      ? null
                      : Number(raw);

                  const valid =
                    value !== null &&
                    value >= 0 &&
                    value <= detail.exam.totalMarks;

                  return (
                    <tr
                      key={row.student._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className={cellClass}>
                        {row.student.studentId || "—"}
                      </td>
                      <td className={`${cellClass} font-medium`}>
                        {row.student.name}
                      </td>
                      <td className={cellClass}>{detail.exam.totalMarks}</td>
                      <td className={cellClass}>
                        <input
                          className="h-10 w-28 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-indigo-900"
                          aria-label={`Obtained marks for ${row.student.name}`}
                          type="number"
                          min="0"
                          max={detail.exam.totalMarks}
                          step="0.01"
                          value={raw}
                          onChange={(event) =>
                            setMarkDraft((current) => ({
                              ...current,
                              [row.student._id]: event.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className={cellClass}>
                        {!valid
                          ? "—"
                          : `${((value / detail.exam.totalMarks) * 100).toFixed(2)}%`}
                      </td>
                      <td className={cellClass}>
                        <span className={statusClass(!valid)}>
                          {valid ? "Ready to save" : "Not Entered"}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {!detail.results.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No active students were assigned when this exam was
                      created.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {markError && (
            <div
              className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
              role="alert"
            >
              {markError}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
            <button
              type="button"
              className={buttonClass}
              onClick={() => setMarksOpen(false)}
            >
              Close
            </button>
            <button
              type="submit"
              className={primaryButtonClass}
              disabled={markSaving || !detail.results.length}
            >
              {markSaving ? "Saving…" : "Save Marks"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
