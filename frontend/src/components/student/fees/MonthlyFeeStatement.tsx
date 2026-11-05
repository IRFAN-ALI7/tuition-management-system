
import {
  type StudentFeeMonth,
  type StudentMonthDetails,
  money,
  MONTHS,
} from "@/types/student-fees";

import SelectedMonthDetails from "./SelectedMonthDetails";

interface Props {
  year: number;
  months: StudentFeeMonth[];
  selectedMonth: number | null;
  onSelectMonth: (month: number) => void;
  monthDetails: StudentMonthDetails | null;
  monthLoading: boolean;
  monthError: string;
  onRetry: () => void;
  onReceipt: (paymentId: string) => void;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Paid: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400",
    Due: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    Upcoming:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    "Not due":
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[9px] font-bold sm:px-2.5 sm:text-[10px] ${
        styles[status] ?? styles["Not due"]
      }`}
    >
      {status}
    </span>
  );
}

export default function MonthlyFeeStatement({
  year,
  months,
  selectedMonth,
  onSelectMonth,
  monthDetails,
  monthLoading,
  monthError,
  onRetry,
  onReceipt,
}: Props) {
  const selectedRecord =
    months.find((item) => item.month === selectedMonth) ?? null;

  const closeDetails = () => {
    if (selectedMonth !== null) {
      onSelectMonth(selectedMonth);
    }
  };

  return (
    <>
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5 sm:py-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Monthly Fee Statement
          </h2>

          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs">
            Check the paid and remaining amount for every month of {year}.
            Select View to see the month&apos;s complete details.
          </p>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="px-4 py-2.5">Month</th>
                <th className="px-4 py-2.5 text-right">Fee</th>
                <th className="px-4 py-2.5 text-right">Paid</th>
                <th className="px-4 py-2.5 text-right">Remaining</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {months.map((item) => {
                const isSelected = selectedMonth === item.month;

                return (
                  <tr
                    key={`${item.year}-${item.month}`}
                    className={`border-b border-slate-100 last:border-0 dark:border-slate-800 ${
                      isSelected
                        ? "bg-violet-50/70 dark:bg-violet-950/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">
                      {MONTHS[item.month - 1]} {item.year}
                    </td>

                    <td className="px-4 py-2.5 text-right text-slate-600 dark:text-slate-300">
                      {money(item.feeAmount)}
                    </td>

                    <td className="px-4 py-2.5 text-right font-semibold text-green-600">
                      {money(item.paidAmount)}
                    </td>

                    <td className="px-4 py-2.5 text-right font-semibold text-red-600">
                      {item.status === "Upcoming" ||
                      item.status === "Not due"
                        ? "—"
                        : money(item.remainingAmount)}
                    </td>

                    <td className="px-4 py-2.5">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectMonth(item.month)}
                        className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${
                          isSelected
                            ? "bg-violet-700 text-white"
                            : "border border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-900 dark:text-violet-300"
                        }`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Compact mobile list */}
        <div className="space-y-2 p-2.5 md:hidden">
          {months.map((item) => {
            const isSelected = selectedMonth === item.month;

            return (
              <div
                key={`${item.year}-${item.month}`}
                className={`rounded-xl border p-2.5 ${
                  isSelected
                    ? "border-violet-300 bg-violet-50/60 dark:border-violet-800 dark:bg-violet-950/20"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                      {MONTHS[item.month - 1]} {item.year}
                    </p>

                    <StatusBadge status={item.status} />
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectMonth(item.month)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${
                      isSelected
                        ? "bg-violet-700 text-white"
                        : "border border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-900 dark:text-violet-300"
                    }`}
                  >
                    View
                  </button>
                </div>

                <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-slate-200/80 pt-2 dark:border-slate-700">
                  <div>
                    <p className="text-[9px] text-slate-500">Fee</p>
                    <p className="mt-0.5 text-[11px] font-bold text-slate-800 dark:text-white">
                      {money(item.feeAmount)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] text-slate-500">Paid</p>
                    <p className="mt-0.5 text-[11px] font-bold text-green-600">
                      {money(item.paidAmount)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] text-slate-500">Remaining</p>
                    <p className="mt-0.5 text-[11px] font-bold text-red-600">
                      {item.status === "Upcoming" ||
                      item.status === "Not due"
                        ? "—"
                        : money(item.remainingAmount)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Selected month details modal */}
      {selectedMonth !== null && selectedRecord && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
          onClick={closeDetails}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${MONTHS[selectedMonth - 1]} ${year} fee details`}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 sm:px-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
                  Fee details
                </p>
                <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                  {MONTHS[selectedMonth - 1]} {year}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                aria-label="Close details"
                className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-lg text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                ×
              </button>
            </div>

            <div className="p-2 sm:p-4">
              <SelectedMonthDetails
                month={selectedRecord}
                installments={monthDetails?.installments ?? []}
                loading={monthLoading}
                error={monthError}
                onRetry={onRetry}
                onReceipt={onReceipt}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
