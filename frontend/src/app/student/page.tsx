
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { api } from "@/lib/api";
import type { Student, StudentBatch } from "@/types/student";

import AttendanceOverview from "@/components/student/dashboard/AttendanceOverview";
import RecentResults, {
  type StudentResult,
} from "@/components/student/dashboard/RecentResults";
import RecentNotices, {
  type StudentNotice,
} from "@/components/student/dashboard/RecentNotices";

interface DashboardAttendance {
  present: number;
  absent: number;
  total: number;
  percentage: number | null;
}

interface CurrentFee {
  hasRecord?: boolean;
  year: number;
  month: number;
  feeAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
}

interface DashboardData {
  student: Student | null;
  batch: StudentBatch | null;
  attendance: DashboardAttendance;
  currentFee: CurrentFee | null;
  latestResults: StudentResult[];
  notices: StudentNotice[];
}

type IconName =
  | "calendar"
  | "wallet"
  | "users"
  | "award"
  | "chart"
  | "receipt"
  | "arrow"
  | "clock";

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
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01" />
        </svg>
      );

    case "wallet":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="15" rx="2" />
          <path d="M3 9h18M16 14h2M7 5V3h10v2" />
        </svg>
      );

    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="4" />
          <path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M18 14a6 6 0 0 1 4 6" />
        </svg>
      );

    case "award":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="5" />
          <path d="m8.5 12-1 9 4.5-2.5 4.5 2.5-1-9" />
        </svg>
      );

    case "chart":
      return (
        <svg {...common}>
          <path d="M4 20V12M10 20V5M16 20V9M22 20V3" />
        </svg>
      );

    case "receipt":
      return (
        <svg {...common}>
          <path d="M6 3h12l2 2v16l-3-2-3 2-3-2-3 2-3-2V5l1-2Z" />
          <path d="M9 9h6M9 13h6" />
        </svg>
      );

    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
  }
}

function money(value?: number) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
}

function formatTime(value?: string) {
  if (!value) return "Time not set";

  const [hour, minute] = value.split(":").map(Number);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return value;
  }

  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function monthLabel(month?: number, year?: number) {
  if (!month) return "Current month";

  return new Date(year ?? new Date().getFullYear(), month - 1)
    .toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
}

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function SummaryCard({
  title,
  value,
  description,
  icon,
  tone,
  href,
  children,
}: {
  title: string;
  value: string;
  description: string;
  icon: IconName;
  tone: "green" | "amber" | "violet" | "blue";
  href: string;
  children?: ReactNode;
}) {
  const tones = {
    green: {
      icon: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
      value: "text-green-700 dark:text-green-400",
    },
    amber: {
      icon: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
      value: "text-amber-700 dark:text-amber-400",
    },
    violet: {
      icon: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
      value: "text-violet-700 dark:text-violet-400",
    },
    blue: {
      icon: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
      value: "text-blue-700 dark:text-blue-400",
    },
  };

  return (
    <Link
      href={href}
      className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tones[tone].icon}`}
        >
          <Icon name={icon} className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
            {title}
          </p>

          <p
            className={`mt-1 truncate text-xl font-bold tracking-tight ${tones[tone].value} sm:text-2xl`}
          >
            {value}
          </p>

          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400 sm:text-xs">
            {description}
          </p>
        </div>
      </div>

      {children}
    </Link>
  );
}

function Panel({
  title,
  subtitle,
  icon,
  href,
  linkLabel = "View all",
  children,
}: {
  title: string;
  subtitle?: string;
  icon: IconName;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 lg:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400">
            <Icon name={icon} className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-slate-900 dark:text-white sm:text-lg">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {href && (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-violet-700 transition hover:text-violet-900 dark:text-violet-400 dark:hover:text-violet-300 sm:text-sm"
          >
            {linkLabel}
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        )}
      </div>

      {children}
    </section>
  );
}

function LoadingDashboard() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-36 rounded-3xl bg-slate-200 dark:bg-slate-800" />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const response = await api("/student/dashboard");

        if (cancelled) return;

        const data = response.data ?? response;

        setDashboard({
          student: data.student ?? null,
          batch: data.batch ?? null,
          attendance: {
            present: Number(data.attendance?.present ?? 0),
            absent: Number(data.attendance?.absent ?? 0),
            total: Number(data.attendance?.total ?? 0),
            percentage:
              data.attendance?.percentage === null ||
              data.attendance?.percentage === undefined
                ? null
                : Number(data.attendance.percentage),
          },
          currentFee: data.currentFee ?? null,
          latestResults: Array.isArray(data.latestResults)
            ? data.latestResults
            : [],
          notices: Array.isArray(data.notices) ? data.notices : [],
        });
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load your dashboard."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [retry]);

  if (loading && !dashboard) {
    return <LoadingDashboard />;
  }

  const student = dashboard?.student;
  const batch = dashboard?.batch;
  const attendance = dashboard?.attendance;
  const fee = dashboard?.currentFee;
  const results = dashboard?.latestResults ?? [];
  const notices = dashboard?.notices ?? [];

  const present = attendance?.present ?? 0;
  const absent = attendance?.absent ?? 0;
  const total = attendance?.total ?? 0;

  const attendancePercentage =
    total > 0 && attendance?.percentage !== null
      ? Math.min(100, Math.max(0, attendance?.percentage ?? 0))
      : null;

  const latestResult = results[0];
  const latestPercentage = latestResult?.exam?.percentage;

  const feeRecorded = Boolean(fee?.hasRecord);
  const feeAmount = Number(fee?.feeAmount ?? 0);
  const paidAmount = Number(fee?.paidAmount ?? 0);
  const remainingAmount = Number(fee?.remainingAmount ?? 0);

  const paidPercentage =
    feeRecorded && feeAmount > 0
      ? Math.min(100, (paidAmount / feeAmount) * 100)
      : 0;

  const greeting = today ? getGreeting(today.getHours()) : "Welcome";
  const dateLabel = today
    ? today.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 sm:space-y-6">
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>

          <button
            type="button"
            onClick={() => setRetry((value) => value + 1)}
            className="w-fit rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      )}

      {/* Welcome */}
      <section className="relative isolate overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-5 dark:border-violet-900/40 dark:from-violet-950/50 dark:via-slate-900 dark:to-indigo-950/40 sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-20 h-52 w-52 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-700/10" />

        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300 sm:text-xs">
              Udaan Learning Centre
            </p>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl lg:text-4xl">
              {greeting},{" "}
              <span className="text-violet-700 dark:text-violet-400">
                {student?.name || "Student"}!
              </span>
            </h1>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              Here&apos;s your learning overview.
            </p>

            {dateLabel && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-100 bg-white/80 px-3 py-2 text-xs font-semibold text-violet-800 shadow-sm dark:border-violet-900/50 dark:bg-slate-900/70 dark:text-violet-300 sm:text-sm">
                <Icon name="calendar" className="h-4 w-4" />
                {dateLabel}
              </div>
            )}
          </div>

          <div className="hidden h-28 w-28 shrink-0 items-center justify-center rounded-full bg-violet-100/80 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300 sm:flex lg:h-32 lg:w-32">
            <svg viewBox="0 0 120 120" className="h-20 w-20 lg:h-24 lg:w-24" fill="none">
              <path d="M15 65 60 45l45 20-45 20-45-20Z" fill="currentColor" opacity=".9" />
              <path d="M30 72v17c17 12 43 12 60 0V72L60 86 30 72Z" fill="currentColor" opacity=".65" />
              <path d="M60 45V20m0 0 25 11-25 11" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M60 20 15 40l45 20 45-20-45-20Z" fill="currentColor" opacity=".35" />
            </svg>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <SummaryCard
          title="Attendance"
          value={attendancePercentage === null ? "—" : `${attendancePercentage.toFixed(1)}%`}
          description={
            total > 0
              ? `${present} of ${total} classes attended`
              : "No attendance records yet"
          }
          icon="calendar"
          tone="green"
          href="/student/attendance"
        />

        <SummaryCard
          title="Current Month Fee"
          value={
            !feeRecorded
              ? "Not set"
              : fee?.status === "Paid"
                ? "Paid"
                : fee?.status === "Due"
                  ? "Due"
                  : "Not due"
          }
          description={
            feeRecorded
              ? `${money(remainingAmount)} remaining`
              : "No fee record for this month"
          }
          icon="wallet"
          tone="amber"
          href="/student/fees"
        />

        <SummaryCard
          title="My Batch"
          value={batch?.name ?? "Not assigned"}
          description={
            batch
              ? `${formatTime(batch.startTime)} – ${formatTime(batch.endTime)}`
              : "Contact your Tuition Admin"
          }
          icon="users"
          tone="violet"
          href="/student/batch"
        />

        <SummaryCard
          title="Latest Result"
          value={
            latestResult
              ? `${Number(latestPercentage ?? 0).toFixed(1)}%`
              : "No result"
          }
          description={
            latestResult
              ? `${latestResult.exam?.subject ?? "Examination"} · ${latestResult.exam?.name ?? "Test"}`
              : "Your published results will appear here"
          }
          icon="award"
          tone="blue"
          href="/student/exams"
        />
      </section>

      {/* Dashboard content */}
      <section className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-2 xl:gap-5">
        {/* Attendance */}
        <Panel
          title="Attendance Overview"
          subtitle="Your overall class attendance"
          icon="chart"
          href="/student/attendance"
        >
          <AttendanceOverview
            present={present}
            absent={absent}
            total={total}
            percentage={attendancePercentage}
          />
        </Panel>

        {/* Fee summary */}
        <Panel
          title="Fee Summary"
          subtitle="Your current month's fee status"
          icon="wallet"
          href="/student/fees"
          linkLabel="Fee details"
        >
          {feeRecorded ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                  {monthLabel(fee?.month, fee?.year)}
                </span>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    fee?.status === "Paid"
                      ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                  }`}
                >
                  {fee?.status}
                </span>
              </div>

              <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700">
                <div className="min-w-0 pr-2">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs">
                    Monthly Fee
                  </p>
                  <p className="mt-1 break-words text-base font-bold text-slate-900 dark:text-white sm:text-xl">
                    {money(feeAmount)}
                  </p>
                </div>

                <div className="min-w-0 px-2 sm:px-4">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs">
                    Paid
                  </p>
                  <p className="mt-1 break-words text-base font-bold text-green-700 dark:text-green-400 sm:text-xl">
                    {money(paidAmount)}
                  </p>
                </div>

                <div className="min-w-0 pl-2 sm:pl-4">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs">
                    Remaining
                  </p>
                  <p className="mt-1 break-words text-base font-bold text-red-600 dark:text-red-400 sm:text-xl">
                    {money(remainingAmount)}
                  </p>
                </div>
              </div>

              <div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-500"
                    style={{ width: `${paidPercentage}%` }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{paidPercentage.toFixed(0)}% paid</span>
                  <span>{money(remainingAmount)} due</span>
                </div>
              </div>

              <Link
                href="/student/fees"
                className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800 transition hover:bg-violet-100 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300 dark:hover:bg-violet-950/60"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Icon name="receipt" className="h-5 w-5 shrink-0" />
                  <span className="truncate">View fee details & payment history</span>
                </span>

                <Icon name="arrow" className="h-5 w-5 shrink-0" />
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-700">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <Icon name="wallet" className="h-6 w-6" />
              </div>

              <p className="mt-3 font-semibold text-slate-800 dark:text-white">
                No fee record available
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Your monthly fee details will appear here when recorded by your Tuition Admin.
              </p>

              <Link
                href="/student/fees"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-violet-700 dark:text-violet-400"
              >
                Open fee details
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
          )}
        </Panel>

        {/* Recent results */}
        <Panel
          title="Recent Exam Results"
          subtitle="Your latest examination performance"
          icon="award"
          href="/student/exams"
        >
          <RecentResults results={results.slice(0, 3)} />
        </Panel>

        {/* Recent notices */}
        <Panel
          title="Recent Notices"
          subtitle="Updates from your Tuition Admin"
          icon="calendar"
          href="/student/notices"
        >
          <RecentNotices notices={notices.slice(0, 3)} />
        </Panel>
      </section>

      <footer className="pb-2 pt-1 text-center text-[11px] text-slate-400">
        Keep learning, keep growing · Udaan Learning Centre
      </footer>
    </div>
  );
}
