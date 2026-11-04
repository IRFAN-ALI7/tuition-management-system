
"use client";

import {
  CalendarDays,
  CircleAlert,
  CircleCheck,
  Wallet,
} from "lucide-react";

import { formatMoney } from "@/types/student-fees";

interface Props {
  monthlyFee: number | null;
  totalPaid: number;
  totalDue: number;
  paidMonths: number;
  totalMonths: number;
}

const cards = [
  {
    key: "monthly",
    label: "Monthly Fee",
    icon: Wallet,
    style:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-300",
  },
  {
    key: "paid",
    label: "Total Paid",
    icon: CircleCheck,
    style:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400",
  },
  {
    key: "due",
    label: "Total Due",
    icon: CircleAlert,
    style:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400",
  },
  {
    key: "months",
    label: "Paid Months",
    icon: CalendarDays,
    style:
      "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300",
  },
];

export default function FeeOverview({
  monthlyFee,
  totalPaid,
  totalDue,
  paidMonths,
  totalMonths,
}: Props) {
  const values: Record<string, string> = {
    monthly: formatMoney(monthlyFee),
    paid: formatMoney(totalPaid),
    due: formatMoney(totalDue),
    months: `${paidMonths} / ${totalMonths}`,
  };

  return (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.key}
            className={`min-w-0 rounded-2xl border p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-4 ${card.style}`}
          >
            <div className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/80 dark:bg-slate-900/60">
                <Icon className="h-5 w-5" />
              </div>

              <p className="min-w-0 text-[11px] font-semibold leading-tight opacity-80 sm:text-xs">
                {card.label}
              </p>
            </div>

            <p className="mt-3 break-words text-xl font-extrabold tracking-tight sm:text-2xl">
              {values[card.key]}
            </p>

            {card.key === "months" && (
              <p className="mt-1 text-[10px] opacity-70">
                Selected year
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}
