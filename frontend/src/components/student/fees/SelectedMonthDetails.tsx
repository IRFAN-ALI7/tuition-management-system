
import {
  type StudentFeeMonth,
  type StudentFeePayment,
  money,
  MONTHS,
  formatFeeDate,
  formatFeeTime,
} from "@/types/student-fees";

interface Props {
  month: StudentFeeMonth | null;
  installments: StudentFeePayment[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  onReceipt: (paymentId: string) => void;
}

export default function SelectedMonthDetails({
  month,
  installments,
  loading,
  error,
  onRetry,
  onReceipt,
}: Props) {
  if (!month) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-500">Select a month to see details.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
          Selected month
        </p>
        <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
          {MONTHS[month.month - 1]} {month.year}
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-2 p-4 sm:gap-3 sm:p-5">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-[10px] text-slate-500">Monthly Fee</p>
          <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
            {money(month.feeAmount)}
          </p>
        </div>

        <div className="rounded-xl bg-green-50 p-3 dark:bg-green-950/30">
          <p className="text-[10px] text-green-700 dark:text-green-400">
            Paid
          </p>
          <p className="mt-1 text-sm font-bold text-green-700 dark:text-green-300">
            {money(month.paidAmount)}
          </p>
        </div>

        <div className="rounded-xl bg-red-50 p-3 dark:bg-red-950/30">
          <p className="text-[10px] text-red-700 dark:text-red-400">
            Remaining
          </p>
          <p className="mt-1 text-sm font-bold text-red-700 dark:text-red-300">
            {money(month.remainingAmount)}
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Installment History
            </h3>
            <p className="mt-1 text-[11px] text-slate-500">
              Each payment allocated to this month
            </p>
          </div>

          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
            {installments.length} payments
          </span>
        </div>

        {loading ? (
          <div className="rounded-xl bg-slate-50 p-6 text-center text-xs text-slate-500 dark:bg-slate-800">
            Loading installment history...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <p>{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 font-bold underline"
            >
              Try again
            </button>
          </div>
        ) : installments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              No installment recorded
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Payments allocated to this month will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {installments.map((payment) => {
              const allocation = payment.allocations.find(
                (item) =>
                  item.year === month.year && item.month === month.month,
              );

              if (!allocation) return null;

              return (
                <article
                  key={payment._id}
                  className="rounded-xl border border-slate-200 p-3 dark:border-slate-800 sm:p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-extrabold text-green-600">
                        {money(allocation.amount)}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        Receipt: {payment.receiptNumber}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onReceipt(payment._id)}
                      className="rounded-lg border border-violet-200 px-3 py-2 text-[10px] font-bold text-violet-700 hover:bg-violet-50 dark:border-violet-900 dark:text-violet-300"
                    >
                      View Receipt
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 dark:border-slate-800 sm:grid-cols-4">
                    <div>
                      <p className="text-[10px] text-slate-500">Payment Date</p>
                      <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {formatFeeDate(payment.paymentDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-500">Recorded Time</p>
                      <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {formatFeeTime(payment.createdAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-500">Method</p>
                      <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {payment.method}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-500">Reference</p>
                      <p className="mt-1 break-words text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {payment.referenceNumber || "—"}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
