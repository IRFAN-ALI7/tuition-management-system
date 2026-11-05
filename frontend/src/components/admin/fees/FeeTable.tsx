"use client";

import NextImage from "next/image";

import {
  money,
  MONTHS,
  outlineButtonClass,
  type FeeRow,
} from "./feeTypes";

type Props = {
  rows: FeeRow[];
  loading: boolean;
  error: string;
  notice: string;
  hasReceipt: boolean;
  query: string;
  month: number;
  page: number;
  limit: number;
  pagination: { total: number; totalPages: number };
  pageStart: number;
  pageEnd: number;
  onView: (studentId: string) => void;
  onPayment: (studentId: string) => void;
  onViewReceipt: () => void;
  onDismissNotice: () => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

export default function FeeTable({
  rows,
  loading,
  error,
  notice,
  hasReceipt,
  query,
  month,
  page,
  limit,
  pagination,
  pageStart,
  pageEnd,
  onView,
  onPayment,
  onViewReceipt,
  onDismissNotice,
  onPageChange,
  onLimitChange,
}: Props) {
  const pageCount = Math.max(1, pagination.totalPages);

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {error && (
        <div
          className="m-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 sm:m-4"
          role="alert"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          className="m-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 sm:m-4"
          role="status"
        >
          <span>{notice}</span>

          <div className="flex items-center gap-3">
            {hasReceipt && (
              <button
                className="font-semibold underline"
                onClick={onViewReceipt}
              >
                View / Print receipt
              </button>
            )}

            <button
              aria-label="Dismiss message"
              className="text-lg"
              onClick={onDismissNotice}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[950px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              {[
                "Student ID",
                "Student Name",
                "Batch",
                "Monthly Fees",
                `${MONTHS[month - 1]} Paid`,
                "Total Due",
                "Status",
                "Actions",
              ].map((heading) => (
                <th
                  key={heading}
                  className="whitespace-nowrap border-b border-slate-200 px-4 py-3 font-semibold dark:border-slate-700"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td
                  className="px-4 py-10 text-center text-slate-500"
                  colSpan={8}
                >
                  Loading fees...
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row._id}
                  className="transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                    {row.student.studentId ??
                      `STU${row.student._id.slice(-6).toUpperCase()}`}
                  </td>

                  {/* Student name with profile photo */}
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-sm font-semibold text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                        {row.student.profilePhoto ? (
                          <NextImage
                            src={row.student.profilePhoto}
                            alt={`${row.student.name} profile photo`}
                            fill
                            sizes="36px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          row.student.name.slice(0, 1).toUpperCase()
                        )}
                      </div>

                      <strong className="min-w-0 break-words text-slate-900 dark:text-slate-100">
                        {row.student.name}
                      </strong>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {row.batch?.name ?? (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">
                    {money(row.feeAmount)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">
                    {money(row.paidAmount)}
                  </td>

                  <td
                    className={`whitespace-nowrap px-4 py-3 font-semibold ${
                      row.totalDueAmount
                        ? "text-rose-600"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {money(row.totalDueAmount)}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        row.status === "paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {row.status === "paid" ? "Paid" : "Due"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        onClick={() => onView(row.student._id)}
                      >
                        View
                      </button>

                      <button
                        className="whitespace-nowrap rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                        onClick={() => onPayment(row.student._id)}
                      >
                        Record Payment
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td
                  className="px-4 py-10 text-center text-slate-500"
                  colSpan={8}
                >
                  {query
                    ? "No students match this search."
                    : "No monthly fee records found for this month."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-col gap-3 border-t border-slate-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-4 dark:border-slate-800">
        <span className="text-xs text-slate-500 sm:text-sm">
          Showing {pagination.total ? (page - 1) * limit + 1 : 0}–
          {Math.min(page * limit, pagination.total)} of{" "}
          {pagination.total.toLocaleString("en-IN")} students
        </span>

        <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
          <label className="flex items-center gap-2 text-xs text-slate-600 sm:text-sm dark:text-slate-300">
            Rows per page

            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>

          <div className="flex items-center gap-1.5">
            <button
              className={outlineButtonClass}
              disabled={page <= 1 || loading}
              aria-label="Previous page"
              onClick={() => onPageChange(page - 1)}
            >
              ‹
            </button>

            {Array.from(
              { length: Math.max(0, pageEnd - pageStart + 1) },
              (_, index) => pageStart + index,
            ).map((item) => (
              <button
                key={item}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  page === item
                    ? "bg-blue-600 text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
                aria-current={page === item ? "page" : undefined}
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            ))}

            <button
              className={outlineButtonClass}
              disabled={page >= pageCount || loading}
              aria-label="Next page"
              onClick={() => onPageChange(page + 1)}
            >
              ›
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}