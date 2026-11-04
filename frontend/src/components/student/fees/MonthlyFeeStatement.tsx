
"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import {
  FEE_MONTHS,
  formatMoney,
  type StudentFeeMonth,
} from "@/types/student-fees";

interface Props {
  months: StudentFeeMonth[];
  year: number;
  currentYear: number;
  currentMonth: number;
  selectedMonth: number;
  availableYears: number[];
  onYearChange: (year: number) => void;
  onMonthSelect: (month: number) => void;
}

function Status({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const style =
    normalized === "paid"
      ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
      : normalized === "due"
        ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${style}`}>
      {status}
    </span>
  );
}

export default function MonthlyFeeStatement({
  months,
  year,
  currentYear,
  currentMonth,
  selectedMonth,
  availableYears,
  onYearChange,
  onMonthSelect,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  const relevantMonths = useMemo(() => {
    const cutoff = year === currentYear ? currentMonth : 12;

    return months
      .filter((item) => item.month <= cutoff)
      .sort((a, b) => a.month - b.month);
  }, [months, year, currentYear, currentMonth]);

  const visibleMonths = showAll
    ? relevantMonths
    : relevantMonths.slice(-3);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
            <CalendarDays className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white sm:text-base">
              Monthly Fee Statement
            </h2>
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">
              View your month-wise fee records
            </p>
          </div>
        </div>

        <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800 sm:justify-start">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Year
          </span>

          <select
            name="fee-statement-year"
            value={year}
            onChange={(event) => onYearChange(Number(event.target.value))}
            className="bg-transparent text-sm font-bold text-slate-900 outline-none dark:text-white"
          >
            {availableYears.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visibleMonths.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          No fee records available for this year.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <th className="px-5 py-3">Month</th>
                  <th className="px-3 py-3 text-right">Fee Amount</th>
                  <th className="px-3 py-3 text-right">Paid</th>
                  <th className="px-3 py-3 text-right">Remaining</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Details</th>
                </tr>
              </thead>

              <tbody>
                {visibleMonths.map((item) => (
                  <tr
                    key={`${item.year}-${item.month}`}
                    className={`cursor-pointer border-b border-slate-100 transition last:border-0 dark:border-slate-800 ${
                      selectedMonth === item.month
                        ? "bg-violet-50/70 dark:bg-violet-950/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                    onClick={() => onMonthSelect(item.month)}
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {FEE_MONTHS[item.month - 1]}
                      </span>
                      {selectedMonth === item.month && (
                        <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-bold text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                          Selected
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-3.5 text-right font-medium text-slate-700 dark:text-slate-300">
                      {formatMoney(item.feeAmount)}
                    </td>

                    <td className="px-3 py-3.5 text-right font-semibold text-green-700 dark:text-green-400">
                      {formatMoney(item.paidAmount)}
                    </td>

                    <td className="px-3 py-3.5 text-right font-semibold text-red-600 dark:text-red-400">
                      {formatMoney(item.remainingAmount)}
                    </td>

                    <td className="px-3 py-3.5 text-center">
                      <Status status={item.status} />
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onMonthSelect(item.month);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100 dark:text-violet-300 dark:hover:bg-violet-950/50"
                      >
                        View
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-2.5 p-3 md:hidden sm:grid-cols-2 sm:p-4">
            {visibleMonths.map((item) => (
              <button
                key={`${item.year}-${item.month}`}
                type="button"
                onClick={() => onMonthSelect(item.month)}
                className={`min-w-0 rounded-xl border p-3 text-left transition ${
                  selectedMonth === item.month
                    ? "border-violet-300 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30"
                    : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {FEE_MONTHS[item.month - 1]}
                  </span>
                  <Status status={item.status} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-slate-500">Fee</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      {formatMoney(item.feeAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Paid</p>
                    <p className="mt-0.5 text-xs font-bold text-green-700 dark:text-green-400">
                      {formatMoney(item.paidAmount)}
                    </p>
                  </div>
                  <div className="col-span-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500">Remaining</p>
                    <p className="mt-0.5 text-sm font-extrabold text-red-600 dark:text-red-400">
                      {formatMoney(item.remainingAmount)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="flex justify-center border-t border-slate-100 p-4 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-5 py-2.5 text-xs font-bold text-violet-700 transition hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300"
        >
          {showAll ? "Show Less" : "View All Months"}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              showAll ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
    </section>
  );
}
