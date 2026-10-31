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
    <div className="flex flex-col gap-6">
      <section className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900 md:flex-row md:items-center">
        <div>
          <span className="text-xs font-semibold tracking-wider text-gray-500">
            UDAAN LEARNING CENTRE · ADMIN WORKSPACE
          </span>

          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {greeting}, {profile?.name || "Admin"}! 👋
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s what&apos;s happening in your tuition today.
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 px-5 py-3 dark:bg-gray-800">
          <span className="block text-xs text-gray-500">Today</span>
          <strong className="text-sm text-gray-900 dark:text-white">
            {todayLabel}
          </strong>
        </div>
      </section>

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Tuition centre summary"
      >
        <button
          className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm dark:border-gray-800 dark:bg-gray-900"
          onClick={onStudents}
        >
          <small className="text-gray-500">Total Students</small>
          <strong className="mt-2 block text-2xl font-bold">
            {studentSummary.total.toLocaleString("en-IN")}
          </strong>
          <em className="text-xs text-gray-500">Active &amp; inactive</em>
        </button>

        <button
          className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm dark:border-gray-800 dark:bg-gray-900"
          onClick={onStudents}
        >
          <small className="text-gray-500">Active Students</small>
          <strong className="mt-2 block text-2xl font-bold">
            {activeCount}
          </strong>
          <em className="text-xs text-gray-500">Currently studying</em>
        </button>

        <button
          className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm dark:border-gray-800 dark:bg-gray-900"
          onClick={onBatches}
        >
          <small className="text-gray-500">Total Batches</small>
          <strong className="mt-2 block text-2xl font-bold">
            {studentSummary.totalBatches}
          </strong>
          <em className="text-xs text-gray-500">
            {batches.filter((batch) => batch.active).length} active schedules
          </em>
        </button>

        <button
          className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm dark:border-gray-800 dark:bg-gray-900"
          onClick={onFees}
        >
          <small className="text-gray-500">Fees Collected</small>
          <strong className="mt-2 block text-2xl font-bold">
            {rupees(feeSummary.feesCollected)}
          </strong>
          <em className="text-xs text-gray-500">
            {rupees(feeSummary.totalDue)} remaining this month
          </em>
        </button>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <article className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-5">
            <h2 className="font-semibold">Student Growth</h2>
            <p className="text-sm text-gray-500">
              New student records by month
            </p>
          </div>

          {studentSummary.total ? (
            <div
              className="flex h-48 items-end justify-around gap-4"
              role="img"
              aria-label="Student registrations by month"
            >
              {months.map((month) => (
                <div
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                  key={month.label}
                >
                  <strong className="text-sm">{month.count}</strong>

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

        <article className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h2 className="font-semibold">Fees Collection</h2>
              <p className="text-sm text-gray-500">
                Current month collection
              </p>
            </div>

            <button
              className="text-sm font-medium text-blue-600"
              onClick={onFees}
            >
              View fees →
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <small className="text-gray-500">Expected</small>
              <strong className="mt-1 block">
                {rupees(feeSummary.totalExpected)}
              </strong>
            </div>

            <div>
              <small className="text-gray-500">Collected</small>
              <strong className="mt-1 block text-green-600">
                {rupees(feeSummary.feesCollected)}
              </strong>
            </div>

            <div>
              <small className="text-gray-500">Remaining</small>
              <strong className="mt-1 block text-red-600">
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

      <section
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5"
        aria-label="Quick actions"
      >
        <button
          className="rounded-xl bg-blue-50 p-4 text-left dark:bg-blue-950"
          onClick={onAddStudent}
        >
          <b className="block">＋ Add New Student</b>
          <small className="text-gray-500">Create student profile</small>
        </button>

        <button
          className="rounded-xl bg-green-50 p-4 text-left dark:bg-green-950"
          onClick={onCreateBatch}
        >
          <b className="block">＋ Create Batch</b>
          <small className="text-gray-500">Set batch timing</small>
        </button>

        <button
          className="rounded-xl bg-purple-50 p-4 text-left dark:bg-purple-950"
          onClick={onAttendance}
        >
          <b className="block">✓ Take Attendance</b>
          <small className="text-gray-500">Mark today&apos;s attendance</small>
        </button>

        <button
          className="rounded-xl bg-orange-50 p-4 text-left dark:bg-orange-950"
          onClick={onFees}
        >
          <b className="block">₹ Collect Fees</b>
          <small className="text-gray-500">Record a fee payment</small>
        </button>

        <button
          className="rounded-xl bg-red-50 p-4 text-left dark:bg-red-950"
          onClick={onNotices}
        >
          <b className="block">↗ Send Notice</b>
          <small className="text-gray-500">Notice module unavailable</small>
        </button>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between p-5">
          <div>
            <h2 className="font-semibold">Recent Students</h2>
            <p className="text-sm text-gray-500">
              Latest student records from your directory
            </p>
          </div>

          <button
            className="text-sm font-medium text-blue-600"
            onClick={onStudents}
          >
            View all →
          </button>
        </div>

        {recent.length ? (
          <div className="overflow-x-auto">
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
          <div className="p-8 text-center text-sm text-gray-500">
            {search
              ? "No students match this search."
              : "No student records yet. Add your first student to see the directory here."}
          </div>
        )}
      </section>
    </div>
  );
}