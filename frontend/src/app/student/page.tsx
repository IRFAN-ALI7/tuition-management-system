
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

function GraduationIllustration() {
  return (
    <svg
      viewBox="0 0 240 170"
      className="h-full w-full"
      fill="none"
      role="img"
      aria-label="Graduation cap resting on books"
    >
      <ellipse cx="123" cy="151" rx="105" ry="12" fill="#6D28D9" opacity=".25" />

      {/* Bottom book */}
      <path
        d="M31 112 143 88l73 23-111 29-74-28Z"
        fill="#E0E7FF"
      />
      <path
        d="m31 112 74 28v11l-74-28v-11Z"
        fill="#C7D2FE"
      />
      <path
        d="m105 140 111-29v11l-111 29v-11Z"
        fill="#A5B4FC"
      />

      {/* Middle book */}
      <path
        d="m29 91 112-27 76 24-112 29-76-26Z"
        fill="#FDE68A"
      />
      <path
        d="m29 91 76 26v11L29 102V91Z"
        fill="#FBBF24"
      />
      <path
        d="m105 117 112-29v11l-112 29v-11Z"
        fill="#F59E0B"
      />

      {/* Top book */}
      <path
        d="m37 75 104-25 67 22-105 27-66-24Z"
        fill="#F8FAFC"
      />
      <path
        d="m37 75 66 24v9L37 84v-9Z"
        fill="#CBD5E1"
      />
      <path
        d="m103 99 105-27v9l-105 27v-9Z"
        fill="#94A3B8"
      />

      {/* Graduation cap */}
      <path
        d="m26 48 91-37 99 37-94 38-96-38Z"
        fill="#312E81"
      />
      <path
        d="m55 59 67 27 67-27v21c-38 26-96 26-134 0V59Z"
        fill="#4C1D95"
      />
      <path
        d="m117 11 99 37-94 38-96-38 91-37Z"
        fill="#4338CA"
      />
      <path
        d="m117 11 99 37-94 38-96-38 91-37Z"
        fill="#312E81"
        opacity=".35"
      />

      {/* Tassel */}
      <path
        d="m216 48-3 45"
        stroke="#FACC15"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="213" cy="97" r="5" fill="#FACC15" />
      <path
        d="m213 102-5 13m5-13 5 13m-5-13v14"
        stroke="#FACC15"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function StudentDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [today] = useState(() => new Date());

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

      {/* Welcome Banner */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-r from-violet-700 via-purple-700 to-fuchsia-600 px-4 py-5 shadow-sm sm:px-6 sm:py-6 lg:px-8">
        {/* Decorative background shapes */}
        <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-1/4 h-52 w-52 rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="pointer-events-none absolute bottom-0 right-0 hidden h-full w-[38%] overflow-hidden sm:block">
          <div className="absolute -bottom-16 right-8 h-44 w-64 rounded-full bg-fuchsia-400/20 blur-2xl" />
          <div className="absolute bottom-0 right-0 h-full w-full opacity-20">
            <svg viewBox="0 0 420 190" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
              <path
                d="M0 170C70 100 140 150 205 95S330 30 420 90V190H0Z"
                fill="#C4B5FD"
              />
            </svg>
          </div>
        </div>

        <div className="relative flex min-h-[150px] items-center justify-between gap-3 sm:min-h-[145px] sm:gap-5 lg:min-h-[150px]">
          {/* Left icon and divider */}
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4 lg:gap-6">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white shadow-lg sm:h-16 sm:w-16 sm:rounded-3xl lg:h-[76px] lg:w-[76px]">
              <svg
                viewBox="0 0 64 64"
                className="h-9 w-9 text-violet-700 sm:h-11 sm:w-11 lg:h-12 lg:w-12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 23 32 10l27 13-27 13L5 23Z"
                  fill="currentColor"
                />
                <path
                  d="M15 29v12c10 8 24 8 34 0V29L32 39 15 29Z"
                  fill="currentColor"
                  opacity=".8"
                />
                <path
                  d="M59 24v17"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="59" cy="44" r="3" fill="currentColor" />
              </svg>
            </div>

            <div className="h-16 w-px shrink-0 bg-white/30 sm:h-[76px]" />

            {/* Banner text */}
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-violet-100 sm:text-[10px] sm:tracking-[0.2em] lg:text-xs">
                Udaan Learning Centre
              </p>

              <h1 className="mt-2 text-xl font-extrabold leading-tight tracking-tight text-white sm:text-2xl md:text-3xl lg:text-4xl">
                Welcome Back,{" "}
                <span className="text-yellow-300">
                  {student?.name || "Student"}!
                </span>
              </h1>

              <p className="mt-2 max-w-[560px] text-[11px] leading-relaxed text-violet-100 sm:text-xs md:text-sm lg:text-base">
                Your journey to success starts with every new day of learning.
              </p>

              {dateLabel && (
                <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full bg-white px-3 py-2 text-[10px] font-bold text-violet-950 shadow-md sm:mt-4 sm:px-4 sm:text-xs lg:text-sm">
                  <Icon name="calendar" className="h-4 w-4 shrink-0" />
                  <span className="truncate">{dateLabel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Graduation cap and books illustration */}
          <div className="relative hidden h-[135px] w-[170px] shrink-0 sm:block md:h-[150px] md:w-[190px] lg:h-[160px] lg:w-[220px]">
            <GraduationIllustration />
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <SummaryCard
          title="Attendance"
          value={
            attendancePercentage === null
              ? "—"
              : `${attendancePercentage.toFixed(1)}%`
          }
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
                  <span className="truncate">
                    View fee details & payment history
                  </span>
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
