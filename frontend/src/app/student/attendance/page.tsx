
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import PageHeader from "@/components/student/ui/PageHeader";
import SectionCard from "@/components/student/ui/SectionCard";
import LoadingState from "@/components/student/ui/LoadingState";
import EmptyState from "@/components/student/ui/EmptyState";
import StatusBadge from "@/components/student/ui/StatusBadge";

interface AttendanceRecord {
  _id?: string;
  date: string;
  status?: string;
}

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const today = new Date();

export default function StudentAttendancePage() {
  const [month, setMonth] = useState(String(today.getMonth() + 1));
  const [year, setYear] = useState(String(today.getFullYear()));
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>({
    total: 0,
    present: 0,
    absent: 0,
    percentage: 0,
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAttendance() {
      setLoading(true);
      setError("");

      try {
        const response = await api(
          `/student/attendance?month=${month}&year=${year}&page=${page}&limit=10`
        );

        if (cancelled) return;

        const filtered = response.filteredSummary ?? response.summary ?? {};

        setSummary({
          total: Number(filtered.total ?? 0),
          present: Number(filtered.present ?? 0),
          absent: Number(filtered.absent ?? 0),
          percentage: Number(filtered.percentage ?? 0),
        });

        setRecords(response.records ?? []);
        setPagination(
          response.pagination ?? {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 1,
          }
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load attendance."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAttendance();

    return () => {
      cancelled = true;
    };
  }, [month, year, page]);

  const years = Array.from(
    { length: 5 },
    (_, index) => today.getFullYear() - index
  );

  function formatDate(value: string) {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Attendance"
        description="Track your attendance and review your class history."
      />

      <SectionCard title="Filter Attendance">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Month
            </label>
            <select
              value={month}
              onChange={(event) => {
                setMonth(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            >
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={String(index + 1)}>
                  {new Date(2000, index, 1).toLocaleString("en-IN", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Year
            </label>
            <select
              value={year}
              onChange={(event) => {
                setYear(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            >
              {years.map((item) => (
                <option key={item} value={String(item)}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SectionCard>

      {error && (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <LoadingState message="Loading attendance records..." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Present", value: summary.present, color: "text-green-600" },
              { label: "Absent", value: summary.absent, color: "text-red-500" },
              { label: "Total Classes", value: summary.total, color: "text-gray-900 dark:text-white" },
              { label: "Attendance", value: `${summary.percentage.toFixed(1)}%`, color: "text-blue-600 dark:text-blue-400" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.label}
                </p>
                <p className={`mt-2 text-2xl font-bold ${item.color}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <SectionCard
            title="Attendance History"
            description="Your records for the selected month."
          >
            {records.length === 0 ? (
              <EmptyState
                title="No attendance records"
                description="No attendance has been recorded for this month."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                      <th className="px-3 py-3 font-medium">Date</th>
                      <th className="px-3 py-3 font-medium">Day</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, index) => (
                      <tr
                        key={record._id ?? `${record.date}-${index}`}
                        className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                      >
                        <td className="px-3 py-4 font-medium text-gray-900 dark:text-white">
                          {formatDate(record.date)}
                        </td>
                        <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                          {new Date(record.date).toLocaleDateString("en-IN", {
                            weekday: "long",
                          })}
                        </td>
                        <td className="px-3 py-4">
                          <StatusBadge status={record.status ?? "Unknown"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Page {pagination.page} of {pagination.totalPages}
                  {" · "}
                  {pagination.total} records
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() =>
                      setPage((value) =>
                        Math.min(pagination.totalPages, value + 1)
                      )
                    }
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
