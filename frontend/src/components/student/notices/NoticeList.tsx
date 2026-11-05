
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  MoreHorizontal,
  Users,
  UserRound,
  UsersRound,
} from "lucide-react";

import type {
  NoticeAudience,
  NoticePagination,
  StudentNotice,
} from "@/types/student-notices";

import {
  formatNoticeDate,
  getNoticeAudienceLabel,
} from "@/types/student-notices";

interface Props {
  notices: StudentNotice[];
  selectedNoticeId: string | null;
  onSelect: (notice: StudentNotice) => void;
  audience: NoticeAudience;
  onAudienceChange: (audience: NoticeAudience) => void;
  pagination: NoticePagination;
  onPageChange: (page: number) => void;
}

const filters: {
  value: NoticeAudience;
  label: string;
  icon: typeof Bell;
}[] = [
  { value: "all", label: "All", icon: Bell },
  {
    value: "all_students",
    label: "All Students",
    icon: Users,
  },
  {
    value: "batch",
    label: "Your Batch",
    icon: UsersRound,
  },
  {
    value: "personal",
    label: "Personal",
    icon: UserRound,
  },
];

function getPageItems(
  current: number,
  total: number
): (number | "...")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, 4, "...", total];
  }

  if (current >= total - 2) {
    return [1, "...", total - 3, total - 2, total - 1, total];
  }

  return [
    1,
    "...",
    current - 1,
    current,
    current + 1,
    "...",
    total,
  ];
}

export default function NoticeList({
  notices,
  selectedNoticeId,
  onSelect,
  audience,
  onAudienceChange,
  pagination,
  onPageChange,
}: Props) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const selectedFilter =
    filters.find((item) => item.value === audience) ?? filters[0];

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setFilterOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setFilterOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

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
    <section className="min-w-0 overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:px-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            All Notices
          </h2>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Notices sent to you by your Tuition Admin.
          </p>
        </div>

        {/* Desktop filters */}
        <div className="hidden flex-wrap items-center gap-1.5 lg:flex">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const active = audience === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => onAudienceChange(filter.value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold transition ${
                  active
                    ? "bg-violet-700 text-white shadow-sm"
                    : "border border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-violet-950/30"
                }`}
              >
                <Icon size={13} />
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Mobile and tablet custom filter */}
        <div ref={filterRef} className="relative z-20 w-full lg:hidden">
          <button
            type="button"
            onClick={() => setFilterOpen((value) => !value)}
            aria-haspopup="listbox"
            aria-expanded={filterOpen}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >
            <span className="flex items-center gap-2">
              <selectedFilter.icon
                size={15}
                className="text-violet-600 dark:text-violet-400"
              />
              {selectedFilter.label}
            </span>

            <ChevronDown
              size={15}
              className={`text-slate-400 transition ${
                filterOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {filterOpen && (
            <div
              role="listbox"
              aria-label="Filter notices"
              className="absolute left-0 right-0 top-full z-50 mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            >
              {filters.map((filter) => {
                const Icon = filter.icon;
                const active = audience === filter.value;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onAudienceChange(filter.value);
                      setFilterOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-xs font-semibold transition ${
                      active
                        ? "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={15} />
                      {filter.label}
                    </span>

                    {active && <Check size={15} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Notice cards */}
      {notices.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center px-5 py-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300">
            <Bell size={25} />
          </div>

          <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
            No notices found
          </h3>

          <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">
            New announcements from your Tuition Admin will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 p-3 sm:p-4">
          {notices.map((notice) => {
            const selected = selectedNoticeId === notice._id;

            return (
              <button
                key={notice._id}
                type="button"
                onClick={() => onSelect(notice)}
                className={`group flex w-full items-start gap-3 rounded-xl border p-3 text-left transition sm:p-4 ${
                  selected
                    ? "border-violet-400 bg-violet-50/70 shadow-sm dark:border-violet-800 dark:bg-violet-950/20"
                    : "border-slate-200 hover:border-violet-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-violet-900 dark:hover:bg-slate-800/40"
                }`}
              >
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                    selected
                      ? "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  <FileText size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md bg-violet-100 px-2 py-1 text-[9px] font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                      {getNoticeAudienceLabel(notice.recipientType)}
                    </span>

                    {notice.recipientType === "BATCH_WISE" &&
                      notice.batch?.name && (
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {notice.batch.name}
                        </span>
                      )}
                  </div>

                  <h3 className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-slate-900 dark:text-white sm:text-sm">
                    {notice.title || "Announcement"}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                    {notice.message || "No additional details."}
                  </p>

                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
                    <CalendarDays size={12} />
                    {formatNoticeDate(notice.createdAt)}
                  </div>
                </div>

                <ChevronRight
                  size={17}
                  className={`mt-1 shrink-0 transition ${
                    selected
                      ? "text-violet-600"
                      : "text-slate-400 group-hover:translate-x-0.5 group-hover:text-violet-600"
                  }`}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
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
            notices
          </p>

          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              aria-label="Previous page"
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            >
              <ChevronLeft size={16} />
            </button>

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
                      ? "bg-violet-700 text-white"
                      : "border border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-violet-950/30"
                  }`}
                >
                  {item}
                </button>
              )
            )}

            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              aria-label="Next page"
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
