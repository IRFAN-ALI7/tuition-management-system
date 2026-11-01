
"use client";

import type { FormEvent } from "react";
import type { Batch, Student, BatchDraft } from "../shared/types";
import TimePicker from "./TimePicker";

type Props = {
  editingBatch: Batch | null;
  batchForm: BatchDraft;
  setBatchForm: (draft: BatchDraft) => void;
  batchSearch: string;
  setBatchSearch: (value: string) => void;
  batchStudentOptions: Student[];
  batches: Batch[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function BatchEditorModal({
  editingBatch,
  batchForm,
  setBatchForm,
  batchSearch,
  setBatchSearch,
  batchStudentOptions,
  batches,
  onClose,
  onSubmit,
}: Props) {
  const filteredStudents = batchStudentOptions.filter(
    (student) =>
      (student.active || batchForm.studentIds.includes(student._id)) &&
      `${student.name} ${student.phone} ${student.fatherName}`
        .toLowerCase()
        .includes(batchSearch.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 sm:items-center sm:p-5"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="batch-modal-title"
        className="relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl dark:bg-gray-900 sm:max-h-[90vh] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-2xl text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800 sm:right-4 sm:top-4"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="mb-2 pr-10 text-xs font-semibold tracking-wider text-blue-600">
          CLASSES &amp; BATCHES
        </div>

        <h2
          id="batch-modal-title"
          className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl"
        >
          {editingBatch ? "Edit batch" : "Create a batch"}
        </h2>

        <p className="mb-5 mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose a unique name, schedule and student assignments.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
            Batch name

            <input
              required
              maxLength={60}
              value={batchForm.name}
              onChange={(event) =>
                setBatchForm({
                  ...batchForm,
                  name: event.target.value,
                })
              }
              placeholder="For example, Batch-C"
              className="w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TimePicker
              label="START TIME"
              value={batchForm.startTime}
              onChange={(startTime) =>
                setBatchForm({ ...batchForm, startTime })
              }
            />

            <TimePicker
              label="END TIME"
              value={batchForm.endTime}
              onChange={(endTime) =>
                setBatchForm({ ...batchForm, endTime })
              }
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <strong className="text-sm text-gray-900 dark:text-white">
                Assign students
              </strong>

              <small className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                Each student can be in one active batch.
              </small>
            </div>

            <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {batchForm.studentIds.length} selected
            </span>
          </div>

          <input
            type="search"
            className="w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            value={batchSearch}
            onChange={(event) => setBatchSearch(event.target.value)}
            placeholder="Search name, phone or father's name"
          />

          <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
            {filteredStudents.map((student) => {
              const otherBatch = batches.find(
                (batch) =>
                  batch.active &&
                  batch._id !== editingBatch?._id &&
                  batch.students.some((item) => item._id === student._id)
              );

              const checked = batchForm.studentIds.includes(student._id);

              return (
                <label
                  className={`flex min-w-0 items-start gap-3 border-b border-gray-100 p-3 last:border-0 dark:border-gray-800 ${
                    otherBatch ? "opacity-60" : ""
                  }`}
                  key={student._id}
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 accent-blue-600"
                    checked={checked}
                    disabled={
                      Boolean(otherBatch) ||
                      (!student.active && checked) ||
                      (Boolean(editingBatch && !editingBatch.active) &&
                        !checked)
                    }
                    onChange={(event) =>
                      setBatchForm({
                        ...batchForm,
                        studentIds: event.target.checked
                          ? [...batchForm.studentIds, student._id]
                          : batchForm.studentIds.filter(
                              (id) => id !== student._id
                            ),
                      })
                    }
                  />

                  <span className="min-w-0 flex-1">
                    <strong className="block break-words text-sm text-gray-900 dark:text-white">
                      {student.name}
                    </strong>

                    <small className="mt-1 block break-words text-xs leading-5 text-gray-500 dark:text-gray-400">
                      {student.phone} · Father: {student.fatherName}
                      {!student.active ? " · Inactive student" : ""}
                    </small>
                  </span>

                  {otherBatch && (
                    <em className="max-w-24 shrink-0 break-words text-right text-xs not-italic text-red-600 dark:text-red-400">
                      {otherBatch.name}
                    </em>
                  )}
                </label>
              );
            })}

            {filteredStudents.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {batchStudentOptions.length === 0
                  ? "Add students in Student Management first."
                  : "No students found matching your search."}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 dark:border-gray-800 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="w-full rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 sm:w-auto"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] sm:w-auto"
            >
              {editingBatch ? "Save changes" : "Create batch"} →
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
