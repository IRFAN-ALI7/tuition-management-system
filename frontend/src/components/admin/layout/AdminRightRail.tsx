
"use client";

import type { Batch, Section } from "../shared/types";

type Props = {
  batches: Batch[];
  section: Section;
  authenticated: boolean;
  todayLabel: string;
  setSection: (section: Section) => void;
  onStudentPortal: () => void;
};

const prettyTime = (time: string) => {
  const [h, m] = time.split(":").map(Number);

  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${
    h >= 12 ? "PM" : "AM"
  }`;
};

export default function AdminRightRail({
  batches,
  section,
  authenticated,
  todayLabel,
  setSection,
  onStudentPortal,
}: Props) {
  const activeBatches = batches
    .filter((item) => item.active)
    .slice()
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (section === "Dashboard" && authenticated) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-5">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <span className="text-2xl">▦</span>
          <div className="min-w-0">
            <strong className="block break-words text-sm">
              {todayLabel}
            </strong>
            <small className="text-gray-500">Local date</small>
          </div>
        </div>

        <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="font-semibold">Today&apos;s Batches</h2>

            <button
              type="button"
              className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700"
              onClick={() => setSection("Classes & Batches")}
            >
              View all
            </button>
          </div>

          {activeBatches.length ? (
            <div className="flex flex-col gap-4">
              {activeBatches.map((batch) => (
                <div
                  className="flex min-w-0 items-center gap-3"
                  key={batch._id}
                >
                  <i className="h-2 w-2 shrink-0 rounded-full bg-green-500" />

                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-sm">
                      {batch.name}
                    </strong>

                    <small className="block text-xs text-gray-500">
                      {prettyTime(batch.startTime)} –{" "}
                      {prettyTime(batch.endTime)}
                    </small>
                  </div>

                  <span className="shrink-0 text-right text-xs text-gray-500">
                    {batch.students.length} students
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-3 text-sm text-gray-500">
              No active batches are scheduled.
            </p>
          )}
        </section>

        <RailPlaceholder
          title="Recent Notices"
          button="View all"
          onClick={() => setSection("Notices")}
          message="Notice records are not connected yet."
        />

        <RailPlaceholder
          title="Upcoming Exams"
          button="View all"
          onClick={() => setSection("Tests & Results")}
          message="Exam schedules are not connected yet."
        />
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 sm:gap-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest text-gray-500">
          YOUR BATCHES
        </span>

        <span className="text-xl">▦</span>
      </div>

      <section className="min-w-0">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <span className="text-xs font-semibold text-blue-600">
              SCHEDULE
            </span>
            <h3 className="font-semibold">Class times</h3>
          </div>

          <button
            type="button"
            className="rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setSection("Classes & Batches")}
            aria-label="Manage batches"
          >
            ···
          </button>
        </div>

        <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          {activeBatches.length ? (
            <div className="flex flex-col gap-4">
              {activeBatches.map((batch, index) => (
                <div
                  className="flex min-w-0 items-center gap-3"
                  key={batch._id}
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      index % 3 === 0
                        ? "bg-violet-500"
                        : index % 3 === 1
                          ? "bg-green-500"
                          : "bg-orange-500"
                    }`}
                  />

                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm">
                      {batch.name}
                    </strong>

                    <small className="block text-xs text-gray-500">
                      {batch.students.length} students ·{" "}
                      {Math.floor(batch.durationMinutes / 60) || ""}
                      {batch.durationMinutes % 60
                        ? `${batch.durationMinutes % 60} min`
                        : " hr"}
                    </small>
                  </span>

                  <b className="shrink-0 text-xs">
                    {prettyTime(batch.startTime)}
                  </b>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-3 text-sm text-gray-500">
              Sign in to load batch schedules.
            </div>
          )}

          <button
            type="button"
            className="mt-4 w-full border-t border-gray-100 pt-3 text-left text-sm font-medium text-blue-600 dark:border-gray-800"
            onClick={() => setSection("Classes & Batches")}
          >
            Manage schedule →
          </button>
        </div>
      </section>

      <div className="relative overflow-hidden rounded-xl bg-blue-50 p-4 sm:p-5 dark:bg-blue-950">
        <span className="text-2xl">✳</span>

        <p className="my-3 text-sm italic leading-relaxed">
          “Education is the most powerful weapon which you can use to change
          the world.”
        </p>

        <small className="text-gray-500">— Nelson Mandela</small>

        <span className="absolute -bottom-5 -right-2 text-6xl opacity-10">
          ✳
        </span>
      </div>

      <button
        type="button"
        className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
        onClick={onStudentPortal}
      >
        <span className="text-2xl">♟</span>

        <span className="min-w-0 flex-1">
          <strong className="block text-sm">Student portal</strong>
          <small className="block text-xs text-gray-500">
            View student sign in
          </small>
        </span>

        <b className="shrink-0">↗</b>
      </button>
    </div>
  );
}

function RailPlaceholder({
  title,
  button,
  message,
  onClick,
}: {
  title: string;
  button: string;
  message: string;
  onClick: () => void;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-semibold">{title}</h2>

        <button
          type="button"
          className="shrink-0 text-sm font-medium text-blue-600"
          onClick={onClick}
        >
          {button}
        </button>
      </div>

      <p className="py-3 text-sm text-gray-500">{message}</p>
    </section>
  );
}
