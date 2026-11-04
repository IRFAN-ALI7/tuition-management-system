
"use client";

import {
  ChevronLeft,
  ChevronRight,
  Download,
  ReceiptText,
  Wallet,
} from "lucide-react";

import {
  FEE_MONTHS,
  formatFeeDate,
  formatMoney,
  type StudentFeePagination,
  type StudentFeePayment,
} from "@/types/student-fees";

interface Props {
  payments: StudentFeePayment[];
  pagination: StudentFeePagination;
  loading: boolean;
  onPageChange: (page: number) => void;
  onReceipt: (paymentId: string) => void;
}

function getPageNumbers(current: number, total: number) {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (current <= 3) return [1, 2, 3, "...", total];

  if (current >= total - 2) {
    return [1, "...", total - 2, total - 1, total];
  }

  return [
    1,
    "...",
    current - 1,
    current,
    current + 1,
    "...",
    total,
  ];
}

export default function PaymentHistory({
  payments,
  pagination,
  loading,
  onPageChange,
  onReceipt,
}: Props) {
  const currentPage = pagination.page;
  const totalPages = Math.max(1, pagination.totalPages);

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400">
            <ReceiptText className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white sm:text-base">
              Payment History
            </h2>
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              All payments recorded by your Tuition Admin
            </p>
          </div>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {pagination.total} Payments
        </span>
      </div>

      <div className="p-3 sm:p-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-slate-700">
            <Wallet className="mx-auto h-8 w-8 text-slate-400" />
            <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-white">
              No payment history
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Your payments will appear here after they are recorded by the admin.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                    <th className="px-3 py-3">Receipt No.</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Method</th>
                    <th className="px-3 py-3">Allocated Months</th>
                    <th className="px-3 py-3 text-right">Receipt</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment._id}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                    >
                      <td className="px-3 py-4">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {payment.receiptNumber}
                        </span>
                      </td>

                      <td className="px-3 py-4 text-slate-600 dark:text-slate-300">
                        {formatFeeDate(payment.paymentDate)}
                      </td>

                      <td className="px-3 py-4 font-extrabold text-green-700 dark:text-green-400">
                        {formatMoney(payment.amount)}
                      </td>

                      <td className="px-3 py-4 text-slate-600 dark:text-slate-300">
                        {payment.method}
                      </td>

                      <td className="max-w-[240px] px-3 py-4">
                        <div className="flex flex-wrap gap-1">
                          {payment.allocations.map((allocation, index) => (
                            <span
                              key={`${allocation.year}-${allocation.month}-${index}`}
                              className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {FEE_MONTHS[allocation.month - 1]}{" "}
                              {allocation.year}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-3 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => onReceipt(payment._id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300"
                        >
                          <Download className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-2.5 md:hidden">
              {payments.map((payment) => (
                <article
                  key={payment._id}
                  className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400">
                        <ReceiptText className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="break-all text-xs font-extrabold text-slate-900 dark:text-white">
                          {payment.receiptNumber}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                          {formatFeeDate(payment.paymentDate)} ·{" "}
                          {payment.method}
                        </p>
                      </div>
                    </div>

                    <p className="shrink-0 text-sm font-extrabold text-green-700 dark:text-green-400">
                      {formatMoney(payment.amount)}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {payment.allocations.map((allocation, index) => (
                      <span
                        key={`${allocation.year}-${allocation.month}-${index}`}
                        className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {FEE_MONTHS[allocation.month - 1]}{" "}
                        {allocation.year}
                      </span>
                    ))}
                  </div>

                  {payment.referenceNumber && (
                    <p className="mt-2 break-all text-[10px] text-slate-500 dark:text-slate-400">
                      Reference: {payment.referenceNumber}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => onReceipt(payment._id)}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 text-xs font-bold text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300"
                  >
                    <Download className="h-4 w-4" />
                    View / Download Receipt
                  </button>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing {(currentPage - 1) * pagination.limit + 1}–
                  {Math.min(currentPage * pagination.limit, pagination.total)}{" "}
                  of {pagination.total} payments
                </p>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                    aria-label="Previous payment page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {pageNumbers.map((page, index) =>
                    typeof page === "number" ? (
                      <button
                        key={page}
                        type="button"
                        onClick={() => onPageChange(page)}
                        aria-current={
                          currentPage === page ? "page" : undefined
                        }
                        className={`h-9 min-w-9 rounded-lg px-2.5 text-xs font-bold ${
                          currentPage === page
                            ? "bg-violet-600 text-white"
                            : "border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {page}
                      </button>
                    ) : (
                      <span
                        key={`dots-${index}`}
                        className="px-1 text-xs text-slate-400"
                      >
                        ...
                      </span>
                    )
                  )}

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                    aria-label="Next payment page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
