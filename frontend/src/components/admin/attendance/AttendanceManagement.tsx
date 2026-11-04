
"use client";

import { useEffect, useRef, useState } from "react";
import type { Student, Batch } from "../shared/types";

type Props = {
  students: Student[];
  batches: Batch[];
  selectedBatch: Batch | null;
  batchId: string;
  date: string;
  present: number;
  absent: number;
  attendancePercentage: number;
  attendanceLoading: boolean;
  attendanceSaving: boolean;
  saved: boolean;
  setBatchId: (value: string) => void;
  setDate: (value: string) => void;
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  saveAttendance: () => void;
};

const prettyTime = (time: string) => {
  const [h, m] = time.split(":").map(Number);

  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${
    h >= 12 ? "PM" : "AM"
  }`;
};

function BatchDropdown({
  batches,
  batchId,
  setBatchId,
}: {
  batches: Batch[];
  batchId: string;
  setBatchId: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedBatch = batches.find((batch) => batch._id === batchId);

  useEffect(() => {
    const handleOutsideClick = (event: PointerEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const selectBatch = (value: string) => {
    setBatchId(value);
    setOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative min-w-0 w-full">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-[42px] w-full min-w-0 items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-left text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:bg-gray-900 dark:focus:ring-blue-950 ${
          open
            ? "border-blue-500 ring-2 ring-blue-100 dark:ring-blue-950"
            : "border-gray-300 dark:border-gray-700"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedBatch
              ? "text-gray-800 dark:text-gray-200"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {selectedBatch
            ? `${selectedBatch.name} · ${prettyTime(
                selectedBatch.startTime
              )}–${prettyTime(selectedBatch.endTime)}`
            : "Select a batch"}
        </span>

        <svg
          className={`size-4 shrink-0 text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
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
          role="listbox"
          aria-label="Select attendance batch"
          className="absolute left-0 top-full z-50 mt-2 max-h-56 w-full min-w-0 overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-gray-700 dark:bg-gray-900"
        >
          <button
            type="button"
            role="option"
            aria-selected={!batchId}
            onClick={() => selectBatch("")}
            className={`flex w-full min-w-0 items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-xs transition ${
              !batchId
                ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <span className="truncate">Select a batch</span>
            {!batchId && <span className="shrink-0">✓</span>}
          </button>

          {batches.map((batch) => {
            const isSelected = batchId === batch._id;

            return (
              <button
                key={batch._id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => selectBatch(batch._id)}
                className={`flex w-full min-w-0 items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left transition ${
                  isSelected
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">
                    {batch.name}
                  </span>

                  <span className="mt-0.5 block truncate text-[10px] text-gray-500 dark:text-gray-400">
                    {prettyTime(batch.startTime)} –{" "}
                    {prettyTime(batch.endTime)}
                    {!batch.active && " · Inactive"}
                  </span>
                </span>

                {isSelected && (
                  <span className="shrink-0 text-sm font-bold">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AttendanceManagement({
  students,
  batches,
  selectedBatch,
  batchId,
  date,
  present,
  absent,
  attendancePercentage,
  attendanceLoading,
  attendanceSaving,
  saved,
  setBatchId,
  setDate,
  setStudents,
  saveAttendance,
}: Props) {
  return (
    <section className="flex min-w-0 flex-col gap-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          label="Total Students"
          value={students.length.toLocaleString("en-IN")}
        />

        <SummaryCard
          label="Present"
          value={present.toLocaleString("en-IN")}
        />

        <SummaryCard
          label="Absent"
          value={absent.toLocaleString("en-IN")}
        />

        <SummaryCard
          label="Attendance"
          value={`${attendancePercentage}%`}
        />
      </div>

      {/* Attendance Management */}
      <section className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="p-4 sm:p-5">
          <div className="mb-1 text-xs font-semibold tracking-wider text-blue-600">
            DAILY RECORD
          </div>

          <h2 className="text-xl font-bold">
            Attendance Management
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Choose a date and batch, then mark each active student.
          </p>
        </div>

        {/* Date and Batch Selection */}
        <div className="grid grid-cols-1 gap-4 border-y border-gray-100 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3 dark:border-gray-800">
          <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">
            Date

            <input
              id="attendance-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="min-h-[42px] w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:focus:ring-blue-950"
            />
          </label>

          <div className="flex min-w-0 flex-col gap-2 text-sm font-medium">
            <span>Batch</span>

            <BatchDropdown
              batches={batches}
              batchId={batchId}
              setBatchId={setBatchId}
            />
          </div>

          <div className="flex min-w-0 flex-col justify-center rounded-lg bg-gray-50 p-3 dark:bg-gray-800 md:col-span-2 xl:col-span-1">
            {selectedBatch ? (
              <>
                <strong className="break-words text-sm">
                  {selectedBatch.name}
                </strong>

                <span className="text-xs text-gray-500">
                  {prettyTime(selectedBatch.startTime)} –{" "}
                  {prettyTime(selectedBatch.endTime)}
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-500">
                Select a batch to continue
              </span>
            )}
          </div>
        </div>

        {/* No Batch Selected */}
        {!selectedBatch && (
          <div className="p-8 text-center text-sm text-gray-500">
            Select a batch and date to load attendance.
          </div>
        )}

        {/* Inactive Batch Warning */}
        {selectedBatch && !selectedBatch.active && (
          <div
            className="m-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 sm:m-4 dark:bg-amber-950 dark:text-amber-200"
            role="status"
          >
            Inactive batch – saved attendance can be viewed, but new
            attendance cannot be saved.
          </div>
        )}

        {/* Students Attendance Table */}
        {selectedBatch && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 dark:bg-gray-800">
                <tr>
                  <th className="p-3 sm:p-4">Student ID</th>
                  <th className="p-3 sm:p-4">Name</th>
                  <th className="p-3 sm:p-4">Class</th>
                  <th className="p-3 sm:p-4">
                    Attendance Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {attendanceLoading ? (
                  <tr>
                    <td className="p-8 text-center" colSpan={4}>
                      Loading attendance records…
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr
                      key={student._id}
                      className="border-t border-gray-100 dark:border-gray-800"
                    >
                      <td className="whitespace-nowrap p-3 sm:p-4">
                        {student.studentId ??
                          `STU${student._id.slice(-6).toUpperCase()}`}
                      </td>

                      <td className="p-3 sm:p-4">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                            {student.name.slice(0, 1).toUpperCase()}
                          </span>

                          <strong className="min-w-0 break-words">
                            {student.name}
                          </strong>
                        </span>
                      </td>

                      <td className="p-3 sm:p-4">
                        {student.className || "—"}
                      </td>

                      <td className="p-3 sm:p-4">
                        <button
                          className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            student.status === "present"
                              ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950 dark:text-green-300"
                              : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950 dark:text-red-300"
                          }`}
                          disabled={
                            !selectedBatch.active || attendanceLoading
                          }
                          aria-label={`Mark ${student.name} ${
                            student.status === "present"
                              ? "absent"
                              : "present"
                          }`}
                          onClick={() => {
                            setStudents((current) =>
                              current.map((item) =>
                                item._id === student._id
                                  ? {
                                      ...item,
                                      status:
                                        item.status === "present"
                                          ? "absent"
                                          : "present",
                                    }
                                  : item
                              )
                            );
                          }}
                        >
                          {student.status === "present"
                            ? "✓ Present"
                            : "× Absent"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}

                {!attendanceLoading && students.length === 0 && (
                  <tr>
                    <td
                      className="p-8 text-center text-gray-500"
                      colSpan={4}
                    >
                      {saved
                        ? "No active students are currently assigned to this batch."
                        : "No active students are assigned to this batch yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer and Save Button */}
        <footer className="flex flex-col justify-between gap-3 border-t border-gray-100 p-4 sm:p-5 md:flex-row md:items-center dark:border-gray-800">
          <span className="text-sm text-gray-500">
            {saved
              ? "Saved attendance – changes can be edited and saved again."
              : "New attendance starts with all active students marked present."}
          </span>

          <button
            className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            disabled={
              !selectedBatch?.active ||
              !students.length ||
              attendanceLoading ||
              attendanceSaving
            }
            onClick={saveAttendance}
          >
            {attendanceSaving
              ? "Saving…"
              : saved
                ? "Update Attendance"
                : "Save Attendance"}{" "}
            →
          </button>
        </footer>
      </section>
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
    <article className="flex min-w-0 flex-col rounded-xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900">
      <small className="text-gray-500">{label}</small>
      <strong className="mt-2 block text-2xl font-bold">
        {value}
      </strong>
    </article>
  );
}
