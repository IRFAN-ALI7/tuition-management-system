"use client";

import Image from "next/image";
import type { Dispatch, SetStateAction } from "react";
import type { ExamDetail, ExamResultRow } from "./examTypes";

type Props = {
  detail: ExamDetail | null;
  sortedResults: ExamResultRow[];
  sortBy: string;
  setSortBy: (value: string) => void;
  setDetail: (value: ExamDetail | null) => void;
  setMarkDraft: Dispatch<SetStateAction<Record<string, string>>>;
  setMarksOpen: (open: boolean) => void;
  modalBackdropClass: string;
  modalClass: string;
  sectionKickerClass: string;
  labelClass: string;
  inputClass: string;
  tableClass: string;
  tableHeaderClass: string;
  cellClass: string;
  buttonClass: string;
  primaryButtonClass: string;
  date: (value: string) => string;
  statusClass: (pending: boolean) => string;
};

export function ExamResults({
  detail,
  sortedResults,
  sortBy,
  setSortBy,
  setDetail,
  setMarkDraft,
  setMarksOpen,
  modalBackdropClass,
  modalClass,
  sectionKickerClass,
  labelClass,
  inputClass,
  tableClass,
  tableHeaderClass,
  cellClass,
  buttonClass,
  primaryButtonClass,
  date,
  statusClass,
}: Props) {
  if (!detail) return null;

  return (
    <div
      className={`${modalBackdropClass} z-[70]`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setDetail(null);
      }}
    >
      <section
        className={`${modalClass} max-h-[calc(100dvh-32px)] max-w-5xl`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exam-results-title"
      >
        <button
          type="button"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          onClick={() => setDetail(null)}
          aria-label="Close"
        >
          ×
        </button>

        <div className={sectionKickerClass}>EXAM RESULTS</div>

        <h2
          id="exam-results-title"
          className="mt-2 pr-10 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl"
        >
          {detail.exam.name || detail.exam.subject}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {date(detail.exam.examDate)} · {detail.exam.batch?.name} ·{" "}
          {detail.exam.subject} · {detail.exam.totalMarks} marks
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Average",
              value:
                detail.summary.averagePercentage === null
                  ? "—"
                  : detail.summary.averagePercentage + "%",
            },
            { label: "Highest", value: detail.summary.highestMarks ?? "—" },
            { label: "Lowest", value: detail.summary.lowestMarks ?? "—" },
            {
              label: "Entered / Pending",
              value: `${detail.summary.entered} / ${detail.summary.pending}`,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 dark:border-slate-700 dark:bg-slate-800/60"
            >
              <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                {item.label}
              </span>
              <strong className="mt-2 block text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                {item.value}
              </strong>
            </div>
          ))}
        </div>

        <label className={`${labelClass} mt-5 max-w-sm`}>
          Sort results
          <select
            className={inputClass}
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="percentage">Percentage (high to low)</option>
            <option value="marks">Marks (high to low)</option>
          </select>
        </label>

        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className={tableClass}>
            <thead className={tableHeaderClass}>
              <tr>
                {["Student ID", "Student", "Marks", "Percentage", "Status"].map(
                  (heading) => (
                    <th className="whitespace-nowrap px-4 py-3.5" key={heading}>
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {sortedResults.map((row) => {
                const initials = row.student.name
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part.charAt(0).toUpperCase())
                  .join("");

                return (
                  <tr
                    key={row.student._id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className={cellClass}>
                      {row.student.studentId || "—"}
                    </td>

                    <td className={cellClass}>
                      <div className="flex min-w-[180px] items-center gap-3">
                        {row.student.profilePhoto ? (
                           <Image
                             src={row.student.profilePhoto}
                             alt={`${row.student.name} profile`}
                            width={40}
                         height={40}
                         unoptimized
                           className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                            {initials || "S"}
                          </div>
                        )}

                        <span className="font-medium text-slate-900 dark:text-white">
                          {row.student.name}
                        </span>
                      </div>
                    </td>

                    <td className={cellClass}>
                      {row.obtainedMarks === null
                        ? "—"
                        : `${row.obtainedMarks} / ${detail.exam.totalMarks}`}
                    </td>

                    <td className={cellClass}>
                      {row.percentage === null ? "—" : `${row.percentage}%`}
                    </td>

                    <td className={cellClass}>
                      <span className={statusClass(row.obtainedMarks === null)}>
                        {row.saveStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
          <button
            type="button"
            className={buttonClass}
            onClick={() => setDetail(null)}
          >
            Close
          </button>

          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => {
              setMarkDraft(
                Object.fromEntries(
                  detail.results.map((row) => [
                    row.student._id,
                    row.obtainedMarks === null
                      ? ""
                      : String(row.obtainedMarks),
                  ])
                )
              );
              setMarksOpen(true);
            }}
          >
            Enter/Edit Marks
          </button>
        </div>
      </section>
    </div>
  );
}