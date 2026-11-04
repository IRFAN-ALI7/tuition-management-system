
"use client";

import { money, type FeeSummaryData } from "./feeTypes";

export default function FeeSummary({
  summary,
}: {
  summary: FeeSummaryData;
}) {
  const cards = [
    {
      label: "Total Fees Expected",
      value: money(summary.totalExpected),
      icon: "₹",
      color:
        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
    },
    {
      label: "Fees Collected",
      value: money(summary.feesCollected),
      icon: "✓",
      color:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    {
      label: "Total Remaining / Due",
      value: money(summary.totalDue),
      icon: "↘",
      color:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    },
    {
      label: "Students Paid",
      value: summary.studentsPaid.toLocaleString("en-IN"),
      icon: "●",
      color:
        "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300",
    },
    {
      label: "Students Due",
      value: summary.studentsDue.toLocaleString("en-IN"),
      icon: "!",
      color:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
      {cards.map((item, index) => (
        <article
          key={item.label}
          className={`flex min-w-0 items-center gap-2 rounded-xl border p-3 sm:items-start sm:gap-3 sm:p-4 ${
            item.color
          } ${index === 4 ? "col-span-2 xl:col-span-1" : ""}`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 text-sm font-bold sm:h-10 sm:w-10 sm:text-lg dark:bg-slate-900/60">
            {item.icon}
          </span>

          <div className="min-w-0">
            <small className="block text-[10px] font-medium leading-tight opacity-80 sm:text-xs">
              {item.label}
            </small>

            <strong className="mt-1 block break-words text-sm font-bold sm:text-lg">
              {item.value}
            </strong>
          </div>
        </article>
      ))}
    </div>
  );
}
