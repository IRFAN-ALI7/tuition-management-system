
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import PageHeader from "@/components/student/ui/PageHeader";
import SectionCard from "@/components/student/ui/SectionCard";
import LoadingState from "@/components/student/ui/LoadingState";
import EmptyState from "@/components/student/ui/EmptyState";

interface Notice {
  _id: string;
  title?: string;
  message?: string;
  recipientType?: string;
  createdAt?: string;
}

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

function audienceLabel(value?: string) {
  switch (value) {
    case "ALL_STUDENTS":
      return "All Students";
    case "BATCH_WISE":
      return "Your Batch";
    case "SINGLE_STUDENT":
      return "Personal Notice";
    default:
      return "Announcement";
  }
}

export default function StudentNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadNotices() {
      try {
        const response = await api("/student/notices");
        if (!cancelled) setNotices(response.notices ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load notices."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadNotices();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notices & Announcements"
        description="Important updates from your Tuition Admin."
      />

      {error && (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}

      <SectionCard
        title="All Notices"
        description="Notices relevant to you and your batch."
      >
        {loading ? (
          <LoadingState message="Loading notices..." />
        ) : notices.length === 0 ? (
          <EmptyState
            title="No announcements yet"
            description="New notices from your Tuition Admin will appear here."
          />
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <article
                key={notice._id}
                className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
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
                        d="M12 18h.01M12 14a3 3 0 1 0-3-3m3 3v-1m0-10v2m8 6h-2M6 12H4m13.66-5.66-1.42 1.42M7.76 16.24l-1.42 1.42"
                      />
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {notice.title || "Announcement"}
                      </h3>
                      <span className="shrink-0 text-xs text-gray-400">
                        {formatDate(notice.createdAt)}
                      </span>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-300">
                      {notice.message || "No additional details."}
                    </p>

                    <span className="mt-3 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {audienceLabel(notice.recipientType)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
