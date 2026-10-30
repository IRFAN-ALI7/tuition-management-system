"use client";

import type { FormEvent } from "react";
import type { Batch, Student, BatchDraft } from "./types";
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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
      onClick={onClose}
    >
      <section
        className="relative my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 text-2xl text-gray-500"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="mb-2 text-xs font-semibold tracking-wider text-blue-600">
          CLASSES &amp; BATCHES
        </div>

        <h2 className="text-xl font-bold">
          {editingBatch ? "Edit batch" : "Create a batch"}
        </h2>

        <p className="mb-5 mt-1 text-sm text-gray-500">
          Choose a unique name, schedule and student assignments.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-sm font-medium">
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
              className="rounded-lg border border-gray-300 bg-transparent px-3 py-2 outline-none focus:border-blue-500 dark:border-gray-700"
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

          <div className="flex items-center justify-between gap-3">
            <div>
              <strong className="text-sm">Assign students</strong>
              <small className="block text-xs text-gray-500">
                Each student can be in one active batch.
              </small>
            </div>

            <span className="text-sm font-semibold text-blue-600">
              {batchForm.studentIds.length} selected
            </span>
          </div>

          <input
            className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none dark:border-gray-700"
            value={batchSearch}
            onChange={(event) => setBatchSearch(event.target.value)}
            placeholder="Search name, phone or father's name"
          />

          <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
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
                  className={`flex items-center gap-3 border-b border-gray-100 p-3 last:border-0 dark:border-gray-800 ${
                    otherBatch ? "opacity-60" : ""
                  }`}
                  key={student._id}
                >
                  <input
                    type="checkbox"
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
                    <strong className="block text-sm">{student.name}</strong>
                    <small className="block text-xs text-gray-500">
                      {student.phone} · Father: {student.fatherName}
                      {!student.active ? " · Inactive student" : ""}
                    </small>
                  </span>

                  {otherBatch && (
                    <em className="text-xs text-red-600">
                      {otherBatch.name}
                    </em>
                  )}
                </label>
              );
            })}

            {batchStudentOptions.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-500">
                Add students in Student Management first.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white"
            >
              {editingBatch ? "Save changes" : "Create batch"} →
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}