
import {
  type StudentFeeMonth,
  money,
  MONTHS,
} from "@/types/student-fees";

interface Props {
  year: number;
  months: StudentFeeMonth[];
  selectedMonth: number;
  onSelectMonth: (month: number) => void;
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
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status] ?? styles["Not due"]}`}
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
}: Props) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Monthly Fee Statement
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Check the paid and remaining amount for every month of {year}.
          Select View to see the month's installments.
        </p>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3 text-right">Fee</th>
              <th className="px-4 py-3 text-right">Paid</th>
              <th className="px-4 py-3 text-right">Remaining</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {months.map((item) => (
              <tr
                key={`${item.year}-${item.month}`}
                className={`border-b border-slate-100 last:border-0 dark:border-slate-800 ${
                  selectedMonth === item.month
                    ? "bg-violet-50/70 dark:bg-violet-950/20"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">
                  {MONTHS[item.month - 1]} {item.year}
                </td>

                <td className="px-4 py-3.5 text-right text-slate-600 dark:text-slate-300">
                  {money(item.feeAmount)}
                </td>

                <td className="px-4 py-3.5 text-right font-semibold text-green-600">
                  {money(item.paidAmount)}
                </td>

                <td className="px-4 py-3.5 text-right font-semibold text-red-600">
                  {item.status === "Upcoming" || item.status === "Not due"
                    ? "—"
                    : money(item.remainingAmount)}
                </td>

                <td className="px-4 py-3.5">
                  <StatusBadge status={item.status} />
                </td>

                <td className="px-4 py-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => onSelectMonth(item.month)}
                    className={`rounded-lg px-3 py-2 text-[10px] font-bold transition ${
                      selectedMonth === item.month
                        ? "bg-violet-700 text-white"
                        : "border border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-900 dark:text-violet-300"
                    }`}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {months.map((item) => (
          <div
            key={`${item.year}-${item.month}`}
            className={`rounded-xl border p-3 ${
              selectedMonth === item.month
                ? "border-violet-300 bg-violet-50/70 dark:border-violet-800 dark:bg-violet-950/20"
                : "border-slate-200 dark:border-slate-800"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {MONTHS[item.month - 1]} {item.year}
                </p>
                <div className="mt-2">
                  <StatusBadge status={item.status} />
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectMonth(item.month)}
                className="rounded-lg bg-violet-700 px-3 py-2 text-[11px] font-bold text-white"
              >
                View details
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
              <div>
                <p className="text-[10px] text-slate-500">Fee</p>
                <p className="mt-1 text-xs font-bold text-slate-800 dark:text-white">
                  {money(item.feeAmount)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Paid</p>
                <p className="mt-1 text-xs font-bold text-green-600">
                  {money(item.paidAmount)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Remaining</p>
                <p className="mt-1 text-xs font-bold text-red-600">
                  {item.status === "Upcoming" || item.status === "Not due"
                    ? "—"
                    : money(item.remainingAmount)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
