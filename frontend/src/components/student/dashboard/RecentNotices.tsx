
import Link from "next/link";

export interface StudentNotice {
  _id: string;
  title?: string;
  message?: string;
  recipientType?: string;
  createdAt?: string;
}

function formatDate(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function RecentNotices({
  notices,
}: {
  notices: StudentNotice[];
}) {
  if (!notices.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-700">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
          </svg>
        </div>

        <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-white">
          No notices available
        </p>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          New announcements from your Tuition Admin will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notices.map((notice) => (
        <article
          key={notice._id}
          className="flex min-w-0 gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800 sm:p-4"
        >
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
              <path d="m3 11 18-5-5 18-4-8-9-5Z" />
              <path d="m12 16 5-5" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="min-w-0 flex-1 text-sm font-bold text-slate-900 dark:text-white">
                {notice.title || "Notice"}
              </h3>

              {notice.createdAt && (
                <time className="shrink-0 text-[10px] text-slate-400 sm:text-xs">
                  {formatDate(notice.createdAt)}
                </time>
              )}
            </div>

            {notice.message && (
              <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600 dark:text-slate-400">
                {notice.message}
              </p>
            )}
          </div>
        </article>
      ))}

      <Link
        href="/student/notices"
        className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 dark:bg-slate-800 dark:text-violet-400 dark:hover:bg-violet-950/40"
      >
        View all announcements
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
