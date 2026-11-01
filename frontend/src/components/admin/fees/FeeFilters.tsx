"use client";

import {
  inputClass,
  MONTHS,
  type BatchOption,
} from "./feeTypes";

type Props = {
  year: number;
  month: number;
  yearOptions: number[];
  batches: BatchOption[];
  query: string;
  batchId: string;
  status: string;
  onYearChange: (value: number) => void;
  onMonthChange: (value: number) => void;
  onQueryChange: (value: string) => void;
  onBatchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onReset: () => void;
};

export default function FeeFilters({
  year,
  month,
  yearOptions,
  batches,
  query,
  batchId,
  status,
  onYearChange,
  onMonthChange,
  onQueryChange,
  onBatchChange,
  onStatusChange,
  onReset,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <label className="flex w-full flex-col gap-1.5 text-sm font-medium text-slate-700 sm:max-w-40">
          Year
          <select
            className={inputClass}
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
          >
            {yearOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <div
          className="mt-4 flex gap-2 overflow-x-auto pb-2"
          role="tablist"
          aria-label="Fee month"
        >
          {MONTHS.map((name, index) => (
            <button
              type="button"
              role="tab"
              aria-selected={month === index + 1}
              key={name}
              onClick={() => onMonthChange(index + 1)}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition ${
                month === index + 1
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-slate-400">
            ⌕
          </span>
          <input
            className={`${inputClass} pl-10`}
            aria-label="Search student by name or ID"
            placeholder="Search by student name or ID..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </label>

        <select
          className={`${inputClass} lg:w-48`}
          aria-label="Filter by batch"
          value={batchId}
          onChange={(e) => onBatchChange(e.target.value)}
        >
          <option value="all">All Batches</option>
          {batches.map((batch) => (
            <option key={batch._id} value={batch._id}>
              {batch.name}
            </option>
          ))}
        </select>

        <select
          className={`${inputClass} lg:w-40`}
          aria-label="Filter by fee status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="due">Due</option>
        </select>

        <button
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={onReset}
          type="button"
        >
          Reset
        </button>
      </div>
    </div>
  );
}