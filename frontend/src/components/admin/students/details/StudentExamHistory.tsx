"use client";

import StudentPager from "./StudentPager";

type ExamRecord = {
  examId: string;
  examDate: string;
  name: string;
  subject: string;
  batch?: { name: string };
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
};

type ExamData = {
  results: ExamRecord[];
  pagination: {
    page: number;
    total: number;
    totalPages: number;
  };
  summary: {
    examsTaken: number;
    totalObtained: number;
    totalPossible: number;
    overallAverage: number | null;
    subjectAverages: {
      subject: string;
      average: number;
      count: number;
    }[];
  };
};

type Props = {
  exams: ExamData | null;
  sectionError: string;
  buttonClass: string;
  tableClass: string;
  tableWrapperClass: string;
  emptyClass: string;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  date: (value?: string) => string;
};

export default function StudentExamHistory({
  exams,
  sectionError,
  buttonClass,
  tableClass,
  tableWrapperClass,
  emptyClass,
  onRetry,
  onPageChange,
  date,
}: Props) {
  return (
    <section className="min-w-0 space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Exam History
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Individual test results, subject averages and overall weighted
            average
          </p>
        </div>

        <div className="rounded-2xl bg-indigo-50 px-5 py-3 dark:bg-indigo-950/50">
          <strong className="block text-2xl font-bold text-indigo-700 dark:text-indigo-300">
            {exams?.summary.overallAverage === null ||
            exams?.summary.overallAverage === undefined
              ? "—"
              : exams.summary.overallAverage + "%"}
          </strong>
          <small className="text-xs text-slate-500 dark:text-slate-400">
            Overall average
          </small>
        </div>
      </div>

      {sectionError && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
          role="alert"
        >
          {sectionError}
          <button className={buttonClass} onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {exams?.summary.subjectAverages.map((item) => (
          <div
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
            key={item.subject}
          >
            <span className="block text-sm text-slate-600 dark:text-slate-300">
              {item.subject}
            </span>
            <strong className="mt-1 block text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {item.average}%
            </strong>
          </div>
        ))}

        {exams?.summary.subjectAverages.length === 0 && (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            No subject averages yet.
          </span>
        )}
      </div>

      <div className={tableWrapperClass}>
        <table className={tableClass}>
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              {[
                "Exam date",
                "Exam / Test",
                "Subject",
                "Batch",
                "Total marks",
                "Obtained",
                "Percentage",
              ].map((heading) => (
                <th className="px-4 py-3 font-semibold" key={heading}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {exams?.results.map((item) => (
              <tr
                className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                key={item.examId}
              >
                <td className="whitespace-nowrap px-4 py-3">
                  {date(item.examDate)}
                </td>

                <td className="px-4 py-3 font-semibold">
                  {item.name || item.subject}
                </td>

                <td className="px-4 py-3">{item.subject}</td>
                <td className="px-4 py-3">{item.batch?.name ?? "—"}</td>
                <td className="px-4 py-3">{item.totalMarks}</td>

                <td className="px-4 py-3 font-semibold">
                  {item.obtainedMarks}
                </td>

                <td className="px-4 py-3 font-semibold text-indigo-600 dark:text-indigo-400">
                  {item.percentage}%
                </td>
              </tr>
            ))}

            {!exams?.results.length && (
              <tr>
                <td colSpan={7} className={emptyClass}>
                  {sectionError || "No exam results recorded."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {exams?.pagination && (
        <StudentPager
          page={exams.pagination.page}
          totalPages={exams.pagination.totalPages}
          total={exams.pagination.total}
          onChange={onPageChange}
        />
      )}

      <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
        Weighted average = total obtained marks ÷ total possible marks × 100.
        Tests with missing marks are not counted.
      </div>
    </section>
  );
}