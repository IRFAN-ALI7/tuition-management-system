"use client";

import type { Batch, Section } from "./types";

type Props = {
  batches: Batch[];
  setSection: (section: Section) => void;
  todayLabel: string;
};

const prettyTime = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

export default function DashboardRail({
  batches,
  setSection,
  todayLabel,
}: Props) {
  const activeBatches = batches
    .filter((batch) => batch.active)
    .slice()
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-900">
        <span className="text-2xl">▦</span>
        <div>
          <strong className="block text-sm">{todayLabel}</strong>
          <small className="text-gray-500">Local date</small>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Today&apos;s Batches</h2>
          <button
            className="text-sm text-blue-600"
            onClick={() => setSection("Classes & Batches")}
          >
            View all
          </button>
        </div>

        {activeBatches.length ? (
          <div className="flex flex-col gap-4">
            {activeBatches.map((batch) => (
              <div className="flex items-center gap-3" key={batch._id}>
                <i className="h-2.5 w-2.5 rounded-full bg-green-500" />

                <div className="min-w-0 flex-1">
                  <strong className="block text-sm">{batch.name}</strong>
                  <small className="text-gray-500">
                    {prettyTime(batch.startTime)} – {prettyTime(batch.endTime)}
                  </small>
                </div>

                <span className="text-xs text-gray-500">
                  {batch.students.length} students
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-sm text-gray-500">
            No active batches are scheduled.
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent Notices</h2>
          <button
            className="text-sm text-blue-600"
            onClick={() => setSection("Notices")}
          >
            View all
          </button>
        </div>

        <div className="py-3 text-sm text-gray-500">
          Notice records are not connected yet.
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Upcoming Exams</h2>
          <button
            className="text-sm text-blue-600"
            onClick={() => setSection("Tests & Results")}
          >
            View all
          </button>
        </div>

        <div className="py-3 text-sm text-gray-500">
          Exam schedules are not connected yet.
        </div>
      </section>
    </div>
  );
}