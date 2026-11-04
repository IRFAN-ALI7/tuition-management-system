
"use client";

import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Wallet,
} from "lucide-react";

import {
  FEE_MONTHS,
  formatMoney,
  type StudentFeeMonth,
} from "@/types/student-fees";

interface Props {
  month: StudentFeeMonth | undefined;
  year: number;
}

export default function SelectedMonthDetails({
  month,
  year,
}: Props) {
  if (!month) return null;

  const status = month.status.toLowerCase();

  const statusStyle =
    status === "paid"
      ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
      : status === "due"
        ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";

  const details = [
    {
      label: "Monthly Fee",
      value: formatMoney(month.feeAmount),
      icon: Wallet,
      valueStyle: "text-slate-900 dark:text-white",
    },
    {
      label: "Paid Amount",
      value: formatMoney(month.paidAmount),
      icon: CheckCircle2,
      valueStyle: "text-green-700 dark:text-green-400",
    },
    {
      label: "Remaining Amount",
      value: formatMoney(month.remainingAmount),
      icon: CircleAlert,
      valueStyle: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            <CalendarDays className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white sm:text-base">
              Selected Month Details
            </h2>
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              Complete fee breakdown
            </p>
          </div>
        </div>

        <span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
          {FEE_MONTHS[month.month - 1]} {year}
        </span>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
        {details.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/60 sm:block"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {item.label}
                </p>
              </div>

              <p className={`text-base font-extrabold sm:mt-3 sm:text-xl ${item.valueStyle}`}>
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Payment Status
        </span>

        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusStyle}`}>
          {month.status}
        </span>
      </div>
    </section>
  );
}
