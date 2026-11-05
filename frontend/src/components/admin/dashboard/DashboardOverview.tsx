"use client";

import NextImage from "next/image";

import type {
  Student,
  StudentSummary,
  DashboardFeeSummary,
  Batch,
  AdminProfile,
} from "../shared/types";

type DashboardOverviewProps = {
  students: Student[];
  studentSummary: StudentSummary;
  feeSummary: DashboardFeeSummary;
  batches: Batch[];
  profile: AdminProfile | null;
  search: string;
  todayLabel: string;
  greeting: string;
  currentDate: string;
  onStudents: () => void;
  onBatches: () => void;
  onAttendance: () => void;
  onFees: () => void;
  onNotices: () => void;
  onAddStudent: () => void;
  onCreateBatch: () => void;
};

const rupees = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

export default function DashboardOverview({
  students,
  studentSummary,
  feeSummary,
  batches,
  search,
  todayLabel,
  currentDate,
  onStudents,
  onBatches,
  onAttendance,
  onFees,
  onNotices,
  onAddStudent,
  onCreateBatch,
}: DashboardOverviewProps) {
  const activeCount = studentSummary.active;

  const recent = students
    .filter((student) =>
      `${student.name} ${student._id}`
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    )
    .slice()
    .sort((a, b) =>
      (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
    )
    .slice(0, 5);

  const months = Array.from({ length: 6 }, (_, index) => {
    const month = new Date(`${currentDate || "2000-01-01"}T12:00:00`);

    month.setDate(1);
    month.setHours(0, 0, 0, 0);
    month.setMonth(month.getMonth() - (5 - index));

    const key = `${month.getFullYear()}-${String(
      month.getMonth() + 1
    ).padStart(2, "0")}`;

    return {
      label: month.toLocaleDateString("en", { month: "short" }),
      count: studentSummary.growth[key] ?? 0,
    };
  });

  const maxGrowth = Math.max(1, ...months.map((item) => item.count));

  return (
    <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
      {/* Welcome Banner */}
      <section className="relative flex min-w-0 items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-600 px-5 py-7 shadow-lg shadow-indigo-200/50 dark:shadow-none sm:gap-7 sm:px-8 sm:py-9">
        {/* Decorative background */}
        <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-28 right-1/4 h-52 w-52 rounded-full bg-purple-300/20 blur-2xl" />

        {/* Logo */}
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md sm:h-24 sm:w-24 sm:rounded-3xl">
          <svg
            viewBox="0 0 64 64"
            className="h-10 w-10 text-indigo-700 sm:h-16 sm:w-16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Udaan Learning Centre logo"
            role="img"
          >
            <path
              d="M7 24L32 11L57 24L32 37L7 24Z"
              fill="currentColor"
            />
            <path
              d="M17 30V42C17 42 23 51 32 51C41 51 47 42 47 42V30L32 38L17 30Z"
              fill="currentColor"
              opacity="0.85"
            />
            <path
              d="M56 25V42"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="56" cy="46" r="3" fill="currentColor" />
          </svg>
        </div>

        {/* Divider */}
        <div className="relative h-16 w-px shrink-0 bg-white/40 sm:h-20" />

        {/* Brand and date */}
        <div className="relative min-w-0 flex-1">
          <h1 className="break-words text-lg font-extrabold leading-tight tracking-wide text-white sm:text-3xl lg:text-4xl">
            UDAAN LEARNING CENTRE
          </h1>

          <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-indigo-950 shadow-sm sm:mt-4 sm:px-5 sm:py-3">
            <svg
              className="h-5 w-5 shrink-0 sm:h-6 sm:w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 10h18" />
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
            </svg>

            <span className="truncate text-xs font-semibold sm:text-base">
              Today, {todayLabel}
            </span>
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      <section
        className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
        aria-label="Tuition centre summary"
      >
        {/* Total Students */}
        <button
          className="flex min-w-0 items-start justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-blue-900/60 dark:bg-blue-950/40 sm:p-5"
          onClick={onStudents}
        >
          <div className="min-w-0">
            <small className="text-xs font-medium text-blue-700 sm:text-sm dark:text-blue-300">
              Total Students
            </small>

            <strong className="mt-2 block text-2xl font-bold text-blue-950 dark:text-blue-100">
              {studentSummary.total.toLocaleString("en-IN")}
            </strong>

            <em className="text-[11px] not-italic text-blue-700/80 sm:text-xs dark:text-blue-300/80">
              Active &amp; inactive
            </em>
          </div>

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80 text-blue-600 dark:bg-blue-900/70 dark:text-blue-300 sm:h-10 sm:w-10">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 sm:h-6 sm:w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
        </button>

        {/* Active Students */}
        <button
          className="flex min-w-0 items-start justify-between gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md dark:border-green-900/60 dark:bg-green-950/40 sm:p-5"
          onClick={onStudents}
        >
          <div className="min-w-0">
            <small className="text-xs font-medium text-green-700 sm:text-sm dark:text-green-300">
              Active Students
            </small>

            <strong className="mt-2 block text-2xl font-bold text-green-950 dark:text-green-100">
              {activeCount}
            </strong>

            <em className="text-[11px] not-italic text-green-700/80 sm:text-xs dark:text-green-300/80">
              Currently studying
            </em>
          </div>

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80 text-green-600 dark:bg-green-900/70 dark:text-green-300 sm:h-10 sm:w-10">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 sm:h-6 sm:w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 7 10 17l-5-5" />
              <path d="M12 3a9 9 0 1 0 9 9" />
            </svg>
          </span>
        </button>

        {/* Total Batches */}
        <button
          className="flex min-w-0 items-start justify-between gap-2 rounded-xl border border-violet-200 bg-violet-50 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md dark:border-violet-900/60 dark:bg-violet-950/40 sm:p-5"
          onClick={onBatches}
        >
          <div className="min-w-0">
            <small className="text-xs font-medium text-violet-700 sm:text-sm dark:text-violet-300">
              Total Batches
            </small>

            <strong className="mt-2 block text-2xl font-bold text-violet-950 dark:text-violet-100">
              {studentSummary.totalBatches}
            </strong>

            <em className="text-[11px] not-italic text-violet-700/80 sm:text-xs dark:text-violet-300/80">
              {batches.filter((batch) => batch.active).length} active schedules
            </em>
          </div>

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80 text-violet-600 dark:bg-violet-900/70 dark:text-violet-300 sm:h-10 sm:w-10">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 sm:h-6 sm:w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="17" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18M8 14h3M8 17h3M15 14h2" />
            </svg>
          </span>
        </button>

        {/* Fees Collected */}
        <button
          className="flex min-w-0 items-start justify-between gap-2 rounded-xl border border-orange-200 bg-orange-50 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md dark:border-orange-900/60 dark:bg-orange-950/40 sm:p-5"
          onClick={onFees}
        >
          <div className="min-w-0">
            <small className="text-xs font-medium text-orange-700 sm:text-sm dark:text-orange-300">
              Fees Collected
            </small>

            <strong className="mt-2 block break-words text-lg font-bold text-orange-950 dark:text-orange-100 sm:text-2xl">
              {rupees(feeSummary.feesCollected)}
            </strong>

            <em className="text-[11px] not-italic text-orange-700/80 sm:text-xs dark:text-orange-300/80">
              {rupees(feeSummary.totalDue)} remaining this month
            </em>
          </div>

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80 text-orange-600 dark:bg-orange-900/70 dark:text-orange-300 sm:h-10 sm:w-10">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 sm:h-6 sm:w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </span>
        </button>
      </section>

      {/* Charts and Fee Collection */}
      <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-5">
        {/* Student Growth */}
        <article className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-5">
          <div className="mb-5">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Student Growth
            </h2>

            <p className="text-sm text-gray-500">
              New student records by month
            </p>
          </div>

          {studentSummary.total ? (
            <div
              className="flex h-48 min-w-0 items-end justify-around gap-2 sm:gap-4"
              role="img"
              aria-label="Student registrations by month"
            >
              {months.map((month) => (
                <div
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  key={month.label}
                >
                  <strong className="text-xs text-gray-700 dark:text-gray-300 sm:text-sm">
                    {month.count}
                  </strong>

                  <div className="flex h-32 w-full items-end justify-center rounded-t-md bg-gray-100 dark:bg-gray-800">
                    <i
                      className="w-full rounded-t-md bg-blue-500"
                      style={{
                        height: `${Math.max(
                          month.count ? 12 : 4,
                          (month.count / maxGrowth) * 100
                        )}%`,
                      }}
                    />
                  </div>

                  <span className="text-xs text-gray-500">
                    {month.label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-gray-500">
              Student registrations will appear here when records exist.
            </div>
          )}
        </article>

        {/* Fees Collection */}
        <article className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-5">
          <div className="mb-5 flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Fees Collection
              </h2>

              <p className="text-sm text-gray-500">
                Current month collection
              </p>
            </div>

            <button
              className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700"
              onClick={onFees}
            >
              View fees →
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="min-w-0">
              <small className="text-xs text-gray-500">Expected</small>

              <strong className="mt-1 block break-words text-sm text-gray-900 dark:text-white sm:text-base">
                {rupees(feeSummary.totalExpected)}
              </strong>
            </div>

            <div className="min-w-0">
              <small className="text-xs text-gray-500">Collected</small>

              <strong className="mt-1 block break-words text-sm text-green-600 sm:text-base">
                {rupees(feeSummary.feesCollected)}
              </strong>
            </div>

            <div className="min-w-0">
              <small className="text-xs text-gray-500">Remaining</small>

              <strong className="mt-1 block break-words text-sm text-red-600 sm:text-base">
                {rupees(feeSummary.totalDue)}
              </strong>
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <i
              className="block h-full rounded-full bg-green-500"
              style={{
                width: `${
                  feeSummary.totalExpected
                    ? Math.min(
                        100,
                        (feeSummary.feesCollected /
                          feeSummary.totalExpected) *
                          100
                      )
                    : 0
                }%`,
              }}
            />
          </div>

          <p className="mt-3 text-sm text-gray-500">
            {feeSummary.studentsPaid} paid · {feeSummary.studentsDue} due
          </p>
        </article>
      </section>

      {/* Quick Actions */}
      <section aria-label="Quick actions" className="min-w-0">
        <div className="mb-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h2>

          <p className="text-xs text-gray-500">
            Commonly used shortcuts
          </p>
        </div>

        <div className="flex min-w-0 flex-nowrap gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:pb-0 xl:grid-cols-5">
          <button
            className="w-[132px] shrink-0 rounded-xl border border-blue-100 bg-blue-50 p-3 text-left transition hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/50 dark:hover:bg-blue-900 sm:w-auto sm:p-4"
            onClick={onAddStudent}
          >
            <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lg font-semibold text-blue-600 dark:bg-blue-900 dark:text-blue-300">
              +
            </span>

            <b className="block text-xs font-semibold text-gray-900 dark:text-white sm:text-sm">
              Add Student
            </b>

            <small className="mt-1 block text-[10px] text-gray-500 sm:text-xs">
              Create profile
            </small>
          </button>

          <button
            className="w-[132px] shrink-0 rounded-xl border border-green-100 bg-green-50 p-3 text-left transition hover:bg-green-100 dark:border-green-900 dark:bg-green-950/50 dark:hover:bg-green-900 sm:w-auto sm:p-4"
            onClick={onCreateBatch}
          >
            <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-semibold text-green-600 dark:bg-green-900 dark:text-green-300">
              ▦
            </span>

            <b className="block text-xs font-semibold text-gray-900 dark:text-white sm:text-sm">
              Create Batch
            </b>

            <small className="mt-1 block text-[10px] text-gray-500 sm:text-xs">
              Set batch timing
            </small>
          </button>

          <button
            className="w-[132px] shrink-0 rounded-xl border border-purple-100 bg-purple-50 p-3 text-left transition hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950/50 dark:hover:bg-purple-900 sm:w-auto sm:p-4"
            onClick={onAttendance}
          >
            <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-semibold text-purple-600 dark:bg-purple-900 dark:text-purple-300">
              ✓
            </span>

            <b className="block text-xs font-semibold text-gray-900 dark:text-white sm:text-sm">
              Attendance
            </b>

            <small className="mt-1 block text-[10px] text-gray-500 sm:text-xs">
              Mark attendance
            </small>
          </button>

          <button
            className="w-[132px] shrink-0 rounded-xl border border-orange-100 bg-orange-50 p-3 text-left transition hover:bg-orange-100 dark:border-orange-900 dark:bg-orange-950/50 dark:hover:bg-orange-900 sm:w-auto sm:p-4"
            onClick={onFees}
          >
            <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-semibold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
              ₹
            </span>

            <b className="block text-xs font-semibold text-gray-900 dark:text-white sm:text-sm">
              Collect Fees
            </b>

            <small className="mt-1 block text-[10px] text-gray-500 sm:text-xs">
              Record payment
            </small>
          </button>

          <button
            className="w-[132px] shrink-0 rounded-xl border border-red-100 bg-red-50 p-3 text-left transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/50 dark:hover:bg-red-900 sm:w-auto sm:p-4"
            onClick={onNotices}
          >
            <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-semibold text-red-600 dark:bg-red-900 dark:text-red-300">
              ↗
            </span>

            <b className="block text-xs font-semibold text-gray-900 dark:text-white sm:text-sm">
              Send Notice
            </b>

            <small className="mt-1 block text-[10px] text-gray-500 sm:text-xs">
              Share announcement
            </small>
          </button>
        </div>
      </section>

      {/* Recent Students */}
      <section className="min-w-0 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Recent Students
            </h2>

            <p className="text-sm text-gray-500">
              Latest student records from your directory
            </p>
          </div>

          <button
            className="self-start text-sm font-medium text-blue-600 hover:text-blue-700 sm:self-auto"
            onClick={onStudents}
          >
            View all →
          </button>
        </div>

        {recent.length ? (
          <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 dark:bg-gray-800">
                <tr>
                  <th className="whitespace-nowrap p-3">#</th>
                  <th className="whitespace-nowrap p-3">Student ID</th>
                  <th className="whitespace-nowrap p-3">Name</th>
                  <th className="whitespace-nowrap p-3">Class</th>
                  <th className="whitespace-nowrap p-3">Batch</th>
                  <th className="whitespace-nowrap p-3">Admission Date</th>
                  <th className="whitespace-nowrap p-3">Status</th>
                  <th className="whitespace-nowrap p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {recent.map((student, index) => {
                  const batch =
                    typeof student.batchId === "object" && student.batchId
                      ? student.batchId
                      : batches.find(
                          (item) => item._id === student.batchId
                        );

                  return (
                    <tr
                      key={student._id}
                      className="border-t border-gray-100 dark:border-gray-800"
                    >
                      <td className="whitespace-nowrap p-3">
                        {index + 1}
                      </td>

                      <td className="whitespace-nowrap p-3">
                        {student.studentId ??
                          `STU${student._id.slice(-6).toUpperCase()}`}
                      </td>

                      <td className="whitespace-nowrap p-3">
                        <div className="flex items-center gap-2">
                          {student.profilePhoto && (
                            <NextImage
                              src={student.profilePhoto}
                              alt={`${student.name} profile`}
                              width={32}
                              height={32}
                              className="h-8 w-8 shrink-0 rounded-full object-cover"
                              unoptimized
                            />
                          )}

                          <span className="font-medium text-gray-900 dark:text-white">
                            {student.name}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap p-3">
                        {student.className || "—"}
                      </td>

                      <td className="whitespace-nowrap p-3">
                        {batch?.name ?? "Unassigned"}
                      </td>

                      <td className="whitespace-nowrap p-3">
                        {student.admissionDate || student.createdAt
                          ? new Date(
                              `${student.admissionDate || student.createdAt}`.slice(
                                0,
                                10
                              ) + "T12:00:00"
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap p-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            student.active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {student.active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap p-3">
                        <button
                          aria-label={`View ${student.name} in student directory`}
                          onClick={onStudents}
                          className="rounded-lg px-3 py-1 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          ···
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-sm leading-6 text-gray-500 sm:p-8">
            {search
              ? "No students match this search."
              : "No student records yet. Add your first student to see the directory here."}
          </div>
        )}
      </section>
    </div>
  );
}