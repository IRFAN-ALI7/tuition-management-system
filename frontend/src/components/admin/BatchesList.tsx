"use client";

import type { Batch, BatchSummary } from "./types";

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

const prettyTime = (time: string) => {
  const [h, m] = time.split(":").map(Number);

  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${
    h >= 12 ? "PM" : "AM"
  }`;
};

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
    <section className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Classes &amp; Batches</h1>
          <p className="text-sm text-gray-500">
            Manage batch schedules and assigned students
          </p>
        </div>

        <button
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
          onClick={onCreate}
        >
          <span>＋</span> Create Batch
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Total Batches"
          value={summary.totalBatches.toLocaleString("en-IN")}
        />

        <SummaryCard
          label="Active Batches"
          value={summary.activeBatches.toLocaleString("en-IN")}
        />

        <SummaryCard
          label="Total Students"
          value={summary.totalStudents.toLocaleString("en-IN")}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {error && (
          <div
            className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 dark:bg-gray-800">
              <tr>
                <th className="p-4">Batch Name</th>
                <th className="p-4">Time</th>
                <th className="p-4">Total Students</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="p-8 text-center" colSpan={5}>
                    Loading batches…
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr
                    key={batch._id}
                    className="border-t border-gray-100 dark:border-gray-800"
                  >
                    <td className="p-4 font-semibold">{batch.name}</td>

                    <td className="p-4">
                      {prettyTime(batch.startTime)} –{" "}
                      {prettyTime(batch.endTime)}
                    </td>

                    <td className="p-4">{batch.students.length}</td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          batch.active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {batch.active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          className="rounded border border-gray-200 px-3 py-1.5 dark:border-gray-700"
                          onClick={() => onEdit(batch)}
                        >
                          Edit
                        </button>

                        <button
                          className="rounded border border-gray-200 px-3 py-1.5 dark:border-gray-700"
                          onClick={() => onToggle(batch)}
                        >
                          {batch.active ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          className="rounded border border-red-200 px-3 py-1.5 text-red-600 dark:border-red-900"
                          onClick={() => onDelete(batch)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {!loading && batches.length === 0 && (
                <tr>
                  <td
                    className="p-8 text-center text-gray-500"
                    colSpan={5}
                  >
                    No batches yet. Create your first batch to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <small className="text-gray-500">{label}</small>
      <strong className="mt-2 block text-2xl">{value}</strong>
    </article>
  );
}