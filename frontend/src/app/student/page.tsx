
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Student, StudentBatch } from "@/types/student";
import PageHeader from "@/components/student/ui/PageHeader";
import StatCard from "@/components/student/ui/StatCard";
import SectionCard from "@/components/student/ui/SectionCard";
import LoadingState from "@/components/student/ui/LoadingState";
import EmptyState from "@/components/student/ui/EmptyState";
import StatusBadge from "@/components/student/ui/StatusBadge";
import AttendanceOverview from "@/components/student/dashboard/AttendanceOverview";
import RecentResults, {
  type StudentResult,
} from "@/components/student/dashboard/RecentResults";
import RecentNotices, {
  type StudentNotice,
} from "@/components/student/dashboard/RecentNotices";

interface DashboardAttendance {
  present?: number;
  absent?: number;
  total?: number;
  totalClasses?: number;
  percentage?: number;
  attendancePercentage?: number;
}

interface CurrentFee {
  status?: string;
  amount?: number;
  feeAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  month?: number;
  year?: number;
}

interface DashboardData {
  student?: Student;
  batch?: StudentBatch | null;
  attendance?: DashboardAttendance;
  currentFee?: CurrentFee | null;
  latestResults?: StudentResult[];
  notices?: StudentNotice[];
}

function formatTime(value?: string) {
  if (!value) return "—";

  const [hour, minute] = value.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;

  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function money(value?: number) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
}

function monthLabel(month?: number, year?: number) {
  if (!month) return year ? String(year) : "Current Month";
  return `${new Date(2000, month - 1, 1).toLocaleString("en-IN", {
    month: "long",
  })} ${year ?? ""}`.trim();
}

export default function StudentDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const response = await api("/student/dashboard");
        if (cancelled) return;

        setDashboard({
          student: response.student ?? response.data?.student,
          batch: response.batch ?? response.data?.batch ?? null,
          attendance: response.attendance ?? response.data?.attendance,
          currentFee: response.currentFee ?? response.data?.currentFee ?? null,
          latestResults:
            response.latestResults ?? response.data?.latestResults ?? [],
          notices: response.notices ?? response.data?.notices ?? [],
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
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
  }, []);

  if (loading) {
    return <LoadingState message="Loading your dashboard..." fullPage />;
  }

  const student = dashboard?.student;
  const batch = dashboard?.batch;
  const attendance = dashboard?.attendance ?? {};
  const fee = dashboard?.currentFee;

  const present = Number(attendance.present ?? 0);
  const absent = Number(attendance.absent ?? 0);
  const total = Number(
    attendance.total ?? attendance.totalClasses ?? present + absent
  );
  const attendancePercentage = Number(
    attendance.percentage ?? attendance.attendancePercentage ?? 0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome${student?.name ? `, ${student.name}` : " Back"}!`}
        description="Here is an overview of your tuition activity."
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Attendance"
          value={`${attendancePercentage.toFixed(1)}%`}
          description={`${present} present out of ${total} classes`}
          color="blue"
        />

        <StatCard
          title="Present Classes"
          value={present}
          description="Total classes attended"
          color="green"
        />

        <StatCard
          title="Absent Classes"
          value={absent}
          description="Total classes missed"
          color="red"
        />

        <StatCard
          title="Current Fee"
          value={fee?.status || "Not Available"}
          description={
            fee
              ? `${monthLabel(fee.month, fee.year)} · ${money(
                  fee.remainingAmount ?? fee.feeAmount ?? fee.amount
                )}`
              : "Fee information"
          }
          color="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AttendanceOverview
          present={present}
          absent={absent}
          total={total}
          percentage={attendancePercentage}
        />

        <SectionCard
          title="My Batch"
          description="Your assigned tuition schedule."
        >
          {batch ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Batch Name
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                    {batch.name}
                  </h3>
                </div>
                <StatusBadge
                  status={batch.active === false ? "Inactive" : "Active"}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Start Time
                  </p>
                  <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                    {formatTime(batch.startTime)}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    End Time
                  </p>
                  <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                    {formatTime(batch.endTime)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No batch assigned"
              description="Please contact your Tuition Admin for batch details."
            />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Latest Exam Results"
        description="Your recently published examination results."
      >
        <RecentResults results={dashboard?.latestResults ?? []} />
      </SectionCard>

      <SectionCard
        title="Recent Notices"
        description="Important announcements from your Tuition Admin."
      >
        <RecentNotices notices={dashboard?.notices ?? []} />
      </SectionCard>

      <SectionCard title="Student Information">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Student Name
            </p>
            <p className="mt-1 font-medium text-gray-900 dark:text-white">
              {student?.name || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Father&apos;s Name
            </p>
            <p className="mt-1 font-medium text-gray-900 dark:text-white">
              {student?.fatherName || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Mobile Number
            </p>
            <p className="mt-1 font-medium text-gray-900 dark:text-white">
              {student?.phone || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Class</p>
            <p className="mt-1 font-medium text-gray-900 dark:text-white">
              {student?.className || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Address</p>
            <p className="mt-1 font-medium text-gray-900 dark:text-white">
              {student?.address || "—"}
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
