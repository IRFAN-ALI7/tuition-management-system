
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";

import {
  MONTHS,
  type BatchOption,
  type Exam,
  type ExamDetail,
  type ExamDraft,
  type ExamResultRow,
  type HistoryResult,
} from "./examTypes";

import { ExamFilters } from "./ExamFilters";
import { ExamForm } from "./ExamForm";
import { ExamResults } from "./ExamResults";
import { MarksModal } from "./MarksModal";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const time = (value: string) => {
  const [h, m] = value.split(":").map(Number);

  return (
    (h % 12 || 12) +
    ":" +
    String(m).padStart(2, "0") +
    " " +
    (h >= 12 ? "PM" : "AM")
  );
};

const date = (value: string) =>
  new Date(value + "T12:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

async function examApi(path: string, init: RequestInit = {}) {
  const response = await fetch(API + path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error ?? "Request failed. Please try again.");
  }

  return data;
}

export function ExamsManagement({ batches }: { batches: BatchOption[] }) {
  const now = new Date();

  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");
  const [batchId, setBatchId] = useState("all");
  const [subject, setSubject] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);

  const [summary, setSummary] = useState({
    totalExams: 0,
    testsConductedThisMonth: 0,
    studentsEvaluated: 0,
  });

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState<ExamDraft>({
    examDate:
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0"),
    name: "",
    batchId: "",
    subject: "",
    totalMarks: "",
  });

  const [detail, setDetail] = useState<ExamDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [marksOpen, setMarksOpen] = useState(false);
  const [markDraft, setMarkDraft] = useState<Record<string, string>>({});
  const [markError, setMarkError] = useState("");
  const [markSaving, setMarkSaving] = useState(false);
  const [sortBy, setSortBy] = useState("percentage");

  const loadExams = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        year,
        month,
        batchId,
        subject,
        q: query,
        page: String(page),
        limit: "20",
      });

      const data = await examApi("/exams?" + params.toString());

      setExams(data.exams);
      setSubjects(data.subjects);
      setSummary(data.summary);
      setPagination(data.pagination);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load exams."
      );
    } finally {
      setLoading(false);
    }
  }, [year, month, batchId, subject, query, page, setError]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadExams();
    }, query ? 250 : 0);

    return () => window.clearTimeout(timer);
  }, [loadExams, query]);

  const openDetail = async (exam: Exam, edit: boolean) => {
    setDetail(null);
    setDetailLoading(true);
    setMarkError("");
    setNotice("");

    try {
      const data = (await examApi("/exams/" + exam._id)) as ExamDetail;

      setDetail(data);

      if (edit) {
        setMarkDraft(
          Object.fromEntries(
            data.results.map((row) => [
              row.student._id,
              row.obtainedMarks === null ? "" : String(row.obtainedMarks),
            ])
          )
        );

        setMarksOpen(true);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load exam results."
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const createExam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const parsed = Number(draft.totalMarks);

    if (
      !draft.examDate ||
      !draft.batchId ||
      !draft.subject.trim() ||
      !Number.isFinite(parsed) ||
      parsed <= 0
    ) {
      setError(
        "Enter an exam date, active batch, subject and positive total marks."
      );
      setSaving(false);
      return;
    }

    try {
      const data = await examApi("/exams", {
        method: "POST",
        body: JSON.stringify({
          ...draft,
          subject: draft.subject.trim(),
          totalMarks: parsed,
        }),
      });

      setCreateOpen(false);
      setPage(1);

      await loadExams();

      setNotice("Exam created. Enter marks for the active students.");

      await openDetail(data.exam as Exam, true);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not create the exam."
      );
    } finally {
      setSaving(false);
    }
  };

  const saveMarks = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!detail) return;

    setMarkError("");

    const entries = detail.results.map((row) => {
      const raw = (markDraft[row.student._id] ?? "").trim();

      if (!raw) {
        return {
          studentId: row.student._id,
          obtainedMarks: null,
        };
      }

      const value = Number(raw);

      if (
        !Number.isFinite(value) ||
        value < 0 ||
        value > detail.exam.totalMarks
      ) {
        throw new Error(
          "Marks for " +
            row.student.name +
            " must be between 0 and " +
            detail.exam.totalMarks +
            "."
        );
      }

      return {
        studentId: row.student._id,
        obtainedMarks: value,
      };
    });

    try {
      setMarkSaving(true);

      await examApi("/exams/" + detail.exam._id + "/results", {
        method: "PUT",
        body: JSON.stringify({ results: entries }),
      });

      const refreshed = (await examApi(
        "/exams/" + detail.exam._id
      )) as ExamDetail;

      setDetail(refreshed);

      setMarkDraft(
        Object.fromEntries(
          refreshed.results.map((row) => [
            row.student._id,
            row.obtainedMarks === null ? "" : String(row.obtainedMarks),
          ])
        )
      );

      setNotice("Marks saved successfully.");

      await loadExams();
    } catch (caught) {
      setMarkError(
        caught instanceof Error ? caught.message : "Could not save marks."
      );
    } finally {
      setMarkSaving(false);
    }
  };

  const deleteExam = async (exam: Exam) => {
    const confirmed = window.confirm(
      "Delete " +
        (exam.name || exam.subject) +
        " on " +
        date(exam.examDate) +
        "? This permanently removes the exam and its marks from every student's exam history. Student, attendance and fee records are not affected."
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await examApi("/exams/" + exam._id, { method: "DELETE" });

      setNotice("Exam and associated marks deleted.");

      await loadExams();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not delete exam."
      );
    }
  };

  const sortedResults = useMemo(
    () =>
      detail
        ? [...detail.results].sort((a, b) => {
            const left =
              sortBy === "marks" ? a.obtainedMarks : a.percentage;
            const right =
              sortBy === "marks" ? b.obtainedMarks : b.percentage;

            if (left === null) return 1;
            if (right === null) return -1;

            return right - left;
          })
        : [],
    [detail, sortBy]
  );

  const years = Array.from(
    { length: Math.max(1, now.getFullYear() - 1999) },
    (_, index) => String(now.getFullYear() - index)
  );

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-900";

  const selectClass =
    "min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-indigo-900";

  const buttonClass =
    "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

  const primaryButtonClass =
    "inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50";

  const tableClass =
    "w-full min-w-[1050px] border-collapse text-left text-sm";

  const tableHeaderClass =
    "border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

  const cellClass =
    "border-b border-slate-100 px-4 py-3.5 align-middle text-slate-700 dark:border-slate-800 dark:text-slate-300";

  const modalBackdropClass =
    "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm";

  const modalClass =
    "relative my-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-7";

  const labelClass =
    "flex flex-col gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200";

  const sectionKickerClass =
    "text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400";

  const statusClass = (pending: boolean) =>
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold " +
    (pending
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300");

  // Reset pagination whenever a filter changes.
  const updateQuery: Dispatch<SetStateAction<string>> = (value) => {
    setQuery(value);
    setPage(1);
  };

  const updateYear: Dispatch<SetStateAction<string>> = (value) => {
    setYear(value);
    setPage(1);
  };

  const updateMonth: Dispatch<SetStateAction<string>> = (value) => {
    setMonth(value);
    setPage(1);
  };

  const updateBatchId: Dispatch<SetStateAction<string>> = (value) => {
    setBatchId(value);
    setPage(1);
  };

  const updateSubject: Dispatch<SetStateAction<string>> = (value) => {
    setSubject(value);
    setPage(1);
  };

  return (
    <section className="min-w-0 space-y-6 text-slate-800 dark:text-slate-100">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Exams Management
          </h1>

          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Schedule tests, record marks and review student progress.
          </p>
        </div>

        <button
          className={`${primaryButtonClass} w-full sm:w-auto`}
          onClick={() => {
            setError("");
            setNotice("");
            setCreateOpen(true);
          }}
        >
          ＋ Create Exam
        </button>
      </div>

      {/* SUMMARY CARDS - ALWAYS ONE ROW */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <article className="flex min-w-0 flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:gap-4 sm:rounded-2xl sm:p-5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-sm text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 sm:h-12 sm:w-12 sm:text-xl">
            ▤
          </span>

          <div className="min-w-0">
            <small className="block text-[10px] leading-tight text-slate-500 dark:text-slate-400 sm:text-sm">
              Total Exams
            </small>

            <strong className="mt-1 block text-lg font-bold text-slate-900 dark:text-white sm:text-2xl">
              {summary.totalExams.toLocaleString("en-IN")}
            </strong>
          </div>
        </article>

        <article className="flex min-w-0 flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:gap-4 sm:rounded-2xl sm:p-5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-sm text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 sm:h-12 sm:w-12 sm:text-xl">
            ✓
          </span>

          <div className="min-w-0">
            <small className="block text-[10px] leading-tight text-slate-500 dark:text-slate-400 sm:text-sm">
              Tests This Month
            </small>

            <strong className="mt-1 block text-lg font-bold text-slate-900 dark:text-white sm:text-2xl">
              {summary.testsConductedThisMonth.toLocaleString("en-IN")}
            </strong>
          </div>
        </article>

        <article className="flex min-w-0 flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:gap-4 sm:rounded-2xl sm:p-5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-sm text-violet-600 dark:bg-violet-950/60 dark:text-violet-400 sm:h-12 sm:w-12 sm:text-xl">
            ♟
          </span>

          <div className="min-w-0">
            <small className="block text-[10px] leading-tight text-slate-500 dark:text-slate-400 sm:text-sm">
              Students Evaluated
            </small>

            <strong className="mt-1 block text-lg font-bold text-slate-900 dark:text-white sm:text-2xl">
              {summary.studentsEvaluated.toLocaleString("en-IN")}
            </strong>
          </div>
        </article>
      </div>

      {/* FILTERS */}
      <ExamFilters
        query={query}
        setQuery={updateQuery}
        year={year}
        setYear={updateYear}
        month={month}
        setMonth={updateMonth}
        batchId={batchId}
        setBatchId={updateBatchId}
        subject={subject}
        setSubject={updateSubject}
        years={years}
        batches={batches}
        subjects={subjects}
        inputClass={inputClass}
        selectClass={selectClass}
      />

      {/* ERROR */}
      {error && (
        <div
          className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <span>{error}</span>

          <button className={buttonClass} onClick={() => void loadExams()}>
            Retry
          </button>
        </div>
      )}

      {/* SUCCESS NOTICE */}
      {notice && (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
          role="status"
        >
          {notice}
        </div>
      )}

      {/* EXAM RECORDS - SAME TABLE ON ALL SCREEN SIZES */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Exam Records
            </h2>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              View exams, check results or update student marks.
            </p>
          </div>

          <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
            {pagination.total} records
          </span>
        </div>

        {/* Horizontal scroll on mobile; normal table on desktop */}
        <div className="w-full overflow-x-auto">
          <table className={tableClass}>
            <thead className={tableHeaderClass}>
              <tr>
                {[
                  "Exam Date",
                  "Exam / Test",
                  "Batch",
                  "Subject",
                  "Total Marks",
                  "Students",
                  "Average",
                  "Actions",
                ].map((heading) => (
                  <th className="whitespace-nowrap px-4 py-4" key={heading}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    Loading exams…
                  </td>
                </tr>
              ) : (
                exams.map((exam) => (
                  <tr
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    key={exam._id}
                  >
                    <td className={`${cellClass} whitespace-nowrap`}>
                      {date(exam.examDate)}
                    </td>

                    <td
                      className={`${cellClass} whitespace-nowrap font-semibold text-slate-900 dark:text-white`}
                    >
                      {exam.name || exam.subject}
                    </td>

                    <td className={`${cellClass} whitespace-nowrap`}>
                      {exam.batch?.name ?? "Batch unavailable"}
                    </td>

                    <td className={cellClass}>{exam.subject}</td>

                    <td className={cellClass}>{exam.totalMarks}</td>

                    <td className={`${cellClass} whitespace-nowrap`}>
                      {exam.studentsCount}

                      <small className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                        · {exam.resultsEntered} entered
                      </small>
                    </td>

                    <td className={`${cellClass} whitespace-nowrap font-semibold`}>
                      {exam.averagePercentage === null
                        ? "—"
                        : exam.averagePercentage + "%"}
                    </td>

                    <td className={cellClass}>
                      <div className="flex min-w-[220px] flex-nowrap gap-2">
                        <button
                          className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          onClick={() => void openDetail(exam, false)}
                        >
                          View Results
                        </button>

                        <button
                          className="whitespace-nowrap rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                          onClick={() => void openDetail(exam, true)}
                        >
                          Enter/Edit Marks
                        </button>

                        <button
                          className="whitespace-nowrap rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
                          onClick={() => void deleteExam(exam)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {!loading && !exams.length && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    {error
                      ? "Could not load exams."
                      : "No exams found for these filters. Create an exam to get started."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {pagination.total
              ? "Page " +
                page +
                " of " +
                pagination.totalPages +
                " · " +
                pagination.total +
                " exams"
              : "No exams"}
          </span>

          <div className="flex gap-2">
            <button
              className={buttonClass}
              disabled={page <= 1 || loading}
              onClick={() =>
                setPage((value) => Math.max(1, value - 1))
              }
            >
              Previous
            </button>

            <button
              className={buttonClass}
              disabled={page >= pagination.totalPages || loading}
              onClick={() =>
                setPage((value) =>
                  Math.min(pagination.totalPages, value + 1)
                )
              }
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CREATE EXAM MODAL */}
      <ExamForm
        createOpen={createOpen}
        setCreateOpen={setCreateOpen}
        draft={draft}
        setDraft={setDraft}
        batches={batches}
        subjects={subjects}
        error={error}
        saving={saving}
        inputClass={inputClass}
        labelClass={labelClass}
        buttonClass={buttonClass}
        primaryButtonClass={primaryButtonClass}
        modalBackdropClass={modalBackdropClass}
        modalClass={modalClass}
        sectionKickerClass={sectionKickerClass}
        time={time}
        createExam={createExam}
      />

      {/* DETAIL LOADER */}
      {detailLoading && (
        <div
          className="fixed bottom-5 right-5 z-40 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl"
          role="status"
        >
          Loading exam results…
        </div>
      )}

      {/* RESULTS MODAL */}
      <ExamResults
        detail={marksOpen ? null : detail}
        sortedResults={sortedResults}
        sortBy={sortBy}
        setSortBy={setSortBy}
        setDetail={setDetail}
        setMarkDraft={setMarkDraft}
        setMarksOpen={setMarksOpen}
        modalBackdropClass={modalBackdropClass}
        modalClass={modalClass}
        sectionKickerClass={sectionKickerClass}
        labelClass={labelClass}
        inputClass={inputClass}
        tableClass={tableClass}
        tableHeaderClass={tableHeaderClass}
        cellClass={cellClass}
        buttonClass={buttonClass}
        primaryButtonClass={primaryButtonClass}
        date={date}
        statusClass={statusClass}
      />

      {/* MARKS MODAL */}
      <MarksModal
        marksOpen={marksOpen}
        detail={detail}
        markDraft={markDraft}
        setMarkDraft={setMarkDraft}
        markError={markError}
        markSaving={markSaving}
        setMarksOpen={setMarksOpen}
        saveMarks={saveMarks}
        modalBackdropClass={modalBackdropClass}
        modalClass={modalClass}
        sectionKickerClass={sectionKickerClass}
        tableClass={tableClass}
        tableHeaderClass={tableHeaderClass}
        cellClass={cellClass}
        buttonClass={buttonClass}
        primaryButtonClass={primaryButtonClass}
        date={date}
        statusClass={statusClass}
      />
    </section>
  );
}

/* =========================================================
   STUDENT EXAM HISTORY
========================================================= */

export function StudentExamHistory({ studentId }: { studentId: string }) {
  const [results, setResults] = useState<HistoryResult[]>([]);

  const [summary, setSummary] = useState<{
    examsTaken: number;
    overallAverage: number | null;
    subjectAverages: {
      subject: string;
      average: number;
      count: number;
    }[];
  }>({
    examsTaken: 0,
    overallAverage: null,
    subjectAverages: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await examApi("/exams/students/" + studentId + "/history");

      setResults(data.results);
      setSummary(data.summary);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load exam history."
      );
    } finally {
      setLoading(false);
    }
  }, [studentId, setError]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const trend = results.slice(-10);

  const tableClass =
    "w-full min-w-[760px] border-collapse text-left text-sm";

  const tableHeaderClass =
    "border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

  const cellClass =
    "border-b border-slate-100 px-4 py-3.5 align-middle text-slate-700 dark:border-slate-800 dark:text-slate-300";

  return (
    <section className="min-w-0 space-y-6 text-slate-800 dark:text-slate-100">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <small className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Overall average
          </small>

          <strong className="mt-2 block text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {summary.overallAverage === null
              ? "—"
              : summary.overallAverage + "%"}
          </strong>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <small className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Tests recorded
          </small>

          <strong className="mt-2 block text-3xl font-bold text-slate-900 dark:text-white">
            {summary.examsTaken}
          </strong>
        </article>
      </div>

      {summary.subjectAverages.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Subject averages
          </h3>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summary.subjectAverages.map((item) => (
              <span
                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                key={item.subject}
              >
                {item.subject}

                <strong className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {item.average}%
                </strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {trend.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Performance trend
          </h3>

          <div className="mt-5 flex h-48 items-end gap-3 overflow-x-auto border-b border-slate-200 pb-2 dark:border-slate-700">
            {trend.map((item) => (
              <div
                className="flex h-full min-w-12 flex-1 flex-col items-center justify-end gap-2"
                title={
                  item.examDate +
                  " · " +
                  item.subject +
                  " · " +
                  item.percentage +
                  "%"
                }
                key={item.examId}
              >
                <i
                  className="block w-full max-w-10 rounded-t-lg bg-indigo-500 transition-all"
                  style={{ height: Math.max(8, item.percentage) + "%" }}
                />

                <small className="whitespace-nowrap text-[10px] text-slate-500 dark:text-slate-400">
                  {date(item.examDate).slice(0, 6)}
                </small>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div
          className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          {error}

          <button
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            onClick={() => void load()}
          >
            Retry
          </button>
        </div>
      )}

      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead className={tableHeaderClass}>
              <tr>
                {[
                  "Exam Date",
                  "Test",
                  "Subject",
                  "Batch",
                  "Total",
                  "Obtained",
                  "Percentage",
                ].map((heading) => (
                  <th className="whitespace-nowrap px-4 py-4" key={heading}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    Loading exam history…
                  </td>
                </tr>
              ) : (
                results.map((item) => (
                  <tr
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    key={item.examId}
                  >
                    <td className={`${cellClass} whitespace-nowrap`}>
                      {date(item.examDate)}
                    </td>

                    <td className={`${cellClass} font-medium`}>
                      {item.name || item.subject}
                    </td>

                    <td className={cellClass}>{item.subject}</td>

                    <td className={cellClass}>{item.batch?.name ?? "—"}</td>

                    <td className={cellClass}>{item.totalMarks}</td>

                    <td className={cellClass}>{item.obtainedMarks}</td>

                    <td
                      className={`${cellClass} font-semibold text-indigo-600 dark:text-indigo-400`}
                    >
                      {item.percentage}%
                    </td>
                  </tr>
                ))
              )}

              {!loading && !results.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No exam results recorded for this student yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
