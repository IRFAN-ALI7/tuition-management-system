
"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";

import { api } from "@/lib/api";

import PageHeader from "@/components/student/ui/PageHeader";
import LoadingState from "@/components/student/ui/LoadingState";

import NoticeSummaryCards from "@/components/student/notices/NoticeSummaryCards";
import NoticeList from "@/components/student/notices/NoticeList";
import NoticeDetails from "@/components/student/notices/NoticeDetails";

import type {
  NoticeAudience,
  NoticePagination,
  NoticeSummary,
  StudentNotice,
  StudentNoticeResponse,
} from "@/types/student-notices";

import {
  DEFAULT_NOTICE_PAGINATION,
  DEFAULT_NOTICE_SUMMARY,
} from "@/types/student-notices";

export default function StudentNoticesPage() {
  const [notices, setNotices] = useState<StudentNotice[]>([]);

  const [summary, setSummary] = useState<NoticeSummary>(
    DEFAULT_NOTICE_SUMMARY
  );

  const [pagination, setPagination] = useState<NoticePagination>(
    DEFAULT_NOTICE_PAGINATION
  );

  const [audience, setAudience] = useState<NoticeAudience>("all");
  const [page, setPage] = useState(1);

  const [selectedNotice, setSelectedNotice] =
    useState<StudentNotice | null>(null);

  const [mobileOpen, setMobileOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadNotices() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "10",
          audience,
        });

        const response = (await api(
          `/student/notices?${params.toString()}`
        )) as StudentNoticeResponse;

        if (cancelled) return;

        const nextNotices = response.notices ?? [];

        setNotices(nextNotices);

        setSummary({
          ...DEFAULT_NOTICE_SUMMARY,
          ...response.summary,
        });

        setPagination({
          ...DEFAULT_NOTICE_PAGINATION,
          ...response.pagination,
        });

        setSelectedNotice(
          nextNotices.find(
            (notice) => notice._id === selectedNotice?._id
          ) ?? nextNotices[0] ?? null
        );

        setMobileOpen(false);
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load notices."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadNotices();

    return () => {
      cancelled = true;
    };
  }, [page, audience, retryCount]);

  const handleAudienceChange = useCallback(
    (nextAudience: NoticeAudience) => {
      setAudience(nextAudience);
      setPage(1);
      setSelectedNotice(null);
      setMobileOpen(false);
    },
    []
  );

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
    setSelectedNotice(null);
    setMobileOpen(false);
  }, []);

  const handleNoticeSelect = useCallback(
    (notice: StudentNotice) => {
      setSelectedNotice(notice);
      setMobileOpen(true);
    },
    []
  );

  const handleCloseDetails = useCallback(() => {
    setMobileOpen(false);
  }, []);

  if (loading && notices.length === 0 && page === 1) {
    return <LoadingState message="Loading your notices..." />;
  }

  return (
    <div className="mx-auto max-w-[1450px] space-y-5 pb-8 sm:space-y-6">
      {/* Page heading */}
      <PageHeader
        title="Notices & Announcements"
        description="Stay updated with important notices from your Tuition Admin."
      />

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-sm font-bold text-red-700 dark:text-red-300">
            Unable to load notices
          </p>

          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() => setRetryCount((value) => value + 1)}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Summary */}
      <NoticeSummaryCards summary={summary} />

      {/* Loading indicator while changing filters/pages */}
      {loading && notices.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-violet-50 px-4 py-2.5 text-xs font-medium text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
          <Bell size={14} className="animate-pulse" />
          Updating notices...
        </div>
      )}

      {/* Main content */}
      <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <NoticeList
          notices={notices}
          selectedNoticeId={selectedNotice?._id ?? null}
          onSelect={handleNoticeSelect}
          audience={audience}
          onAudienceChange={handleAudienceChange}
          pagination={pagination}
          onPageChange={handlePageChange}
        />

        <NoticeDetails
          notice={selectedNotice}
          mobileOpen={mobileOpen}
          onClose={handleCloseDetails}
        />
      </div>
    </div>
  );
}
