
"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { MONTHS, type BatchOption } from "./examTypes";

type Props = {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  year: string;
  setYear: Dispatch<SetStateAction<string>>;
  month: string;
  setMonth: Dispatch<SetStateAction<string>>;
  batchId: string;
  setBatchId: Dispatch<SetStateAction<string>>;
  subject: string;
  setSubject: Dispatch<SetStateAction<string>>;
  years: string[];
  batches: BatchOption[];
  subjects: string[];
  inputClass: string;
  selectClass: string;
};

type Option = { value: string; label: string };

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);

  useEffect(() => {
    if (!open) return;

    const outside = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };

    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);

    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const selected = options.find((item) => item.value === value);

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={(event) => {
          if (!open) {
            const rect = event.currentTarget.getBoundingClientRect();
            setUp(
              window.innerHeight - rect.bottom < 230 &&
                rect.top > window.innerHeight - rect.bottom
            );
          }
          setOpen((current) => !current);
        }}
        className={`flex h-[46px] w-full items-center justify-between gap-2 rounded-xl border px-3.5 text-left text-sm font-medium outline-none transition focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 ${
          open
            ? "border-indigo-500 bg-indigo-50/50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
        }`}
      >
        <span className="truncate">{selected?.label ?? label}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="m5 7.5 5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute z-[100] w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900 ${
            up ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"
          }`}
        >
          <div className="max-h-52 overflow-y-auto overscroll-contain">
            {options.map((option) => {
              const active = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex min-h-10 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                    active
                      ? "bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                      : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {active && <span className="text-indigo-600">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function ExamFilters({
  query,
  setQuery,
  year,
  setYear,
  month,
  setMonth,
  batchId,
  setBatchId,
  subject,
  setSubject,
  years,
  batches,
  subjects,
  inputClass,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <label className="relative col-span-2 min-w-0 sm:col-span-3 xl:col-span-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
              <circle
                cx="8.8"
                cy="8.8"
                r="5.8"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="m13.2 13.2 4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            className={`${inputClass} h-[46px] pl-10`}
            aria-label="Search exams"
            placeholder="Search exam or subject..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              ×
            </button>
          )}
        </label>

        <FilterDropdown
          label="All years"
          value={year}
          onChange={setYear}
          options={[
            { value: "all", label: "All years" },
            ...years.map((item) => ({ value: item, label: item })),
          ]}
        />

        <FilterDropdown
          label="All months"
          value={month}
          onChange={setMonth}
          options={[
            { value: "all", label: "All months" },
            ...MONTHS.map((item, index) => ({
              value: String(index + 1),
              label: item,
            })),
          ]}
        />

        <FilterDropdown
          label="All batches"
          value={batchId}
          onChange={setBatchId}
          options={[
            { value: "all", label: "All batches" },
            ...batches.map((item) => ({
              value: item._id,
              label: item.name,
            })),
          ]}
        />

        <FilterDropdown
          label="All subjects"
          value={subject}
          onChange={setSubject}
          options={[
            { value: "all", label: "All subjects" },
            ...subjects.map((item) => ({
              value: item,
              label: item,
            })),
          ]}
        />
      </div>
    </div>
  );
}
