"use client";

import { useEffect } from "react";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Target,
  Trophy,
  X,
} from "lucide-react";

import type { ExamResult } from "@/types/student-exams";

import {
  formatExamDate,
  formatMarks,
} from "@/types/student-exams";

interface Props {
  result: ExamResult | null;
  onClose: () => void;
}

export default function ExamResultModal({
  result,
  onClose,
}: Props) {
  useEffect(() => {
    if (!result) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [result, onClose]);

  if (!result) return null;

  const percentage = Math.min(
    100,
    Math.max(0, Number(result.percentage) || 0)
  );

  const batchName =
    result.batch &&
    typeof result.batch === "object" &&
    "name" in result.batch
      ? result.batch.name || "—"
      : typeof result.batch === "string"
        ? result.batch
        : "—";

  const scoreTone =
    percentage >= 80
      ? "text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400"
      : percentage >= 60
        ? "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400"
        : percentage >= 40
          ? "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400"
          : "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="exam-result-title"
        className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-950"
      >
        {/* Modal header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 sm:px-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
              Examination report
            </p>

            <h2
              id="exam-result-title"
              className="mt-0.5 text-base font-bold text-slate-900 dark:text-white"
            >
              Result Details
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close result details"
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {/* Exam name */}
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {result.name || "Examination"}
            </h3>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {result.subject || "Subject not specified"}
            </p>
          </div>

          {/* Result information */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <CalendarDays
                size={16}
                className="text-slate-500"
              />
              <p className="mt-2 text-[10px] text-slate-500">
                Exam Date
              </p>
              <p className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white">
                {formatExamDate(result.examDate)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <GraduationCap
                size={17}
                className="text-slate-500"
              />
              <p className="mt-2 text-[10px] text-slate-500">
                Subject
              </p>
              <p className="mt-0.5 truncate text-xs font-bold text-slate-900 dark:text-white">
                {result.subject || "—"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <Target size={16} className="text-slate-500" />
              <p className="mt-2 text-[10px] text-slate-500">
                Total Marks
              </p>
              <p className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white">
                {formatMarks(result.totalMarks)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <Trophy size={16} className="text-amber-500" />
              <p className="mt-2 text-[10px] text-slate-500">
                Batch
              </p>
              <p className="mt-0.5 truncate text-xs font-bold text-slate-900 dark:text-white">
                {batchName}
              </p>
            </div>
          </div>

          {/* Score highlight */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-[10px] text-slate-500">
                Total Marks
              </p>
              <p className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                {formatMarks(result.totalMarks)}
              </p>
            </div>

            <div className="rounded-xl border border-green-200 bg-green-50/70 p-3 dark:border-green-900 dark:bg-green-950/20">
              <p className="text-[10px] text-green-700 dark:text-green-400">
                Obtained
              </p>
              <p className="mt-1 text-base font-extrabold text-green-700 dark:text-green-400">
                {formatMarks(result.obtainedMarks)}
              </p>
            </div>

            <div className={`rounded-xl p-3 ${scoreTone}`}>
              <p className="text-[10px] font-medium opacity-80">
                Score
              </p>
              <p className="mt-1 text-base font-extrabold">
                {percentage.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="rounded-xl border border-violet-100 p-4 dark:border-violet-900/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Exam Performance
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Obtained marks compared with total marks
                </p>
              </div>

              <span className="text-lg font-extrabold text-violet-700 dark:text-violet-300">
                {percentage.toFixed(1)}%
              </span>
            </div>

            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-violet-600 transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Marks breakdown */}
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Marks Breakdown
              </h3>
              <p className="mt-1 text-[10px] text-slate-500">
                Subject and marks recorded for this examination
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Obtained</th>
                    <th className="px-4 py-3 text-right">Score</th>
                  </tr>
                </thead>

                <tbody>
                  <tr className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {result.subject || "—"}
                    </td>

                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                      {formatMarks(result.totalMarks)}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      {formatMarks(result.obtainedMarks)}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-violet-700 dark:text-violet-300">
                      {percentage.toFixed(1)}%
                    </td>
                  </tr>
                </tbody>

                <tfoot>
                  <tr className="bg-violet-50 font-bold text-slate-900 dark:bg-violet-950/30 dark:text-white">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right">
                      {formatMarks(result.totalMarks)}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600">
                      {formatMarks(result.obtainedMarks)}
                    </td>
                    <td className="px-4 py-3 text-right text-violet-700 dark:text-violet-300">
                      {percentage.toFixed(1)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-3 text-xs font-semibold text-green-700 dark:bg-green-950/30 dark:text-green-400">
            <CheckCircle2 size={16} />
            Result recorded and available in your student portal.
            <Award size={16} className="ml-auto shrink-0" />
          </div>
        </div>
      </section>
    </div>
  );
}