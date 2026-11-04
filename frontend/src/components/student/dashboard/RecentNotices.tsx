
import EmptyState from "../ui/EmptyState";

export interface StudentNotice {
  _id: string;
  title?: string;
  message?: string;
  createdAt?: string;
}

interface RecentNoticesProps {
  notices: StudentNotice[];
}

export default function RecentNotices({ notices }: RecentNoticesProps) {
  if (!notices.length) {
    return (
      <EmptyState
        title="No notices available"
        description="New announcements from your tuition admin will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {notices.map((notice) => (
        <article
          key={notice._id}
          className="flex gap-3 rounded-xl border border-gray-100 p-4 dark:border-gray-800"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01M4.5 19.5h15a1 1 0 0 0 .87-1.5l-7.5-13a1 1 0 0 0-1.74 0l-7.5 13a1 1 0 0 0 .87 1.5Z"
              />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {notice.title || "Notice"}
            </h4>

            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">
              {notice.message || ""}
            </p>

            {notice.createdAt && (
              <p className="mt-2 text-xs text-gray-400">
                {new Date(notice.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
