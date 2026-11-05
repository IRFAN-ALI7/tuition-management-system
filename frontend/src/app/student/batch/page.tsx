
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { StudentBatch } from "@/types/student";

type IconName =
  | "graduation"
  | "clock"
  | "sunrise"
  | "sunset"
  | "tag"
  | "activity"
  | "calendar"
  | "info"
  | "refresh";

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "graduation":
      return (
        <svg {...common}>
          <path d="m2 9 10-5 10 5-10 5L2 9Z" />
          <path d="M6 11v5c3.5 2.5 8.5 2.5 12 0v-5M22 9v6" />
        </svg>
      );

    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );

    case "sunrise":
      return (
        <svg {...common}>
          <path d="M3 18h18M5 18a7 7 0 0 1 14 0" />
          <path d="M12 2v5M4.93 7.93l3.54 3.54M19.07 7.93l-3.54 3.54M2 12h3M19 12h3" />
        </svg>
      );

    case "sunset":
      return (
        <svg {...common}>
          <path d="M3 18h18M5 18a7 7 0 0 1 14 0" />
          <path d="M12 2v5M4.93 7.93l3.54 3.54M19.07 7.93l-3.54 3.54M2 12h3M19 12h3" />
        </svg>
      );

    case "tag":
      return (
        <svg {...common}>
          <path d="M20 13 13 20a2 2 0 0 1-3 0l-6-6V4h10l6 6a2 2 0 0 1 0 3Z" />
          <circle cx="8.5" cy="8.5" r="1" />
        </svg>
      );

    case "activity":
      return (
        <svg {...common}>
          <path d="M3 12h4l3-8 4 16 3-8h4" />
        </svg>
      );

    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      );

    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
      );

    case "refresh":
      return (
        <svg {...common}>
          <path d="M20 7v5h-5M4 17v-5h5" />
          <path d="M5.5 9a7 7 0 0 1 11.6-2L20 12M4 12l2.9 5a7 7 0 0 0 11.6-2" />
        </svg>
      );
  }
}

function formatTime(value?: string) {
  if (!value || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return "Not set";
  }

  const [hour, minute] = value.split(":").map(Number);
  const date = new Date();

  date.setHours(hour, minute, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getDuration(start?: string, end?: string) {
  if (
    !start ||
    !end ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(start) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(end)
  ) {
    return "Not available";
  }

  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  const totalMinutes =
    endHour * 60 + endMinute - (startHour * 60 + startMinute);

  if (totalMinutes <= 0) return "Not available";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} hr ${minutes} min`;
  }

  if (hours > 0) {
    return `${hours} ${hours === 1 ? "Hour" : "Hours"}`;
  }

  return `${minutes} min`;
}

/* Loading skeleton */

function LoadingBatch() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="space-y-2">
        <div className="h-3 w-36 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-8 w-44 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-64 max-w-full rounded bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <div className="h-[390px] rounded-3xl bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-4">
          <div className="h-[245px] rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-[130px] rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

/* Class timing card */

function TimeCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: "sunrise" | "sunset";
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/80 bg-white/90 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-4">
      <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
        <Icon name={icon} className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
        <span className="truncate text-[11px] font-medium text-slate-600 dark:text-slate-300 sm:text-xs">
          {title}
        </span>
      </div>

      <p className="mt-2 break-words text-lg font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

/* Compact batch information tile */

function InformationTile({
  label,
  value,
  icon,
  status,
}: {
  label: string;
  value: string;
  icon: "tag" | "activity" | "calendar" | "clock";
  status?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70 sm:p-3.5">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
          <Icon name={icon} className="h-4 w-4" />
        </span>

        {status !== undefined && (
          <span
            className={`ml-auto rounded-full px-2 py-1 text-[9px] font-bold ${
              status
                ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
            }`}
          >
            {status ? "Active" : "Inactive"}
          </span>
        )}
      </div>

      <p className="mt-3 text-[10px] font-medium text-slate-500 dark:text-slate-400 sm:text-[11px]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold leading-5 text-slate-800 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

/* Decorative illustration */

function BatchIllustration() {
  return (
    <div className="pointer-events-none absolute right-4 top-16 hidden h-40 w-40 items-center justify-center text-violet-600/80 sm:flex lg:right-7 lg:top-12 lg:h-48 lg:w-48">
      <svg viewBox="0 0 180 180" className="h-full w-full" fill="none">
        <circle cx="90" cy="90" r="78" fill="currentColor" opacity=".06" />
        <path
          d="m29 112 61-27 61 27-61 28-61-28Z"
          fill="currentColor"
          opacity=".9"
        />
        <path
          d="m44 122 46 21 46-21v16l-46 22-46-22v-16Z"
          fill="currentColor"
          opacity=".58"
        />
        <path
          d="M90 85V37m0 0 43 19-43 19"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M90 37 29 64l61 28 61-28-61-27Z"
          fill="currentColor"
          opacity=".24"
        />
        <path
          d="m90 92 61-28v48l-61 28-61-28V64l61 28Z"
          stroke="currentColor"
          strokeWidth="2"
          opacity=".2"
        />
        <path
          d="M144 69v37"
          stroke="#F59E0B"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="144" cy="110" r="5" fill="#F59E0B" />
      </svg>
    </div>
  );
}

/* No batch state */

function NoBatchState() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-10">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
        <Icon name="graduation" className="h-8 w-8" />
      </div>

      <h2 className="mt-5 text-lg font-extrabold text-slate-900 dark:text-white">
        No batch assigned yet
      </h2>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
        Your batch details will appear here once your Tuition Admin assigns
        you to a batch.
      </p>

      <div className="mx-auto mt-5 max-w-sm rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
        Please contact your Tuition Admin for assistance with batch assignment.
      </div>
    </section>
  );
}

/* Main page */

export default function StudentBatchPage() {
    const [batch, setBatch] = useState<StudentBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadBatch() {
      setLoading(true);
      setError("");

      try {
        const response = await api("/student/batch");

        if (cancelled) return;

        const result =
          response.batch ??
          response.data?.batch ??
          (response.data?._id ? response.data : null);

        setBatch(result ?? null);
      } catch (caught) {
        if (cancelled) return;

        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load your batch details."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadBatch();

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  if (loading) {
    return <LoadingBatch />;
  }

  const isActive = batch?.active !== false;

  const duration = batch
    ? getDuration(batch.startTime, batch.endTime)
    : "Not available";

  return (
    <div className="mx-auto max-w-[1320px] space-y-5 sm:space-y-6">
      {/* Page heading */}

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-400 sm:text-xs">
          Student Portal / My Batch
        </p>

        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          My Batch
        </h1>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your assigned class and schedule details.
        </p>
      </div>

      {/* Error state */}

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>

          <button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
          >
            <Icon name="refresh" className="h-4 w-4" />
            Try again
          </button>
        </div>
      )}

      {/* Batch content */}

      {!batch ? (
        !error && <NoBatchState />
      ) : (
        <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[1.3fr_1fr] xl:gap-5">
          {/* Main batch overview */}

          <section className="relative isolate overflow-hidden rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-100 via-violet-50 to-indigo-100 p-4 shadow-sm dark:border-violet-900/50 dark:from-violet-950/50 dark:via-slate-900 dark:to-indigo-950/40 sm:p-6 lg:p-7">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-violet-300/30 blur-3xl dark:bg-violet-600/10" />

            <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-indigo-300/20 blur-3xl" />

            <div className="relative">
              {/* Status */}

              <div className="flex items-center justify-between gap-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                    isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isActive ? "bg-green-500" : "bg-amber-500"
                    }`}
                  />

                  {isActive ? "Active Batch" : "Inactive Batch"}
                </span>

                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/80 text-violet-700 shadow-sm dark:bg-slate-800/80 dark:text-violet-300 sm:hidden">
                  <Icon name="graduation" className="h-5 w-5" />
                </div>
              </div>

              <BatchIllustration />

              {/* Batch name */}

              <div className="relative mt-6 min-w-0 sm:mt-10 sm:min-h-[145px]">
                <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-violet-700 dark:text-violet-300 sm:text-sm">
                  Your Assigned Batch
                </p>

                <h2 className="mt-2 break-words text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:max-w-[65%] sm:text-4xl lg:text-5xl">
                  {batch.name}
                </h2>

                <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 sm:text-sm">
                  <Icon name="graduation" className="h-4 w-4 shrink-0" />
                  Udaan Learning Centre
                </div>
              </div>

              {/* Start and end time */}

              <div className="relative mt-6 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3">
                <TimeCard
                  title="Class Starts"
                  value={formatTime(batch.startTime)}
                  icon="sunrise"
                />

                <TimeCard
                  title="Class Ends"
                  value={formatTime(batch.endTime)}
                  icon="sunset"
                />
              </div>

              {/* Duration */}

              <div className="relative mt-2.5 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/90 p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:mt-3 sm:p-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                  <Icon name="clock" className="h-6 w-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:text-xs">
                    Total Class Duration
                  </p>

                  <p className="mt-0.5 text-xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                    {duration}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Right information column */}

          <div className="min-w-0 space-y-4 sm:space-y-5">
            {/* Batch information */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                  <Icon name="graduation" className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Batch Information
                  </h3>

                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    Your current assignment details
                  </p>
                </div>
              </div>

              {/* Compact two-column information grid */}

              <div className="grid grid-cols-2 gap-2.5 p-3.5 sm:gap-3 sm:p-4">
                <InformationTile
                  label="Batch Name"
                  value={batch.name}
                  icon="tag"
                />

                <InformationTile
                  label="Batch Status"
                  value={isActive ? "Currently Active" : "Currently Inactive"}
                  icon="activity"
                  status={isActive}
                />

                <InformationTile
                  label="Assigned Student"
                  value="You"
                  icon="calendar"
                />

                <InformationTile
                  label="Class Timing"
                  value={`${formatTime(batch.startTime)} – ${formatTime(batch.endTime)}`}
                  icon="clock"
                />

                <InformationTile
                  label="Class Duration"
                  value={duration}
                  icon="clock"
                />
              </div>
            </section>

            {/* Support card */}

            <section className="relative isolate overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-100 via-violet-50 to-indigo-100 p-4 dark:border-violet-900/40 dark:from-violet-950/50 dark:via-slate-900 dark:to-indigo-950/40 sm:p-5">
              <div className="pointer-events-none absolute -bottom-16 -right-12 h-40 w-40 rounded-full bg-violet-300/30 blur-3xl dark:bg-violet-700/10" />

              <div className="relative flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/80 text-violet-700 shadow-sm dark:bg-slate-800 dark:text-violet-300">
                  <Icon name="info" className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white sm:text-base">
                    Need a batch change?
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300 sm:text-sm">
                    Contact your Tuition Admin for batch-related changes or
                    assistance.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      <footer className="pb-2 pt-1 text-center text-[11px] text-slate-400">
        Udaan Learning Centre · Your learning, your journey.
      </footer>
    </div>
  );
}
