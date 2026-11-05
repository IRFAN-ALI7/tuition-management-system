
"use client";

import { useEffect } from "react";
import {
  Bell,
  CalendarDays,
  FileText,
  Users,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import type { StudentNotice } from "@/types/student-notices";

import {
  formatNoticeDate,
  getNoticeAudienceLabel,
} from "@/types/student-notices";

interface Props {
  notice: StudentNotice | null;
  mobileOpen: boolean;
  onClose: () => void;
}

function NoticeContent({ notice }: { notice: StudentNotice }) {
  const AudienceIcon =
    notice.recipientType === "ALL_STUDENTS"
      ? Users
      : notice.recipientType === "BATCH_WISE"
        ? UsersRound
        : UserRound;

  return (
    <div className="space-y-5 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1.5 text-[10px] font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
          <Bell size={12} />
          {getNoticeAudienceLabel(notice.recipientType)}
        </span>

        {notice.recipientType === "BATCH_WISE" &&
          notice.batch?.name && (
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {notice.batch.name}
            </span>
          )}
      </div>

      <div>
        <h3 className="break-words text-lg font-extrabold leading-7 text-slate-900 dark:text-white sm:text-xl">
          {notice.title || "Announcement"}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} />
            Published on {formatNoticeDate(notice.createdAt)}
          </span>
        </div>
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-800" />

      <div>
        <p className="mb-3 text-xs font-bold text-slate-800 dark:text-slate-200">
          Notice Message
        </p>

        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-600 dark:text-slate-300">
          {notice.message || "No additional details."}
        </p>
      </div>

      <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-3 dark:border-violet-900/50 dark:bg-violet-950/20">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-violet-700 dark:bg-slate-900 dark:text-violet-300">
            <AudienceIcon size={17} />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Notice audience
            </p>

            <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
              {getNoticeAudienceLabel(notice.recipientType)}
            </p>

            {notice.recipientType === "BATCH_WISE" &&
              notice.batch?.name && (
                <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  Batch: {notice.batch.name}
                </p>
              )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 pt-4 text-[10px] text-slate-400 dark:border-slate-800">
        <FileText size={13} />
        Issued by Tuition Admin
      </div>
    </div>
  );
}

export default function NoticeDetails({
  notice,
  mobileOpen,
  onClose,
}: Props) {
  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen, onClose]);

  if (!notice) {
    return (
      <section className="hidden min-h-[420px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300">
          <Bell size={25} />
        </div>

        <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
          Select a notice
        </h3>

        <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">
          Choose any announcement from the list to read its complete details.
        </p>
      </section>
    );
  }

  return (
    <>
      {/* Desktop details panel */}
      <section className="hidden min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:block">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
              <FileText size={16} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Notice Details
              </h2>

              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Complete announcement
              </p>
            </div>
          </div>
        </div>

        <NoticeContent notice={notice} />
      </section>

      {/* Centered mobile modal */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[9999] grid place-items-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5 lg:hidden"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-notice-title"
            className="flex max-h-[88dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
          >
            {/* Modal header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
                  <FileText size={16} />
                </div>

                <div>
                  <h2
                    id="mobile-notice-title"
                    className="text-sm font-bold text-slate-900 dark:text-white"
                  >
                    Notice Details
                  </h2>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Complete announcement
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close notice"
                className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X size={17} />
              </button>
            </div>

            {/* Scrollable notice content */}
            <div className="min-h-0 overflow-y-auto overscroll-contain">
              <NoticeContent notice={notice} />
            </div>
          </section>
        </div>
      )}
    </>
  );
}
