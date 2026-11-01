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
      color: "border-blue-200 bg-blue-50 text-blue-700",
    },
    {
      label: "Fees Collected",
      value: money(summary.feesCollected),
      icon: "✓",
      color: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    {
      label: "Total Remaining / Due",
      value: money(summary.totalDue),
      icon: "↘",
      color: "border-amber-200 bg-amber-50 text-amber-700",
    },
    {
      label: "Students Paid",
      value: summary.studentsPaid.toLocaleString("en-IN"),
      icon: "●",
      color: "border-indigo-200 bg-indigo-50 text-indigo-700",
    },
    {
      label: "Students Due",
      value: summary.studentsDue.toLocaleString("en-IN"),
      icon: "!",
      color: "border-rose-200 bg-rose-50 text-rose-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((item) => (
        <article
          key={item.label}
          className={`flex min-w-0 items-start gap-3 rounded-xl border p-4 ${item.color}`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/80 text-lg font-bold">
            {item.icon}
          </span>

          <div className="min-w-0">
            <small className="block text-xs font-medium opacity-80">
              {item.label}
            </small>
            <strong className="mt-1 block break-words text-lg font-bold">
              {item.value}
            </strong>
          </div>
        </article>
      ))}
    </div>
  );
}