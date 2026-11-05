
"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Check,
  MoreHorizontal,
} from "lucide-react";

import type {
  ExamPagination,
  ExamResult,
} from "@/types/student-exams";

import {
  formatExamDate,
  formatMarks,
} from "@/types/student-exams";

interface Props {
  results: ExamResult[];
  subjects: string[];
  selectedSubject: string;
  onSubjectChange: (subject: string) => void;
  onView: (result: ExamResult) => void;
  pagination: ExamPagination;
  onPageChange: (page: number) => void;
}

function ScoreBadge({ score }: { score: number }) {
  const style =
    score >= 80
      ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
      : score >= 60
        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
        : score >= 40
          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
          : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400";

  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${style}`}>
      {score.toFixed(1)}%
    </span>
  );
}

function getPageItems(current: number, total: number): (number | "...")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, 4, "...", total];
  }

  if (current >= total - 2) {
    return [1, "...", total - 3, total - 2, total - 1, total];
  }

  return [1, "...", current - 1, current, current + 1, "...", total];
}

export default function ExamList({
  results,
  subjects,
  selectedSubject,
  onSubjectChange,
  onView,
  pagination,
  onPageChange,
}: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = [
    { label: "All Exams", value: "all" },
    ...subjects.map((subject) => ({
      label: subject,
      value: subject,
    })),
  ];

  const selectedLabel =
    options.find((option) => option.value === selectedSubject)?.label ??
    "All Exams";

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSelect(value: string) {
    onSubjectChange(value);
    setDropdownOpen(false);
  }

  const pageItems = getPageItems(
    pagination.page,
    pagination.totalPages
  );

  const firstItem =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) * pagination.limit + 1;

  const lastItem = Math.min(
    pagination.page * pagination.limit,
    pagination.total
  );

  return (
    <section className="relative rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:px-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Exam List
          </h2>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            All your published examination results
          </p>
        </div>

        {/* Custom subject dropdown */}
        <div
          ref={dropdownRef}
          className="relative z-30 w-full sm:w-56"
        >
          <button
            type="button"
            onClick={() => setDropdownOpen((value) => !value)}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm outline-none transition dark:bg-slate-950 dark:text-slate-200 ${
              dropdownOpen
                ? "border-violet-500 ring-2 ring-violet-100 dark:ring-violet-950"
                : "border-slate-200 hover:border-violet-300 dark:border-slate-700 dark:hover:border-violet-800"
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Filter
                size={15}
                className="shrink-0 text-violet-600 dark:text-violet-400"
              />

              <span className="truncate">{selectedLabel}</span>
            </span>

            <ChevronDown
              size={15}
              className={`shrink-0 text-slate-400 transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <div
              role="listbox"
              aria-label="Filter exams by subject"
              className="absolute right-0 top-full z-50 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            >
              {options.map((option) => {
                const active = selectedSubject === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => handleSelect(option.value)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-3 text-left text-xs font-semibold transition ${
                      active
                        ? "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>

                    {active && (
                      <Check
                        size={15}
                        className="shrink-0 text-violet-600 dark:text-violet-400"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {results.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300">
            <CalendarDays size={22} />
          </div>

          <p className="mt-3 text-sm font-bold text-slate-800 dark:text-white">
            No exam results found
          </p>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Your results will appear here once they are published.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <th className="px-4 py-3">Exam / Test</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Total Marks</th>
                  <th className="px-4 py-3 text-right">Obtained</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {results.map((result) => (
                  <tr
                    key={result._id}
                    className="border-b border-slate-100 transition last:border-0 hover:bg-violet-50/50 dark:border-slate-800 dark:hover:bg-violet-950/10"
                  >
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                      {result.name || "Examination"}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {result.subject || "—"}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {formatExamDate(result.examDate)}
                    </td>

                    <td className="px-4 py-3.5 text-right text-slate-600 dark:text-slate-300">
                      {formatMarks(result.totalMarks)}
                    </td>

                    <td className="px-4 py-3.5 text-right font-bold text-green-600">
                      {formatMarks(result.obtainedMarks)}
                    </td>

                    <td className="px-4 py-3.5">
                      <ScoreBadge score={result.percentage} />
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700 dark:bg-green-950/40 dark:text-green-400">
                        Completed
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onView(result)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 px-3 py-1.5 text-[10px] font-bold text-violet-700 transition hover:bg-violet-50 dark:border-violet-900 dark:text-violet-300 dark:hover:bg-violet-950/40"
                      >
                        <Eye size={13} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2.5 p-3 md:hidden">
            {results.map((result) => (
              <div
                key={result._id}
                className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                      {result.name || "Examination"}
                    </p>

                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                      {result.subject || "—"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onView(result)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-violet-700 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-violet-800"
                  >
                    <Eye size={12} />
                    View
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800">
                  <div>
                    <p className="text-[9px] text-slate-500">Date</p>
                    <p className="mt-1 text-[10px] font-semibold text-slate-800 dark:text-white">
                      {formatExamDate(result.examDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] text-slate-500">Marks</p>
                    <p className="mt-1 text-[10px] font-semibold text-slate-800 dark:text-white">
                      {formatMarks(result.obtainedMarks)} /{" "}
                      {formatMarks(result.totalMarks)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] text-slate-500">Score</p>
                    <div className="mt-0.5">
                      <ScoreBadge score={result.percentage} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Numbered pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 px-3 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-center text-[10px] text-slate-500 sm:text-left sm:text-xs">
                Showing{" "}
                <span className="font-bold text-slate-800 dark:text-white">
                  {firstItem}–{lastItem}
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-800 dark:text-white">
                  {pagination.total}
                </span>{" "}
                exams
              </p>

              <div className="flex items-center justify-center gap-1">
                {/* Previous */}
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => onPageChange(pagination.page - 1)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page numbers */}
                {pageItems.map((item, index) =>
                  item === "..." ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="grid h-8 w-7 place-items-center text-slate-400"
                    >
                      <MoreHorizontal size={16} />
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onPageChange(item)}
                      aria-label={`Go to page ${item}`}
                      aria-current={
                        pagination.page === item ? "page" : undefined
                      }
                      className={`h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition ${
                        pagination.page === item
                          ? "bg-violet-700 text-white shadow-sm"
                          : "border border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-violet-950/30"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

                {/* Next */}
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => onPageChange(pagination.page + 1)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
