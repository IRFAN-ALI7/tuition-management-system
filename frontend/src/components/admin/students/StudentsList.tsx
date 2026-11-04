
"use client";

import NextImage from "next/image";
import type {
  Student,
  Batch,
  StudentSummary,
  StudentPagination,
  StudentFilters,
} from "../shared/types";

type StudentsListProps = {
  students: Student[];
  batches: Batch[];
  summary: StudentSummary;
  pagination: StudentPagination;
  classes: string[];
  filters: StudentFilters;
  loading: boolean;
  error: string;
  onFilter: (
    key: keyof StudentFilters,
    value: string | number
  ) => void;
  onReset: () => void;
  onAdd: () => void;
  onView: (student: Student) => void;
  onStatus: (student: Student) => void;
};

export default function StudentsList({
  students,
  batches,
  summary,
  pagination,
  classes,
  filters,
  loading,
  error,
  onFilter,
  onReset,
  onAdd,
  onView,
}: StudentsListProps) {
  const totalPages = Math.max(1, pagination.totalPages);

  const startPage = Math.max(
    1,
    Math.min(filters.page - 2, totalPages - 4)
  );

  const endPage = Math.min(totalPages, startPage + 4);

  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index
  );

  const startRow = pagination.total
    ? (filters.page - 1) * filters.limit + 1
    : 0;

  const endRow = Math.min(
    filters.page * filters.limit,
    pagination.total
  );

  const batchFor = (student: Student) =>
    typeof student.batchId === "object" && student.batchId
      ? student.batchId
      : batches.find((batch) => batch._id === student.batchId);

  return (
    <section className="flex min-w-0 flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-sm text-gray-500">
            Manage all your students
          </p>
        </div>

        <button
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
          onClick={onAdd}
        >
          <span>＋</span> Add Student
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        <SummaryCard
          label="Total Students"
          value={summary.total.toLocaleString("en-IN")}
        />

        <SummaryCard
          label="Active Students"
          value={summary.active.toLocaleString("en-IN")}
        />

        <SummaryCard
          label="Inactive Students"
          value={summary.inactive.toLocaleString("en-IN")}
        />

        <SummaryCard
          label="Total Batches"
          value={summary.totalBatches.toLocaleString("en-IN")}
        />
      </div>

      {/* Search and Filters */}
      <div className="grid min-w-0 grid-cols-1 gap-2 rounded-xl border border-gray-200 bg-white p-2 sm:gap-3 sm:p-4 dark:border-gray-800 dark:bg-gray-900">
        {/* Search */}
        <label className="flex min-w-0 items-center gap-2 rounded-lg border border-gray-200 px-3 dark:border-gray-700">
          <span aria-hidden="true">⌕</span>

          <input
            className="w-full min-w-0 bg-transparent py-2 text-sm outline-none"
            aria-label="Search students"
            placeholder="Search by name, phone, student ID..."
            value={filters.q}
            onChange={(event) => onFilter("q", event.target.value)}
          />
        </label>

        {/* All three filters in one row */}
        <div className="grid min-w-0 grid-cols-3 gap-2">
          <select
            className="w-full min-w-0 rounded-lg border border-gray-200 bg-white px-1.5 py-2 text-xs sm:px-3 sm:text-sm dark:border-gray-700 dark:bg-gray-900"
            aria-label="Filter by class"
            value={filters.className}
            onChange={(event) =>
              onFilter("className", event.target.value)
            }
          >
            <option value="all">All Classes</option>

            {classes.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>

          <select
            className="w-full min-w-0 rounded-lg border border-gray-200 bg-white px-1.5 py-2 text-xs sm:px-3 sm:text-sm dark:border-gray-700 dark:bg-gray-900"
            aria-label="Filter by batch"
            value={filters.batchId}
            onChange={(event) =>
              onFilter("batchId", event.target.value)
            }
          >
            <option value="all">All Batches</option>

            {batches.map((batch) => (
              <option key={batch._id} value={batch._id}>
                {batch.name}
              </option>
            ))}
          </select>

          <select
            className="w-full min-w-0 rounded-lg border border-gray-200 bg-white px-1.5 py-2 text-xs sm:px-3 sm:text-sm dark:border-gray-700 dark:bg-gray-900"
            aria-label="Filter by status"
            value={filters.status}
            onChange={(event) =>
              onFilter("status", event.target.value)
            }
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Reset stays in its own fixed row */}
        <button
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          onClick={onReset}
        >
          Reset
        </button>
      </div>

      {/* Students Table */}
      <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {error && (
          <div
            className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 dark:bg-gray-800">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Student ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Class</th>
                <th className="p-3">Batch</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="p-8 text-center" colSpan={8}>
                    Loading students…
                  </td>
                </tr>
              ) : (
                students.map((student, index) => {
                  const batch = batchFor(student);

                  const id =
                    student.studentId ??
                    `STU${student._id.slice(-6).toUpperCase()}`;

                  return (
                    <tr
                      key={student._id}
                      className="border-t border-gray-100 dark:border-gray-800"
                    >
                      <td className="p-3">
                        {startRow + index}
                      </td>

                      <td className="p-3">{id}</td>

                      <td className="p-3">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            {student.profilePhoto ? (
                              <NextImage
                                src={student.profilePhoto}
                                alt=""
                                width={30}
                                height={30}
                                unoptimized
                              />
                            ) : (
                              student.name.slice(0, 1).toUpperCase()
                            )}
                          </span>

                          <strong className="min-w-0 break-words">
                            {student.name}
                          </strong>
                        </span>
                      </td>

                      <td className="p-3">{student.phone}</td>

                      <td className="p-3">
                        {student.className || "—"}
                      </td>

                      <td className="p-3">
                        {batch ? batch.name : "Unassigned"}
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            student.active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {student.active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="p-3">
                        <button
                          title="View profile"
                          aria-label={`View ${student.name}`}
                          onClick={() => onView(student)}
                          className="whitespace-nowrap font-medium text-blue-600 transition hover:text-blue-800"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}

              {!loading && students.length === 0 && (
                <tr>
                  <td
                    className="p-8 text-center text-gray-500"
                    colSpan={8}
                  >
                    {pagination.total === 0 &&
                    !filters.q &&
                    filters.className === "all" &&
                    filters.batchId === "all" &&
                    filters.status === "all"
                      ? "No student records yet. Add your first student to get started."
                      : "No students match the current search and filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <footer className="flex flex-col justify-between gap-4 border-t border-gray-100 p-3 sm:p-4 dark:border-gray-800 md:flex-row md:items-center">
          <span className="text-sm text-gray-500">
            Showing {startRow}–{endRow} of{" "}
            {pagination.total.toLocaleString("en-IN")} students
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs">
              Rows per page

              <select
                className="rounded border border-gray-200 bg-transparent p-1 dark:border-gray-700"
                value={filters.limit}
                onChange={(event) =>
                  onFilter("limit", Number(event.target.value))
                }
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>

            <button
              disabled={filters.page <= 1 || loading}
              onClick={() => onFilter("page", filters.page - 1)}
              aria-label="Previous page"
              className="rounded border border-gray-200 px-2 py-1 disabled:opacity-40 dark:border-gray-700"
            >
              ‹
            </button>

            {startPage > 1 && (
              <>
                <button
                  className="rounded border border-gray-200 px-2 py-1 dark:border-gray-700"
                  onClick={() => onFilter("page", 1)}
                >
                  1
                </button>

                {startPage > 2 && <span>…</span>}
              </>
            )}

            {pages.map((page) => (
              <button
                key={page}
                className={`rounded px-2 py-1 ${
                  filters.page === page
                    ? "bg-blue-600 text-white"
                    : "border border-gray-200 dark:border-gray-700"
                }`}
                aria-current={
                  filters.page === page ? "page" : undefined
                }
                onClick={() => onFilter("page", page)}
              >
                {page}
              </button>
            ))}

            {endPage < totalPages && (
              <>
                <span>…</span>

                <button
                  className="rounded border border-gray-200 px-2 py-1 dark:border-gray-700"
                  onClick={() => onFilter("page", totalPages)}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              disabled={filters.page >= totalPages || loading}
              onClick={() => onFilter("page", filters.page + 1)}
              aria-label="Next page"
              className="rounded border border-gray-200 px-2 py-1 disabled:opacity-40 dark:border-gray-700"
            >
              ›
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="flex min-w-0 items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 sm:gap-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 sm:h-10 sm:w-10 dark:bg-blue-950">
        ●
      </div>

      <div className="min-w-0">
        <small className="text-xs text-gray-500">{label}</small>
        <strong className="block text-xl">{value}</strong>
      </div>
    </article>
  );
}
