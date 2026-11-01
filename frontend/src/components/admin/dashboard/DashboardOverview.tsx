
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
  profile,
  search,
  todayLabel,
  greeting,
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
      {/* Welcome Section */}
      <section className="flex min-w-0 flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900 sm:p-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <span className="text-[11px] font-semibold tracking-wider text-gray-500 sm:text-xs">
            UDAAN LEARNING CENTRE · ADMIN WORKSPACE
          </span>

          <h1 className="mt-2 break-words text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            {greeting}, {profile?.name || "Admin"}! 👋
          </h1>

          <p className="mt-1 text-sm leading-6 text-gray-500">
            Here&apos;s what&apos;s happening in your tuition today.
          </p>
        </div>

        <div className="w-full rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800 md:w-auto md:min-w-[150px] md:px-5">
          <span className="block text-xs text-gray-500">Today</span>
          <strong className="mt-1 block text-sm text-gray-900 dark:text-white">
            {todayLabel}
          </strong>
        </div>
      </section>

      {/* Summary Cards */}
      <section
        className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4"
        aria-label="Tuition centre summary"
      >
        <button
          className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 sm:p-5"
          onClick={onStudents}
        >
          <small className="text-gray-500">Total Students</small>
          <strong className="mt-2 block text-2xl font-bold text-gray-900 dark:text-white">
            {studentSummary.total.toLocaleString("en-IN")}
          </strong>
          <em className="text-xs text-gray-500">Active &amp; inactive</em>
        </button>

        <button
          className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 sm:p-5"
          onClick={onStudents}
        >
          <small className="text-gray-500">Active Students</small>
          <strong className="mt-2 block text-2xl font-bold text-gray-900 dark:text-white">
            {activeCount}
          </strong>
          <em className="text-xs text-gray-500">Currently studying</em>
        </button>

        <button
          className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 sm:p-5"
          onClick={onBatches}
        >
          <small className="text-gray-500">Total Batches</small>
          <strong className="mt-2 block text-2xl font-bold text-gray-900 dark:text-white">
            {studentSummary.totalBatches}
          </strong>
          <em className="text-xs text-gray-500">
            {batches.filter((batch) => batch.active).length} active schedules
          </em>
        </button>

        <button
          className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 sm:p-5"
          onClick={onFees}
        >
          <small className="text-gray-500">Fees Collected</small>
          <strong className="mt-2 block break-words text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            {rupees(feeSummary.feesCollected)}
          </strong>
          <em className="text-xs text-gray-500">
            {rupees(feeSummary.totalDue)} remaining this month
          </em>
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

          <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-3 min-[400px]:gap-3">
            <div className="min-w-0">
              <small className="text-gray-500">Expected</small>
              <strong className="mt-1 block break-words text-sm text-gray-900 dark:text-white sm:text-base">
                {rupees(feeSummary.totalExpected)}
              </strong>
            </div>

            <div className="min-w-0">
              <small className="text-gray-500">Collected</small>
              <strong className="mt-1 block break-words text-sm text-green-600 sm:text-base">
                {rupees(feeSummary.feesCollected)}
              </strong>
            </div>

            <div className="min-w-0">
              <small className="text-gray-500">Remaining</small>
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
      <section
        className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5"
        aria-label="Quick actions"
      >
        <button
          className="min-w-0 rounded-xl bg-blue-50 p-4 text-left transition hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900"
          onClick={onAddStudent}
        >
          <b className="block text-sm text-gray-900 dark:text-white">
            ＋ Add New Student
          </b>
          <small className="mt-1 block text-gray-500">
            Create student profile
          </small>
        </button>

        <button
          className="min-w-0 rounded-xl bg-green-50 p-4 text-left transition hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900"
          onClick={onCreateBatch}
        >
          <b className="block text-sm text-gray-900 dark:text-white">
            ＋ Create Batch
          </b>
          <small className="mt-1 block text-gray-500">
            Set batch timing
          </small>
        </button>

        <button
          className="min-w-0 rounded-xl bg-purple-50 p-4 text-left transition hover:bg-purple-100 dark:bg-purple-950 dark:hover:bg-purple-900"
          onClick={onAttendance}
        >
          <b className="block text-sm text-gray-900 dark:text-white">
            ✓ Take Attendance
          </b>
          <small className="mt-1 block text-gray-500">
            Mark today&apos;s attendance
          </small>
        </button>

        <button
          className="min-w-0 rounded-xl bg-orange-50 p-4 text-left transition hover:bg-orange-100 dark:bg-orange-950 dark:hover:bg-orange-900"
          onClick={onFees}
        >
          <b className="block text-sm text-gray-900 dark:text-white">
            ₹ Collect Fees
          </b>
          <small className="mt-1 block text-gray-500">
            Record a fee payment
          </small>
        </button>

        <button
          className="min-w-0 rounded-xl bg-red-50 p-4 text-left transition hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900"
          onClick={onNotices}
        >
          <b className="block text-sm text-gray-900 dark:text-white">
            ↗ Send Notice
          </b>
          <small className="mt-1 block text-gray-500">
            Notice module unavailable
          </small>
        </button>
      </section>

      {/* Recent Students */}
      <section className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
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
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 dark:bg-gray-800">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Photo</th>
                  <th className="p-3">Student ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Class</th>
                  <th className="p-3">Batch</th>
                  <th className="p-3">Admission Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
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
                      <td className="p-3">{index + 1}</td>

                      <td className="p-3">
                        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xs dark:bg-gray-800">
                          {student.profilePhoto ? (
                            <NextImage
                              src={student.profilePhoto}
                              alt=""
                              width={32}
                              height={32}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            student.name
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()
                          )}
                        </span>
                      </td>

                      <td className="p-3">
                        {student.studentId ??
                          `STU${student._id.slice(-6).toUpperCase()}`}
                      </td>

                      <td className="p-3 font-medium">{student.name}</td>
                      <td className="p-3">{student.className || "—"}</td>
                      <td className="p-3">{batch?.name ?? "Unassigned"}</td>

                      <td className="p-3">
                        {(student.admissionDate || student.createdAt)
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

                      <td className="p-3">
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

                      <td className="p-3">
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
