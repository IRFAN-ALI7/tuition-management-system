
import Link from "next/link";

export interface StudentResult {
  _id: string;
  obtainedMarks: number;
  exam?: {
    _id: string;
    name?: string;
    subject?: string;
    examDate?: string;
    totalMarks?: number;
    percentage?: number;
  } | null;
}

interface RecentResultsProps {
  results: StudentResult[];
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function RecentResults({
  results,
}: RecentResultsProps) {
  if (!results.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-700">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
            <path d="M14 3v5h5M8 13h8M8 17h6" />
          </svg>
        </div>

        <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-white">
          No exam results yet
        </p>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Your published results will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((result) => {
        const exam = result.exam;
        const totalMarks = Number(exam?.totalMarks ?? 0);
        const obtainedMarks = Number(result.obtainedMarks ?? 0);

        const percentage =
          exam?.percentage !== undefined
            ? Number(exam.percentage)
            : totalMarks > 0
              ? (obtainedMarks / totalMarks) * 100
              : 0;

        const passed = percentage >= 33;

        return (
          <article
            key={result._id}
            className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:p-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                  <path d="M14 3v5h5M8 13h8M8 17h5" />
                </svg>
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {exam?.name || "Examination"}
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                  {exam?.subject || "Subject not specified"}
                </p>

                <p className="mt-1 text-[11px] text-slate-400">
                  {formatDate(exam?.examDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
              <div>
                <p className="text-[10px] text-slate-400">Marks obtained</p>
                <p className="mt-0.5 text-sm font-bold text-slate-800 dark:text-white">
                  {obtainedMarks}
                  {totalMarks > 0 ? ` / ${totalMarks}` : ""}
                </p>
              </div>

              <div className="text-right">
                <span
                  className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
                    passed
                      ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                  }`}
                >
                  {percentage.toFixed(1)}%
                </span>

                <p className="mt-1 text-[10px] font-medium text-slate-400">
                  {passed ? "Passed" : "Needs improvement"}
                </p>
              </div>
            </div>
          </article>
        );
      })}

      <Link
        href="/student/exams"
        className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 dark:bg-slate-800 dark:text-violet-400 dark:hover:bg-violet-950/40"
      >
        View complete exam history
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
