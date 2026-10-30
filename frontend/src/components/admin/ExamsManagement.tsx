"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type BatchOption = {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  active: boolean;
};

type Student = {
  _id: string;
  studentId?: string;
  name: string;
  className?: string;
  active?: boolean;
};

type Exam = {
  _id: string;
  examDate: string;
  name: string;
  subject: string;
  totalMarks: number;
  batch: BatchOption;
  studentsCount: number;
  averagePercentage: number | null;
  resultsEntered: number;
};

type ExamResultRow = {
  student: Student;
  obtainedMarks: number | null;
  percentage: number | null;
  saveStatus: string;
};

type ExamDetail = {
  exam: Exam;
  results: ExamResultRow[];
  summary: {
    studentsCount: number;
    entered: number;
    pending: number;
    averagePercentage: number | null;
    highestMarks: number | null;
    lowestMarks: number | null;
  };
};

type HistoryResult = {
  examId: string;
  examDate: string;
  name: string;
  subject: string;
  batch: BatchOption;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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

  const [draft, setDraft] = useState({
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

  const createExam = async (event: React.FormEvent<HTMLFormElement>) => {
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

  const saveMarks = async (event: React.FormEvent<HTMLFormElement>) => {
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
    "w-full min-w-[900px] border-collapse text-left text-sm";

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

  return (
    <section className="min-w-0 space-y-6 text-slate-800 dark:text-slate-100">
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
          className={primaryButtonClass}
          onClick={() => {
            setError("");
            setNotice("");
            setCreateOpen(true);
          }}
        >
          ＋ Create Exam
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            ▤
          </span>
          <div>
            <small className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Exams
            </small>
            <strong className="mt-1 block text-2xl font-bold text-slate-900 dark:text-white">
              {summary.totalExams.toLocaleString("en-IN")}
            </strong>
          </div>
        </article>

        <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            ✓
          </span>
          <div>
            <small className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Tests This Month
            </small>
            <strong className="mt-1 block text-2xl font-bold text-slate-900 dark:text-white">
              {summary.testsConductedThisMonth.toLocaleString("en-IN")}
            </strong>
          </div>
        </article>

        <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:col-span-2 xl:col-span-1">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-xl text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
            ♟
          </span>
          <div>
            <small className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Students Evaluated
            </small>
            <strong className="mt-1 block text-2xl font-bold text-slate-900 dark:text-white">
              {summary.studentsEvaluated.toLocaleString("en-IN")}
            </strong>
          </div>
        </article>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 xl:grid-cols-5">
        <label className="relative sm:col-span-2 xl:col-span-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">
            ⌕
          </span>
          <input
            className={`${inputClass} pl-9`}
            aria-label="Search exams"
            placeholder="Search exam or subject..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </label>

        <select
          className={selectClass}
          aria-label="Filter year"
          value={year}
          onChange={(event) => {
            setYear(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All years</option>
          {years.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

        <select
          className={selectClass}
          aria-label="Filter month"
          value={month}
          onChange={(event) => {
            setMonth(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All months</option>
          {MONTHS.map((item, index) => (
            <option key={item} value={String(index + 1)}>
              {item}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          aria-label="Filter batch"
          value={batchId}
          onChange={(event) => {
            setBatchId(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All batches</option>
          {batches.map((batch) => (
            <option key={batch._id} value={batch._id}>
              {batch.name}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          aria-label="Filter subject"
          value={subject}
          onChange={(event) => {
            setSubject(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All subjects</option>
          {subjects.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

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

      {notice && (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
          role="status"
        >
          {notice}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
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
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
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
                    <td className={`${cellClass} font-semibold text-slate-900 dark:text-white`}>
                      {exam.name || exam.subject}
                    </td>
                    <td className={cellClass}>
                      {exam.batch?.name ?? "Batch unavailable"}
                    </td>
                    <td className={cellClass}>{exam.subject}</td>
                    <td className={cellClass}>{exam.totalMarks}</td>
                    <td className={cellClass}>
                      {exam.studentsCount}
                      <small className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                        · {exam.resultsEntered} entered
                      </small>
                    </td>
                    <td className={`${cellClass} font-semibold`}>
                      {exam.averagePercentage === null
                        ? "—"
                        : exam.averagePercentage + "%"}
                    </td>
                    <td className={cellClass}>
                      <div className="flex min-w-[220px] flex-wrap gap-2">
                        <button
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          onClick={() => void openDetail(exam, false)}
                        >
                          View Results
                        </button>
                        <button
                          className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                          onClick={() => void openDetail(exam, true)}
                        >
                          Enter/Edit Marks
                        </button>
                        <button
                          className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
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
              disabled={page <= 1}
              onClick={() =>
                setPage((value) => Math.max(1, value - 1))
              }
            >
              Previous
            </button>
            <button
              className={buttonClass}
              disabled={page >= pagination.totalPages}
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

      {createOpen && (
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
                Exam / Test name <small className="font-normal text-slate-400">Optional</small>
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
      )}

      {detailLoading && (
        <div
          className="fixed bottom-5 right-5 z-40 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl"
          role="status"
        >
          Loading exam results…
        </div>
      )}

      {detail && !marksOpen && (
        <div
          className={modalBackdropClass}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetail(null);
          }}
        >
          <section
            className={`${modalClass} max-w-5xl`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="exam-results-title"
          >
            <button
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              onClick={() => setDetail(null)}
              aria-label="Close"
            >
              ×
            </button>

            <div className={sectionKickerClass}>EXAM RESULTS</div>
            <h2
              id="exam-results-title"
              className="mt-2 pr-8 text-2xl font-bold text-slate-900 dark:text-white"
            >
              {detail.exam.name || detail.exam.subject}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {date(detail.exam.examDate)} · {detail.exam.batch?.name} ·{" "}
              {detail.exam.subject} · {detail.exam.totalMarks} marks
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                {
                  label: "Average",
                  value:
                    detail.summary.averagePercentage === null
                      ? "—"
                      : detail.summary.averagePercentage + "%",
                },
                {
                  label: "Highest",
                  value: detail.summary.highestMarks ?? "—",
                },
                {
                  label: "Lowest",
                  value: detail.summary.lowestMarks ?? "—",
                },
                {
                  label: "Entered / Pending",
                  value:
                    detail.summary.entered + " / " + detail.summary.pending,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60"
                >
                  <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                    {item.label}
                  </span>
                  <strong className="mt-2 block text-xl font-bold text-slate-900 dark:text-white">
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
                        <th className="px-4 py-3.5" key={heading}>
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((row) => (
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
                      <td className={cellClass}>
                        {row.obtainedMarks === null
                          ? "—"
                          : row.obtainedMarks + " / " + detail.exam.totalMarks}
                      </td>
                      <td className={cellClass}>
                        {row.percentage === null ? "—" : row.percentage + "%"}
                      </td>
                      <td className={cellClass}>
                        <span className={statusClass(row.obtainedMarks === null)}>
                          {row.saveStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
              <button
                className={buttonClass}
                onClick={() => setDetail(null)}
              >
                Close
              </button>
              <button
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
      )}

      {marksOpen && detail && (
        <div
          className={modalBackdropClass}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMarksOpen(false);
          }}
        >
          <section
            className={`${modalClass} max-w-6xl`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="exam-marks-title"
          >
            <button
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              onClick={() => setMarksOpen(false)}
              aria-label="Close"
            >
              ×
            </button>

            <div className={sectionKickerClass}>BATCH-WISE MARKS</div>
            <h2
              id="exam-marks-title"
              className="mt-2 pr-8 text-2xl font-bold text-slate-900 dark:text-white"
            >
              {detail.exam.name || detail.exam.subject}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {date(detail.exam.examDate)} · {detail.exam.batch?.name} ·{" "}
              {detail.exam.subject} · Total {detail.exam.totalMarks} marks
            </p>

            <form onSubmit={(event) => void saveMarks(event)}>
              <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
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
                        <th className="px-4 py-3.5" key={heading}>
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
                              className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-indigo-900"
                              aria-label={
                                "Obtained marks for " + row.student.name
                              }
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
                            {value === null ||
                            value < 0 ||
                            value > detail.exam.totalMarks
                              ? "—"
                              : (
                                  (value / detail.exam.totalMarks) *
                                  100
                                ).toFixed(2) + "%"}
                          </td>
                          <td className={cellClass}>
                            <span className={statusClass(value === null)}>
                              {value === null ? "Not Entered" : "Ready to save"}
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
                          No active students were assigned when this exam was created.
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

              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
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
      )}
    </section>
  );
}

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

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
                    <td className={`${cellClass} font-semibold text-indigo-600 dark:text-indigo-400`}>
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