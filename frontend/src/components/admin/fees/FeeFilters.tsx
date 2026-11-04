
"use client";

import { useState } from "react";

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

type DropdownOption = {
  value: string;
  label: string;
};

function CustomDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

  return (
    <div className="relative min-w-0 w-full">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((previous) => !previous)}
        className={`${inputClass} flex min-h-11 w-full items-center justify-between gap-2 text-left ${
          open
            ? "border-blue-500 ring-2 ring-blue-100 dark:ring-blue-950"
            : ""
        }`}
      >
        <span className="min-w-0 truncate">
          {selected?.label ?? label}
        </span>

        <svg
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            d="m5 7.5 5 5 5-5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label={`Close ${label} options`}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div
            role="listbox"
            aria-label={label}
            className="absolute left-0 right-0 top-full z-50 mt-2 max-h-56 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900"
          >
            {options.map((option) => {
              const active = option.value === value;

              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full min-w-0 items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                      : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="min-w-0 truncate">
                    {option.label}
                  </span>

                  {active && (
                    <svg
                      className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="m4 10 4 4 8-8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

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
  const yearDropdownOptions: DropdownOption[] = yearOptions.map(
    (item) => ({
      value: String(item),
      label: String(item),
    })
  );

  const batchDropdownOptions: DropdownOption[] = [
    {
      value: "all",
      label: "All Batches",
    },
    ...batches.map((batch) => ({
      value: batch._id,
      label: batch.name,
    })),
  ];

  const statusDropdownOptions: DropdownOption[] = [
    {
      value: "all",
      label: "All Status",
    },
    {
      value: "paid",
      label: "Paid",
    },
    {
      value: "due",
      label: "Due",
    },
  ];

  return (
    <div className="min-w-0 space-y-4">
      {/* YEAR AND MONTH FILTER */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="w-full sm:max-w-52">
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Year
          </label>

          <CustomDropdown
            label="Select Year"
            value={String(year)}
            options={yearDropdownOptions}
            onChange={(value) => onYearChange(Number(value))}
          />
        </div>

        {/* MONTHS */}
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
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
        <div className="grid min-w-0 grid-cols-2 gap-3 lg:flex lg:items-center">

          {/* SEARCH */}
          <label className="relative col-span-2 block min-w-0 lg:flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-slate-400">
              ⌕
            </span>

            <input
              name="feeSearch"
              className={`${inputClass} pl-10`}
              aria-label="Search student by name or ID"
              placeholder="Search by student name or ID..."
              value={query}
              onChange={(event) =>
                onQueryChange(event.target.value)
              }
            />
          </label>

          {/* BATCH */}
          <div className="min-w-0">
            <CustomDropdown
              label="All Batches"
              value={batchId}
              options={batchDropdownOptions}
              onChange={onBatchChange}
            />
          </div>

          {/* STATUS */}
          <div className="min-w-0">
            <CustomDropdown
              label="All Status"
              value={status}
              options={statusDropdownOptions}
              onChange={onStatusChange}
            />
          </div>

          {/* RESET */}
          <button
            className="col-span-2 min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 lg:col-span-1"
            onClick={onReset}
            type="button"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
