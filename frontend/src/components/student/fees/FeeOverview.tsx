import {
  type StudentFeeMonth,
  type StudentFeeTotals,
  money,
  MONTHS,
} from "@/types/student-fees";

interface Props {
  months: StudentFeeMonth[];
  totals: StudentFeeTotals;
  monthlyFee: number | null;
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
    <div
      className={`min-w-0 rounded-xl border p-3 sm:rounded-2xl sm:p-5 ${styles[tone]}`}
    >
      <p className="truncate text-[10px] font-semibold opacity-80 sm:text-xs">
        {title}
      </p>

      <p className="mt-1.5 break-words text-base font-extrabold tracking-tight sm:mt-3 sm:text-2xl">
        {amount}
      </p>

      <p className="mt-1 hidden text-[11px] opacity-70 sm:block">
        {subtitle}
      </p>
    </div>
  );
}

export default function FeeOverview({
  months,
  totals,
  monthlyFee,
}: Props) {
  const totalFee = totals.feeAmount;

  const paidPercent =
    totalFee > 0
      ? Math.min(100, (totals.paidAmount / totalFee) * 100)
      : 0;

  const paidMonths = months.filter(
    (item) => item.status === "Paid",
  ).length;

  const dueMonths = months.filter(
    (item) => item.status === "Due",
  ).length;

  const maximum = Math.max(
    1,
    ...months.map((item) => item.feeAmount),
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <SummaryCard
          title="Monthly Fee"
          amount={money(monthlyFee)}
          subtitle="Your monthly tuition fee"
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

      {/* Payment overview chart */}
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

        <div className="mt-5 flex h-36 items-end gap-1 border-b border-slate-200 pb-2 dark:border-slate-700 sm:mt-6 sm:h-44 sm:gap-3">
          {months.map((item) => {
            const paidHeight =
              (item.paidAmount / maximum) * 100;

            const dueHeight =
              (item.remainingAmount / maximum) * 100;

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

                <span className="mt-1.5 text-[8px] text-slate-500 sm:mt-2 sm:text-[10px]">
                  {MONTHS[item.month - 1].slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-slate-600 dark:text-slate-400">
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