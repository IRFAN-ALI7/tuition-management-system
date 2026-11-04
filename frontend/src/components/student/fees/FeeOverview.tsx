
import {
  type StudentFeeMonth,
  type StudentFeeTotals,
  money,
  MONTHS,
} from "@/types/student-fees";

interface Props {
  months: StudentFeeMonth[];
  totals: StudentFeeTotals;
}

function SummaryCard({
  title,
  amount,
  subtitle,
  tone,
}: {
  title: string;
  amount: string;
  subtitle: string;
  tone: "violet" | "green" | "red";
}) {
  const styles = {
    violet:
      "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-300",
    green:
      "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300",
    red:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300",
  };

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${styles[tone]}`}>
      <p className="text-xs font-semibold opacity-80">{title}</p>
      <p className="mt-3 text-xl font-extrabold tracking-tight sm:text-2xl">
        {amount}
      </p>
      <p className="mt-1 text-[11px] opacity-70">{subtitle}</p>
    </div>
  );
}

export default function FeeOverview({ months, totals }: Props) {
  const totalFee = totals.feeAmount;
  const paidPercent =
    totalFee > 0 ? Math.min(100, (totals.paidAmount / totalFee) * 100) : 0;

  const paidMonths = months.filter((item) => item.status === "Paid").length;
  const dueMonths = months.filter((item) => item.status === "Due").length;

  const maximum = Math.max(1, ...months.map((item) => item.feeAmount));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          title="Total Fee"
          amount={money(totals.feeAmount)}
          subtitle="Total recorded fee amount"
          tone="violet"
        />

        <SummaryCard
          title="Total Paid"
          amount={money(totals.paidAmount)}
          subtitle={`${paidMonths} months fully paid`}
          tone="green"
        />

        <SummaryCard
          title="Remaining Due"
          amount={money(totals.dueAmount)}
          subtitle={`${dueMonths} months have outstanding fees`}
          tone="red"
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Fee Payment Overview
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Month-wise paid amount and remaining balance
            </p>
          </div>

          <div className="rounded-xl bg-violet-50 px-3 py-2 text-right dark:bg-violet-950/30">
            <p className="text-[10px] text-violet-600 dark:text-violet-300">
              Overall paid
            </p>
            <p className="text-lg font-extrabold text-violet-700 dark:text-violet-200">
              {Math.round(paidPercent)}%
            </p>
          </div>
        </div>

        <div className="mt-6 flex h-44 items-end gap-1.5 border-b border-slate-200 pb-2 dark:border-slate-700 sm:gap-3">
          {months.map((item) => {
            const paidHeight = (item.paidAmount / maximum) * 100;
            const dueHeight = (item.remainingAmount / maximum) * 100;

            return (
              <div
                key={`${item.year}-${item.month}`}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                title={`${MONTHS[item.month - 1]}: Paid ${money(item.paidAmount)}, Due ${money(item.remainingAmount)}`}
              >
                <div className="flex h-full w-full max-w-8 flex-col justify-end overflow-hidden rounded-t-md bg-slate-100 dark:bg-slate-800">
                  {item.feeAmount > 0 ? (
                    <>
                      <div
                        className="w-full bg-red-400"
                        style={{ height: `${dueHeight}%` }}
                      />
                      <div
                        className="w-full bg-green-500"
                        style={{ height: `${paidHeight}%` }}
                      />
                    </>
                  ) : (
                    <div className="h-1 w-full bg-slate-300 dark:bg-slate-600" />
                  )}
                </div>

                <span className="mt-2 text-[9px] text-slate-500 sm:text-[10px]">
                  {MONTHS[item.month - 1].slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-green-500" />
            Paid
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-400" />
            Remaining
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" />
            No fee record
          </span>
        </div>
      </section>
    </div>
  );
}
