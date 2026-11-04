
import {
  type StudentFeePayment,
  type StudentFeePagination,
  money,
  formatFeeDate,
  formatFeeTime,
} from "@/types/student-fees";

interface Props {
  payments: StudentFeePayment[];
  pagination: StudentFeePagination;
  onPageChange: (page: number) => void;
  onReceipt: (paymentId: string) => void;
}

export default function PaymentHistory({
  payments,
  pagination,
  onPageChange,
  onReceipt,
}: Props) {
  const { page, total, totalPages } = pagination;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Complete Payment History
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          All payments recorded by your Tuition Admin.
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            No payment history available
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Your payment records will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                  <th className="px-4 py-3">Receipt Number</th>
                  <th className="px-4 py-3">Payment Date</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3 text-right">Receipt</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment._id}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="px-4 py-4 font-semibold text-slate-800 dark:text-slate-200">
                      {payment.receiptNumber}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {formatFeeDate(payment.paymentDate)}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {formatFeeTime(payment.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-green-600">
                      {money(payment.amount)}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {payment.method}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onReceipt(payment._id)}
                        className="rounded-lg border border-violet-200 px-3 py-2 text-[10px] font-bold text-violet-700 hover:bg-violet-50 dark:border-violet-900 dark:text-violet-300"
                      >
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {payments.map((payment) => (
              <article
                key={payment._id}
                className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-green-600">
                      {money(payment.amount)}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {payment.receiptNumber}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onReceipt(payment._id)}
                    className="rounded-lg border border-violet-200 px-2.5 py-2 text-[10px] font-bold text-violet-700 dark:border-violet-900 dark:text-violet-300"
                  >
                    View Receipt
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div>
                    <p className="text-[10px] text-slate-500">Payment Date</p>
                    <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {formatFeeDate(payment.paymentDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-500">Time</p>
                    <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {formatFeeTime(payment.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-500">Payment Method</p>
                    <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {payment.method}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5">
            <p className="text-[11px] text-slate-500">
              {total === 0
                ? "No payments"
                : `Showing ${(page - 1) * pagination.limit + 1}–${Math.min(
                    page * pagination.limit,
                    total,
                  )} of ${total} payments`}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
              >
                Previous
              </button>

              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {page} / {Math.max(1, totalPages)}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
