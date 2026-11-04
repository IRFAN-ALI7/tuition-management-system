
"use client";

import type { Batch, BatchSummary } from "../shared/types";

type BatchesListProps = {
  batches: Batch[];
  summary: BatchSummary;
  loading: boolean;
  error: string;
  onCreate: () => void;
  onEdit: (batch: Batch) => void;
  onToggle: (batch: Batch) => void;
  onDelete: (batch: Batch) => void;
};

const prettyTime = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);

  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${
    hours >= 12 ? "PM" : "AM"
  }`;
};

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <article className="flex min-w-0 flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-gray-500 sm:text-sm dark:text-gray-400">
          {label}
        </p>
        <span className="size-2 rounded-full bg-blue-500" />
      </div>

      <strong className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
        {value.toLocaleString("en-IN")}
      </strong>

      <p className="mt-1 text-[11px] text-gray-400 sm:text-xs dark:text-gray-500">
        {description}
      </p>
    </article>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
          : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function BatchActions({
  batch,
  onEdit,
  onToggle,
  onDelete,
}: {
  batch: Batch;
  onEdit: (batch: Batch) => void;
  onToggle: (batch: Batch) => void;
  onDelete: (batch: Batch) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <button
        type="button"
        onClick={() => onEdit(batch)}
        className="rounded-lg border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
      >
        Edit
      </button>

      <button
        type="button"
        onClick={() => onToggle(batch)}
        className="rounded-lg border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-amber-950/30 dark:hover:text-amber-400"
      >
        {batch.active ? "Deactivate" : "Activate"}
      </button>

      <button
        type="button"
        onClick={() => onDelete(batch)}
        className="rounded-lg border border-red-200 px-2 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/70 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        Delete
      </button>
    </div>
  );
}

function BatchCard({
  batch,
  onEdit,
  onToggle,
  onDelete,
}: {
  batch: Batch;
  onEdit: (batch: Batch) => void;
  onToggle: (batch: Batch) => void;
  onDelete: (batch: Batch) => void;
}) {
  return (
    <article className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Batch
          </p>
          <h3 className="mt-1 truncate text-base font-bold text-gray-900 dark:text-white">
            {batch.name}
          </h3>
        </div>

        <StatusBadge active={batch.active} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/70">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Schedule
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-gray-800 dark:text-gray-200">
            {prettyTime(batch.startTime)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            to {prettyTime(batch.endTime)}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/70">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Students
          </p>
          <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
            {batch.students.length}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            Assigned students
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800">
        <BatchActions
          batch={batch}
          onEdit={onEdit}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      </div>
    </article>
  );
}

export default function BatchesList({
  batches,
  summary,
  loading,
  error,
  onCreate,
  onEdit,
  onToggle,
  onDelete,
}: BatchesListProps) {
  return (
    <section className="flex min-w-0 flex-col gap-5 sm:gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[1.4px] text-blue-600 dark:text-blue-400">
            Class Management
          </div>

          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl dark:text-white">
            Classes &amp; Batches
          </h1>

          <p className="mt-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400">
            Manage batch schedules and assigned students.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] sm:w-auto"
        >
          <span className="text-lg leading-none">+</span>
          Create Batch
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <SummaryCard
          label="Total Batches"
          value={summary.totalBatches}
          description="All created batches"
        />

        <SummaryCard
          label="Active Batches"
          value={summary.activeBatches}
          description="Currently running"
        />

        <div className="col-span-2 sm:col-span-1">
          <SummaryCard
            label="Total Students"
            value={summary.totalStudents}
            description="Students in all batches"
          />
        </div>
      </div>

      {/* Batch List */}
      <div className="min-w-0">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              All Batches
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {batches.length} {batches.length === 1 ? "batch" : "batches"} found
            </p>
          </div>
        </div>

        {error && (
          <div
            className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            role="alert"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="size-7 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Loading batches...
            </p>
          </div>
        ) : batches.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-8 text-center dark:border-gray-700 dark:bg-gray-900">
            <div className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-2xl text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              +
            </div>

            <h3 className="mt-4 text-sm font-bold text-gray-900 dark:text-white">
              No batches created yet
            </h3>

            <p className="mt-1 max-w-xs text-xs leading-5 text-gray-500 dark:text-gray-400">
              Create your first batch to organize students and class timings.
            </p>

            <button
              type="button"
              onClick={onCreate}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Create your first batch
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="grid grid-cols-1 gap-3 sm:hidden">
              {batches.map((batch) => (
                <BatchCard
                  key={batch._id}
                  batch={batch}
                  onEdit={onEdit}
                  onToggle={onToggle}
                  onDelete={onDelete}
                />
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:block dark:border-gray-800 dark:bg-gray-900">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800/80 dark:text-gray-400">
                    <tr>
                      <th className="px-5 py-4">Batch Name</th>
                      <th className="px-5 py-4">Schedule</th>
                      <th className="px-5 py-4">Students</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {batches.map((batch) => (
                      <tr
                        key={batch._id}
                        className="border-t border-gray-100 transition hover:bg-gray-50/70 dark:border-gray-800 dark:hover:bg-gray-800/40"
                      >
                        <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">
                          {batch.name}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-gray-600 dark:text-gray-300">
                          {prettyTime(batch.startTime)} –{" "}
                          {prettyTime(batch.endTime)}
                        </td>

                        <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                          {batch.students.length}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge active={batch.active} />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onEdit(batch)}
                              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => onToggle(batch)}
                              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-amber-50 hover:text-amber-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-amber-950/30 dark:hover:text-amber-400"
                            >
                              {batch.active ? "Deactivate" : "Activate"}
                            </button>

                            <button
                              type="button"
                              onClick={() => onDelete(batch)}
                              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
