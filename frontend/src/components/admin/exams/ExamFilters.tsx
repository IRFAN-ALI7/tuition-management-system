
import type { Dispatch, SetStateAction } from "react";
import { MONTHS, type BatchOption } from "./examTypes";

type ExamFiltersProps = {
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
  selectClass,
}: ExamFiltersProps) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 xl:grid-cols-5">
      <label className="relative sm:col-span-2 xl:col-span-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">
          ⌕
        </span>

        <input
          className={`${inputClass} pl-9`}
          aria-label="Search exams"
          placeholder="Search exam or subject..."
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
        />
      </label>

      <select
        className={selectClass}
        aria-label="Filter year"
        value={year}
        onChange={(event) => {
          setYear(event.target.value);
        }}
      >
        <option value="all">All years</option>

        {years.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>

      <select
        className={selectClass}
        aria-label="Filter month"
        value={month}
        onChange={(event) => {
          setMonth(event.target.value);
        }}
      >
        <option value="all">All months</option>

        {MONTHS.map((item, index) => (
          <option key={item} value={String(index + 1)}>
            {item}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        aria-label="Filter batch"
        value={batchId}
        onChange={(event) => {
          setBatchId(event.target.value);
        }}
      >
        <option value="all">All batches</option>

        {batches.map((batch) => (
          <option key={batch._id} value={batch._id}>
            {batch.name}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        aria-label="Filter subject"
        value={subject}
        onChange={(event) => {
          setSubject(event.target.value);
        }}
      >
        <option value="all">All subjects</option>

        {subjects.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </div>
  );
}
