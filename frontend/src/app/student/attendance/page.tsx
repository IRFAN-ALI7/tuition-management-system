
"use client";

import {useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/student/ui/PageHeader";
import { api } from "@/lib/api";

interface AttendanceRecord {
  _id?: string;
  date: string;
  status: "present" | "absent" | string;
  batch?: {
    _id?: string;
    name?: string;
  };
}

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  percentage: number | null;
}

interface MonthlySummaryItem {
  year: number;
  month: number;
  status: string;
  count: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AttendanceResponse {
  summary?: AttendanceSummary;
  filteredSummary?: AttendanceSummary;
  monthlySummary?: MonthlySummaryItem[];
  records?: AttendanceRecord[];
  pagination?: Pagination;
}

interface MonthData {
  month: number;
  present: number;
  absent: number;
  total: number;
  percentage: number | null;
}

const CURRENT_DATE = new Date();
const CURRENT_YEAR = CURRENT_DATE.getFullYear();
const CURRENT_MONTH = CURRENT_DATE.getMonth() + 1;
const PAGE_SIZE = 5;

const MONTHS = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  name: new Date(2000, index, 1).toLocaleString("en-IN", {
    month: "long",
  }),
}));

const EMPTY_SUMMARY: AttendanceSummary = {
  total: 0,
  present: 0,
  absent: 0,
  percentage: null,
};

const EMPTY_PAGINATION: Pagination = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

/* Helpers */

function normalizeSummary(
  summary?: Partial<AttendanceSummary> | null
): AttendanceSummary {
  return {
    total: Number(summary?.total ?? 0),
    present: Number(summary?.present ?? 0),
    absent: Number(summary?.absent ?? 0),
    percentage:
      summary?.percentage === null ||
      summary?.percentage === undefined
        ? null
        : Number(summary.percentage),
  };
}

function getPercentage(present: number, total: number) {
  return total > 0
    ? Number(((present / total) * 100).toFixed(1))
    : null;
}

function getMonthName(month: number) {
  return MONTHS.find((item) => item.value === month)?.name ?? "";
}

function getEmptyMonthData(month: number): MonthData {
  return {
    month,
    present: 0,
    absent: 0,
    total: 0,
    percentage: null,
  };
}

function formatDate(value: string) {
  const datePart = value.includes("T") ? value.slice(0, 10) : value;
  const parts = datePart.split("-").map(Number);

  if (
    parts.length !== 3 ||
    parts.some((part) => !Number.isFinite(part))
  ) {
    return value;
  }

  const date = new Date(parts[0], parts[1] - 1, parts[2]);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDay(value: string) {
  const datePart = value.includes("T") ? value.slice(0, 10) : value;
  const parts = datePart.split("-").map(Number);

  if (
    parts.length !== 3 ||
    parts.some((part) => !Number.isFinite(part))
  ) {
    return "—";
  }

  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString(
    "en-IN",
    { weekday: "long" }
  );
}

function getMonthStatus(
  month: number,
  year: number,
  total: number
) {
  if (total > 0) return "recorded";

  if (
    year > CURRENT_YEAR ||
    (year === CURRENT_YEAR && month > CURRENT_MONTH)
  ) {
    return "upcoming";
  }

  return "empty";
}

function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, "...", total];
  }

  if (current >= total - 2) {
    return [1, "...", total - 2, total - 1, total];
  }

  return [1, "...", current - 1, current, current + 1, "...", total];
}

/* Icons */

function CalendarIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}

function ChartIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 3v18h18" />
      <path d="m8 14 4-4 3 3 6-7" />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function CloseIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m18 6-12 12M6 6l12 12" />
    </svg>
  );
}

function ChevronIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function DownIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/* Donut chart */

function DonutChart({
  percentage,
  present,
  absent,
  color = "green",
}: {
  percentage: number | null;
  present: number;
  absent: number;
  color?: "green" | "violet";
}) {
  const total = present + absent;
  const hasData = total > 0;
  const value = percentage ?? 0;

  const presentColor = color === "green" ? "#16a34a" : "#7c3aed";
  const absentColor = "#ef4444";

  const chartBackground = hasData
    ? `conic-gradient(${presentColor} 0% ${value}%, ${absentColor} ${value}% 100%)`
    : "#e2e8f0";

  return (
    <div
      className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full sm:h-32 sm:w-32"
      style={{ background: chartBackground }}
      role="img"
      aria-label={
        hasData
          ? `${value}% attendance, ${present} present and ${absent} absent`
          : "No attendance records"
      }
    >
      <div className="absolute inset-[9px] grid place-items-center rounded-full bg-white dark:bg-slate-900">
        <div className="text-center">
          <p className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {hasData ? `${value}%` : "—"}
          </p>
          <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 sm:text-[10px]">
            {hasData ? "Attendance" : "No records"}
          </p>
        </div>
      </div>
    </div>
  );
}

/* Summary metrics */

function AttendanceMetric({
  label,
  value,
  type,
}: {
  label: string;
  value: number;
  type: "present" | "absent" | "total";
}) {
  const dotColor = {
    present: "bg-green-500",
    absent: "bg-red-500",
    total: "bg-blue-500",
  }[type];

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} />
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="text-base font-extrabold text-slate-900 dark:text-white sm:text-lg">
          {value}
        </p>
      </div>
    </div>
  );
}

/* Overview card */

function OverviewCard({
  title,
  subtitle,
  summary,
  color,
  rightContent,
  badge,
}: {
  title: string;
  subtitle: string;
  summary: AttendanceSummary;
  color: "green" | "violet";
  rightContent?: React.ReactNode;
  badge?: string;
}) {
  const isGreen = color === "green";

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
              isGreen
                ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                : "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400"
            }`}
          >
            {isGreen ? (
              <CalendarIcon className="h-5 w-5" />
            ) : (
              <ChartIcon className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-extrabold text-slate-900 dark:text-white sm:text-base">
              {title}
            </h2>
            <p className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">
              {subtitle}
            </p>
          </div>
        </div>

        {badge ? (
          <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-800 dark:bg-green-950/50 dark:text-green-300">
            {badge}
          </span>
        ) : (
          rightContent
        )}
      </div>

      <div className="flex items-center gap-4 p-4 sm:gap-6 sm:p-5">
        <DonutChart
          percentage={summary.percentage}
          present={summary.present}
          absent={summary.absent}
          color={color}
        />

        <div className="min-w-0 flex-1 space-y-3 border-l border-slate-100 pl-4 dark:border-slate-800 sm:pl-6">
          <AttendanceMetric
            label="Present"
            value={summary.present}
            type="present"
          />
          <AttendanceMetric
            label="Absent"
            value={summary.absent}
            type="absent"
          />
          <AttendanceMetric
            label="Total Classes"
            value={summary.total}
            type="total"
          />
        </div>
      </div>
    </section>
  );
}

/* Month percentage badge */

function MonthPercentage({ data }: { data: MonthData }) {
  if (data.total === 0) {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        No records
      </span>
    );
  }

  const percentage = data.percentage ?? 0;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
        percentage >= 75
          ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300"
          : percentage >= 50
            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
            : "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300"
      }`}
    >
      {percentage.toFixed(1)}%
    </span>
  );
}

/* Main page */

export default function StudentAttendancePage() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);

  const [showAllMonths, setShowAllMonths] = useState(false);
  const [recordsPage, setRecordsPage] = useState(1);

  const [availableYears, setAvailableYears] = useState<number[]>([
    CURRENT_YEAR,
  ]);

  const [yearSummary, setYearSummary] =
    useState<AttendanceSummary>(EMPTY_SUMMARY);
  const [currentMonthSummary, setCurrentMonthSummary] =
    useState<AttendanceSummary>(EMPTY_SUMMARY);

  const [monthlySummary, setMonthlySummary] = useState<MonthData[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [pagination, setPagination] =
    useState<Pagination>(EMPTY_PAGINATION);

  const [yearLoading, setYearLoading] = useState(true);
  const [currentLoading, setCurrentLoading] = useState(true);
  const [monthLoading, setMonthLoading] = useState(true);

  const [yearError, setYearError] = useState("");
  const [currentError, setCurrentError] = useState("");
  const [monthError, setMonthError] = useState("");

  /* Load current calendar month's summary */

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentMonth() {
      setCurrentLoading(true);
      setCurrentError("");

      try {
        const response: AttendanceResponse = await api(
          `/student/attendance?year=${CURRENT_YEAR}&month=${CURRENT_MONTH}&page=1&limit=${PAGE_SIZE}`
        );

        if (cancelled) return;

        setCurrentMonthSummary(
          normalizeSummary(response.filteredSummary)
        );
      } catch (error) {
        if (!cancelled) {
          setCurrentError(
            error instanceof Error
              ? error.message
              : "Unable to load current month attendance."
          );
        }
      } finally {
        if (!cancelled) setCurrentLoading(false);
      }
    }

    void loadCurrentMonth();

    return () => {
      cancelled = true;
    };
  }, []);

  /* Load selected year's summary and monthly archive */

  useEffect(() => {
    let cancelled = false;

    async function loadYear() {
      setYearLoading(true);
      setYearError("");

      try {
        const response: AttendanceResponse = await api(
          `/student/attendance?year=${selectedYear}&month=all&page=1&limit=${PAGE_SIZE}`
        );

        if (cancelled) return;

        setYearSummary(normalizeSummary(response.filteredSummary));

        const sourceMonths = response.monthlySummary ?? [];

        const yearsFromResponse = sourceMonths
          .map((item) => Number(item.year))
          .filter(
            (year) => Number.isInteger(year) && year > 0 && year <= CURRENT_YEAR
          );

        setAvailableYears(
          Array.from(new Set([CURRENT_YEAR, ...yearsFromResponse])).sort(
            (a, b) => b - a
          )
        );

        const monthMap = new Map<number, MonthData>();

        for (let month = 1; month <= 12; month += 1) {
          monthMap.set(month, getEmptyMonthData(month));
        }

        sourceMonths
          .filter((item) => Number(item.year) === selectedYear)
          .forEach((item) => {
            const month = Number(item.month);
            const existing = monthMap.get(month);

            if (!existing) return;

            const count = Number(item.count ?? 0);

            if (item.status?.toLowerCase() === "present") {
              existing.present += count;
            } else if (item.status?.toLowerCase() === "absent") {
              existing.absent += count;
            }

            existing.total = existing.present + existing.absent;
            existing.percentage = getPercentage(
              existing.present,
              existing.total
            );
          });

        setMonthlySummary(
          Array.from(monthMap.values()).sort(
            (a, b) => a.month - b.month
          )
        );
      } catch (error) {
        if (!cancelled) {
          setYearError(
            error instanceof Error
              ? error.message
              : "Unable to load yearly attendance."
          );
        }
      } finally {
        if (!cancelled) setYearLoading(false);
      }
    }

    void loadYear();

    return () => {
      cancelled = true;
    };
  }, [selectedYear]);

  /* Load date-wise attendance records with server pagination */

           
  /* Load date-wise attendance records with server pagination */

  useEffect(() => {
    let cancelled = false;

    async function loadMonthDetails() {
      setMonthLoading(true);
      setMonthError("");

      try {
        const response: AttendanceResponse = await api(
          `/student/attendance?year=${selectedYear}&month=${selectedMonth}&page=${recordsPage}&limit=${PAGE_SIZE}`
        );

        if (cancelled) return;

        setRecords(response.records ?? []);

        const serverPagination = response.pagination;

        if (serverPagination) {
          const total = Number(serverPagination.total ?? 0);
          const limit = Number(serverPagination.limit ?? PAGE_SIZE);

          setPagination({
            page: Number(serverPagination.page ?? recordsPage),
            limit,
            total,
            totalPages: Number(
              serverPagination.totalPages ??
                Math.max(1, Math.ceil(total / limit))
            ),
          });
        } else {
          setPagination(EMPTY_PAGINATION);
        }
      } catch (error) {
        if (cancelled) return;

        setRecords([]);
        setPagination(EMPTY_PAGINATION);
        setMonthError(
          error instanceof Error
            ? error.message
            : "Unable to load monthly attendance details."
        );
      } finally {
        if (!cancelled) {
          setMonthLoading(false);
        }
      }
    }

    void loadMonthDetails();

    return () => {
      cancelled = true;
    };
  }, [selectedYear, selectedMonth, recordsPage]);


  /* Derived data */

  const selectedMonthData = useMemo(
    () =>
      monthlySummary.find((item) => item.month === selectedMonth) ??
      getEmptyMonthData(selectedMonth),
    [monthlySummary, selectedMonth]
  );

  const monthStatus = getMonthStatus(
    selectedMonth,
    selectedYear,
    selectedMonthData.total
  );

  const monthTitle = `${getMonthName(selectedMonth)} ${selectedYear}`;

  const monthCutoff =
    selectedYear === CURRENT_YEAR ? CURRENT_MONTH : 12;

  const visibleMonthlySummary = useMemo(() => {
    const relevantMonths = monthlySummary.filter(
      (item) => item.month <= monthCutoff
    );

    if (showAllMonths) return relevantMonths;

    return relevantMonths.slice(-3);
  }, [monthlySummary, monthCutoff, showAllMonths]);

  const pageNumbers = useMemo(
    () => getPageNumbers(recordsPage, pagination.totalPages),
    [recordsPage, pagination.totalPages]
  );

  /* Handlers */

  function handleYearChange(value: string) {
    const nextYear = Number(value);

    if (!Number.isInteger(nextYear)) return;

    setSelectedYear(nextYear);
    setRecordsPage(1);
    setShowAllMonths(false);

    if (nextYear === CURRENT_YEAR) {
      setSelectedMonth(CURRENT_MONTH);
    } else {
      setSelectedMonth(12);
    }
  }

  function handleMonthChange(month: number) {
    setSelectedMonth(month);
    setRecordsPage(1);
  }

  function handlePageChange(page: number) {
    if (page < 1 || page > pagination.totalPages) return;
    setRecordsPage(page);
  }

  return (
    <div className="mx-auto max-w-[1320px] space-y-5 sm:space-y-6">
      <PageHeader
        title="Attendance"
        description="Track your current month attendance and review your past records by month and year."
      />

      {/* Current month and yearly overview */}

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <div className="min-w-0">
          {currentLoading ? (
            <div className="h-[210px] animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ) : (
            <OverviewCard
              title="Current Month"
              subtitle={`${getMonthName(CURRENT_MONTH)} ${CURRENT_YEAR}`}
              summary={currentMonthSummary}
              color="green"
              badge="Current"
            />
          )}

          {currentError && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              {currentError}
            </p>
          )}
        </div>

        <div className="min-w-0">
          {yearLoading ? (
            <div className="h-[210px] animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ) : (
            <OverviewCard
              title="Yearly Overview"
              subtitle={`Complete attendance summary for ${selectedYear}`}
              summary={yearSummary}
              color="violet"
              rightContent={
                <label className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-800">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    Year
                  </span>
                  <select
                    name="yearly-overview-year"
                    value={selectedYear}
                    onChange={(event) => handleYearChange(event.target.value)}
                    className="max-w-[82px] bg-transparent text-xs font-bold text-slate-800 outline-none dark:text-white"
                    aria-label="Select attendance year"
                  >
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
              }
            />
          )}

          {yearError && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              {yearError}
            </p>
          )}
        </div>
      </div>

      {/* Monthly records */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
              <CalendarIcon className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Monthly Records
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Select any month to view its complete attendance details.
              </p>
            </div>
          </div>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800 sm:justify-start">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Select Year
            </span>
            <select
              name="monthly-records-year"
              value={selectedYear}
              onChange={(event) => handleYearChange(event.target.value)}
              className="bg-transparent text-sm font-bold text-slate-900 outline-none dark:text-white"
              aria-label="Select year for monthly records"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        {yearLoading ? (
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Desktop monthly table */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                    <th className="px-5 py-3">Month</th>
                    <th className="px-4 py-3 text-center">Total Classes</th>
                    <th className="px-4 py-3 text-center">Present</th>
                    <th className="px-4 py-3 text-center">Absent</th>
                    <th className="px-4 py-3 text-center">Attendance</th>
                    <th className="px-5 py-3 text-right">Details</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleMonthlySummary.map((item) => {
                    const selected = selectedMonth === item.month;
                    const status = getMonthStatus(
                      item.month,
                      selectedYear,
                      item.total
                    );

                    return (
                      <tr
                        key={item.month}
                        onClick={() => handleMonthChange(item.month)}
                        className={`cursor-pointer border-b border-slate-100 transition last:border-0 dark:border-slate-800 ${
                          selected
                            ? "bg-violet-50/80 dark:bg-violet-950/25"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`grid h-8 w-8 place-items-center rounded-lg ${
                                selected
                                  ? "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300"
                                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              <CalendarIcon className="h-4 w-4" />
                            </span>

                            <span
                              className={`font-bold ${
                                selected
                                  ? "text-violet-800 dark:text-violet-300"
                                  : "text-slate-800 dark:text-slate-200"
                              }`}
                            >
                              {getMonthName(item.month)}
                            </span>

                            {selected && (
                              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-bold text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                                Selected
                              </span>
                            )}

                            {status === "upcoming" && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                Upcoming
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-300">
                          {item.total || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-center font-semibold text-green-700 dark:text-green-400">
                          {item.total ? item.present : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-center font-semibold text-red-600 dark:text-red-400">
                          {item.total ? item.absent : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <MonthPercentage data={item} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleMonthChange(item.month);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-100 dark:text-violet-300 dark:hover:bg-violet-950/50"
                          >
                            View
                            <ChevronIcon className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile month cards */}

            <div className="grid grid-cols-1 gap-2.5 p-3 md:hidden sm:grid-cols-2 sm:p-4">
              {visibleMonthlySummary.map((item) => {
                const selected = selectedMonth === item.month;
                const status = getMonthStatus(
                  item.month,
                  selectedYear,
                  item.total
                );

                return (
                  <button
                    type="button"
                    key={item.month}
                    onClick={() => handleMonthChange(item.month)}
                    className={`min-w-0 rounded-xl border p-3 text-left transition ${
                      selected
                        ? "border-violet-300 bg-violet-50 ring-1 ring-violet-200 dark:border-violet-800 dark:bg-violet-950/30 dark:ring-violet-900"
                        : "border-slate-200 bg-white hover:border-violet-200 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-violet-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                            selected
                              ? "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          <CalendarIcon className="h-4 w-4" />
                        </span>

                        <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {getMonthName(item.month)}
                        </span>
                      </div>

                      <ChevronIcon className="h-4 w-4 shrink-0 text-slate-400" />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 gap-3 text-[10px]">
                        <span className="font-semibold text-green-700 dark:text-green-400">
                          P: {item.total ? item.present : "—"}
                        </span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          A: {item.total ? item.absent : "—"}
                        </span>
                        <span className="font-semibold text-slate-500 dark:text-slate-400">
                          Total: {item.total || "—"}
                        </span>
                      </div>

                      {status === "upcoming" ? (
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          Upcoming
                        </span>
                      ) : (
                        <MonthPercentage data={item} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {visibleMonthlySummary.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No monthly attendance records are available for this year.
              </div>
            )}
          </>
        )}

        {/* View all / Show less */}

        <div className="flex justify-center border-t border-slate-100 px-4 py-4 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowAllMonths((value) => !value)}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-5 py-2.5 text-xs font-bold text-violet-700 transition hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-950"
          >
            {showAllMonths ? "Show Less" : "View All Months"}
            <DownIcon
              className={`h-4 w-4 transition-transform ${
                showAllMonths ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Present
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Absent
            </span>
            <span className="ml-auto">
              Select a month to view its date-wise history.
            </span>
          </div>
        </div>
      </section>

      {/* Selected month's date-wise attendance */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              <CalendarIcon className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Month Details
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Date-wise attendance record
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <label className="min-w-0">
              <span className="sr-only">Select month</span>
              <select
                name="attendance-month"
                value={selectedMonth}
                onChange={(event) =>
                  handleMonthChange(Number(event.target.value))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:min-w-[140px]"
              >
                {MONTHS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-0">
              <span className="sr-only">Select year</span>
              <select
                name="attendance-detail-year"
                value={selectedYear}
                onChange={(event) => handleYearChange(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:min-w-[100px]"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Selected month summary */}

        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/70 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-800/30">
          <div className="px-3 py-3 text-center">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Total Classes
            </p>
            <p className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
              {selectedMonthData.total || "—"}
            </p>
          </div>

          <div className="px-3 py-3 text-center">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Present
            </p>
            <p className="mt-1 text-lg font-extrabold text-green-700 dark:text-green-400">
              {selectedMonthData.total ? selectedMonthData.present : "—"}
            </p>
          </div>

          <div className="px-3 py-3 text-center">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Absent
            </p>
            <p className="mt-1 text-lg font-extrabold text-red-600 dark:text-red-400">
              {selectedMonthData.total ? selectedMonthData.absent : "—"}
            </p>
          </div>
        </div>

        <div className="p-3 sm:p-5">
          {monthLoading ? (
            <div className="space-y-3">
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <div
                  key={index}
                  className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : monthError ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
            >
              {monthError}
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center dark:border-slate-700">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <CalendarIcon className="h-6 w-6" />
              </div>

              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                {monthStatus === "upcoming"
                  ? "This month has not started yet"
                  : "No attendance records found"}
              </h3>

              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
                {monthStatus === "upcoming"
                  ? "Attendance details will appear here when this month begins and classes are recorded."
                  : `There are no recorded attendance entries for ${monthTitle}.`}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop records table */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Day</th>
                      <th className="px-4 py-3">Batch</th>
                      <th className="px-4 py-3 text-right">
                        Attendance Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {records.map((record, index) => {
                      const present =
                        record.status?.toLowerCase() === "present";

                      return (
                        <tr
                          key={record._id ?? `${record.date}-${index}`}
                          className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                        >
                          <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                            {formatDate(record.date)}
                          </td>

                          <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                            {getDay(record.date)}
                          </td>

                          <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                            {record.batch?.name ?? "—"}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${
                                present
                                  ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300"
                              }`}
                            >
                              {present ? (
                                <CheckIcon className="h-3 w-3" />
                              ) : (
                                <CloseIcon className="h-3 w-3" />
                              )}
                              {present ? "Present" : "Absent"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile records list */}

              <div className="space-y-2 md:hidden">
                {records.map((record, index) => {
                  const present =
                    record.status?.toLowerCase() === "present";

                  return (
                    <div
                      key={record._id ?? `${record.date}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          <CalendarIcon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {formatDate(record.date)}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">
                            {getDay(record.date)}
                            {record.batch?.name
                              ? ` · ${record.batch.name}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-bold ${
                          present
                            ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300"
                        }`}
                      >
                        {present ? (
                          <CheckIcon className="h-3 w-3" />
                        ) : (
                          <CloseIcon className="h-3 w-3" />
                        )}
                        {present ? "Present" : "Absent"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}

              {pagination.totalPages > 1 && (
                <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Showing{" "}
                    {(recordsPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(
                      recordsPage * PAGE_SIZE,
                      pagination.total
                    )}{" "}
                    of {pagination.total} records
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={recordsPage === 1}
                      onClick={() =>
                        handlePageChange(recordsPage - 1)
                      }
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Previous
                    </button>

                    {pageNumbers.map((page, index) =>
                      typeof page === "number" ? (
                        <button
                          key={page}
                          type="button"
                          onClick={() => handlePageChange(page)}
                          aria-current={
                            recordsPage === page ? "page" : undefined
                          }
                          className={`h-9 min-w-9 rounded-lg px-2.5 text-xs font-bold transition ${
                            recordsPage === page
                              ? "bg-violet-600 text-white shadow-sm"
                              : "border border-slate-200 text-slate-600 hover:bg-violet-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          }`}
                        >
                          {page}
                        </button>
                      ) : (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-1 text-xs text-slate-400"
                        >
                          ...
                        </span>
                      )
                    )}

                    <button
                      type="button"
                      disabled={recordsPage >= pagination.totalPages}
                      onClick={() =>
                        handlePageChange(recordsPage + 1)
                      }
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <p className="pb-2 text-center text-[10px] text-slate-400">
        Udaan Learning Centre · Your attendance record.
      </p>
    </div>
  );
}
