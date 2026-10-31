"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type RecipientType = "ALL_STUDENTS" | "BATCH_WISE" | "SINGLE_STUDENT";

type NoticeBatch = { _id: string; name: string };

type NoticeStudent = { _id: string; name: string; phone: string };

type Notice = {
  _id: string;
  title: string;
  message: string;
  recipientType: RecipientType;
  batchId: NoticeBatch | null;
  studentId: NoticeStudent | null;
  createdAt: string;
};

type StudentOption = { _id: string; name: string; phone: string };

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const recipientLabels: Record<RecipientType, string> = {
  ALL_STUDENTS: "All Students",
  BATCH_WISE: "Batch Wise",
  SINGLE_STUDENT: "Single Student",
};

async function noticeApi(path: string, init?: RequestInit) {
  const response = await fetch(API + path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error ?? "Could not complete the notice request.",
    );
  }

  return data;
}

function publishDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const primaryButtonClass =
  "inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const outlineButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

const dialogBackdropClass =
  "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 sm:p-6";

const dialogClass =
  "relative my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7";

export function NoticesManagement({
  batches,
}: {
  batches: NoticeBatch[];
}) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [recipientType, setRecipientType] =
    useState<RecipientType>("ALL_STUDENTS");

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [batchId, setBatchId] = useState("");

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] =
    useState<StudentOption | null>(null);
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [studentSearchError, setStudentSearchError] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [noticeSearch, setNoticeSearch] = useState("");
  const [error, setError] = useState("");
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [noticeToDelete, setNoticeToDelete] = useState<Notice | null>(null);

  useEffect(() => {
    let live = true;

    void noticeApi("/notices")
      .then((data) => {
        if (live) setNotices(data.notices as Notice[]);
      })
      .catch((caught: Error) => {
        if (live) setError(caught.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const query = studentSearch.trim();

    if (
      recipientType !== "SINGLE_STUDENT" ||
      selectedStudent ||
      !query
    ) {
      return;
    }

    let live = true;

    const timer = window.setTimeout(() => {
      setSearchingStudents(true);
      setStudentSearchError("");

      void noticeApi(
        `/students?q=${encodeURIComponent(query)}&status=all&page=1&limit=20`,
      )
        .then((data) => {
          if (live) setStudentOptions(data.students as StudentOption[]);
        })
        .catch((caught: Error) => {
          if (live) setStudentSearchError(caught.message);
        })
        .finally(() => {
          if (live) setSearchingStudents(false);
        });
    }, 250);

    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [recipientType, studentSearch, selectedStudent]);

  const createNotice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const cleanTitle = title.trim();
    const cleanMessage = message.trim();

    if (!cleanTitle || !cleanMessage) {
      setError("Title and message are required.");
      return;
    }

    if (recipientType === "BATCH_WISE" && !batchId) {
      setError("Choose a batch for this notice.");
      return;
    }

    if (recipientType === "SINGLE_STUDENT" && !selectedStudent) {
      setError("Search and select a student for this notice.");
      return;
    }

    setSaving(true);

    try {
      const data = await noticeApi("/notices", {
        method: "POST",
        body: JSON.stringify({
          title: cleanTitle,
          message: cleanMessage,
          recipientType,
          ...(recipientType === "BATCH_WISE" ? { batchId } : {}),
          ...(recipientType === "SINGLE_STUDENT"
            ? { studentId: selectedStudent?._id }
            : {}),
        }),
      });

      setNotices((current) => [data.notice as Notice, ...current]);
      setTitle("");
      setMessage("");
      setRecipientType("ALL_STUDENTS");
      setBatchId("");
      setStudentSearch("");
      setSelectedStudent(null);
      setStudentOptions([]);
      setSearchingStudents(false);
      setStudentSearchError("");
      setCreateOpen(false);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not create this notice.",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!noticeToDelete) return;

    setDeleting(true);
    setError("");

    try {
      await noticeApi(
        `/notices/${encodeURIComponent(noticeToDelete._id)}`,
        { method: "DELETE" },
      );

      setNotices((current) =>
        current.filter((item) => item._id !== noticeToDelete._id),
      );

      if (selectedNotice?._id === noticeToDelete._id) {
        setSelectedNotice(null);
      }

      setNoticeToDelete(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not delete this notice.",
      );
      setNoticeToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const filteredNotices = notices.filter((item) => {
    const query = noticeSearch.trim().toLocaleLowerCase();

    if (!query) return true;

    const recipient = recipientLabels[item.recipientType];

    return [
      item.title,
      item.message,
      recipient,
      item.batchId?.name,
      item.studentId?.name,
      item.studentId?.phone,
    ].some((value) => value?.toLocaleLowerCase().includes(query));
  });

  return (
    <section className="space-y-6">
      {error && !createOpen && (
        <div
          className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          role="alert"
        >
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <div className="text-xs font-bold tracking-[0.18em] text-blue-600">
              NOTICE MANAGEMENT
            </div>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Notices
            </h2>
          </div>

          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => {
              setError("");
              setCreateOpen(true);
            }}
          >
            Create Notice
          </button>
        </header>

        <div className="p-5 sm:p-6">
          <label className="block max-w-xl space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Search notices
            </span>
            <input
              className={inputClass}
              type="search"
              value={noticeSearch}
              onChange={(event) => setNoticeSearch(event.target.value)}
              placeholder="Search title, message or recipient"
            />
          </label>

          {loading ? (
            <p className="py-12 text-center text-sm text-slate-500">
              Loading notices…
            </p>
          ) : filteredNotices.length ? (
            <div className="mt-5 divide-y divide-slate-200">
              {filteredNotices.map((item) => (
                <article
                  className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between"
                  key={item._id}
                >
                  <div className="min-w-0 flex-1">
                    <strong className="block break-words text-base font-semibold text-slate-900">
                      {item.title}
                    </strong>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                      {item.message}
                    </p>

                    <span className="mt-3 inline-flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                        {recipientLabels[item.recipientType]}
                      </span>
                      <span>·</span>
                      <span>{publishDate(item.createdAt)}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={outlineButtonClass}
                      onClick={() => setSelectedNotice(item)}
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => setNoticeToDelete(item)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-slate-500">
              {notices.length
                ? "No notices match your search."
                : "No notices have been created."}
            </p>
          )}
        </div>
      </section>

      {createOpen && (
        <div
          className={dialogBackdropClass}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setCreateOpen(false);
            }
          }}
        >
          <section
            className={dialogClass}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-notice-title"
          >
            <button
              type="button"
              className="absolute right-4 top-3 rounded-lg px-2 py-1 text-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close create notice form"
              disabled={saving}
              onClick={() => setCreateOpen(false)}
            >
              ×
            </button>

            <div className="pr-8">
              <div className="text-xs font-bold tracking-[0.18em] text-blue-600">
                NOTICE MANAGEMENT
              </div>
              <h2
                id="create-notice-title"
                className="mt-2 text-2xl font-bold text-slate-900"
              >
                Create Notice
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Compose a notice and choose who should receive it.
              </p>
            </div>

            <form
              className="mt-6 space-y-5"
              onSubmit={(event) => void createNotice(event)}
            >
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">
                  Recipient Type
                </span>
                <select
                  className={inputClass}
                  required
                  value={recipientType}
                  onChange={(event) => {
                    setRecipientType(event.target.value as RecipientType);
                    setBatchId("");
                    setStudentSearch("");
                    setSelectedStudent(null);
                    setStudentOptions([]);
                    setSearchingStudents(false);
                    setStudentSearchError("");
                  }}
                >
                  <option value="ALL_STUDENTS">ALL_STUDENTS</option>
                  <option value="BATCH_WISE">BATCH_WISE</option>
                  <option value="SINGLE_STUDENT">SINGLE_STUDENT</option>
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">
                  Title
                </span>
                <input
                  className={inputClass}
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">
                  Message
                </span>
                <textarea
                  className={`${inputClass} min-h-32 resize-y`}
                  required
                  rows={5}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </label>

              {recipientType === "BATCH_WISE" && (
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    Batch Selection
                  </span>
                  <select
                    className={inputClass}
                    required
                    value={batchId}
                    onChange={(event) => setBatchId(event.target.value)}
                  >
                    <option value="">Select a batch</option>
                    {batches.map((batch) => (
                      <option key={batch._id} value={batch._id}>
                        {batch.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {recipientType === "SINGLE_STUDENT" && (
                <div className="space-y-2">
                  <label
                    htmlFor="notice-student-search"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Student Search
                  </label>

                  <input
                    id="notice-student-search"
                    className={inputClass}
                    required
                    value={studentSearch}
                    placeholder="Search by name or mobile number"
                    onChange={(event) => {
                      setStudentSearch(event.target.value);
                      setSelectedStudent(null);
                      setStudentOptions([]);
                      setSearchingStudents(false);
                      setStudentSearchError("");
                    }}
                  />

                  {selectedStudent && (
                    <span className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                      {selectedStudent.name} · {selectedStudent.phone}
                    </span>
                  )}

                  {searchingStudents && (
                    <small className="block text-sm text-slate-500">
                      Searching students…
                    </small>
                  )}

                  {studentSearchError && (
                    <small
                      className="block rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                      role="alert"
                    >
                      {studentSearchError}
                    </small>
                  )}

                  {!searchingStudents && studentOptions.length > 0 && (
                    <div
                      className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm"
                      role="listbox"
                      aria-label="Matching students"
                    >
                      {studentOptions.map((student) => (
                        <button
                          type="button"
                          key={student._id}
                          role="option"
                          aria-selected={
                            selectedStudent?._id === student._id
                          }
                          className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-blue-50 aria-selected:bg-blue-50"
                          onClick={() => {
                            setSelectedStudent(student);
                            setStudentSearch(
                              `${student.name} · ${student.phone}`,
                            );
                            setStudentOptions([]);
                            setSearchingStudents(false);
                          }}
                        >
                          <strong className="text-sm font-semibold text-slate-800">
                            {student.name}
                          </strong>
                          <span className="text-sm text-slate-500">
                            {student.phone}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {!searchingStudents &&
                    studentSearch.trim() &&
                    !selectedStudent &&
                    !studentSearchError &&
                    studentOptions.length === 0 && (
                      <small className="block text-sm text-slate-500">
                        No matching students found.
                      </small>
                    )}
                </div>
              )}

              {error && (
                <div
                  className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className={outlineButtonClass}
                  disabled={saving}
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </button>

                <button
                  className={primaryButtonClass}
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Send Notice"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedNotice && (
        <div
          className={dialogBackdropClass}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedNotice(null);
            }
          }}
        >
          <section
            className={dialogClass}
            role="dialog"
            aria-modal="true"
            aria-labelledby="notice-details-title"
          >
            <button
              type="button"
              className="absolute right-4 top-3 rounded-lg px-2 py-1 text-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close notice details"
              onClick={() => setSelectedNotice(null)}
            >
              ×
            </button>

            <div className="pr-8">
              <div className="text-xs font-bold tracking-[0.18em] text-blue-600">
                NOTICE MANAGEMENT
              </div>
              <h2
                id="notice-details-title"
                className="mt-2 text-2xl font-bold text-slate-900"
              >
                Notice Details
              </h2>
            </div>

            <dl className="mt-6 divide-y divide-slate-200">
              <div className="py-4 first:pt-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notice Title
                </dt>
                <dd className="mt-2 break-words text-sm font-semibold text-slate-900">
                  {selectedNotice.title}
                </dd>
              </div>

              <div className="py-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Complete Notice Message
                </dt>
                <dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                  {selectedNotice.message}
                </dd>
              </div>

              <div className="py-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Recipient Type
                </dt>
                <dd className="mt-2 text-sm font-medium text-slate-800">
                  {recipientLabels[selectedNotice.recipientType]}
                </dd>
              </div>

              {selectedNotice.recipientType === "BATCH_WISE" && (
                <div className="py-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Batch
                  </dt>
                  <dd className="mt-2 text-sm font-medium text-slate-800">
                    {selectedNotice.batchId?.name ?? "Batch unavailable"}
                  </dd>
                </div>
              )}

              {selectedNotice.recipientType === "SINGLE_STUDENT" && (
                <div className="py-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Student
                  </dt>
                  <dd className="mt-2 text-sm font-medium text-slate-800">
                    {selectedNotice.studentId
                      ? `${selectedNotice.studentId.name} · ${selectedNotice.studentId.phone}`
                      : "Student unavailable"}
                  </dd>
                </div>
              )}

              <div className="py-4 last:pb-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Publish Date
                </dt>
                <dd className="mt-2 text-sm font-medium text-slate-800">
                  {publishDate(selectedNotice.createdAt)}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      )}

      {noticeToDelete && (
        <div className={dialogBackdropClass}>
          <section
            className={`${dialogClass} max-w-md`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="notice-delete-title"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-xl font-bold text-rose-600">
              !
            </div>

            <h2
              id="notice-delete-title"
              className="mt-4 text-xl font-bold text-slate-900"
            >
              Delete Notice
            </h2>

            <p className="mt-2 break-words text-sm leading-6 text-slate-600">
              Delete “{noticeToDelete.title}” permanently?
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className={outlineButtonClass}
                disabled={deleting}
                onClick={() => setNoticeToDelete(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={deleting}
                onClick={() => void confirmDelete()}
              >
                {deleting ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}