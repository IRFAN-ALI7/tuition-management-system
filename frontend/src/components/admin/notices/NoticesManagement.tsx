
"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type RecipientType = "ALL_STUDENTS" | "BATCH_WISE" | "SINGLE_STUDENT";

type NoticeBatch = { _id: string; name: string };
type NoticeStudent = {
  _id: string;
  name: string;
  phone: string;
  profilePhoto?: string;
};

type StudentOption = {
  _id: string;
  name: string;
  phone: string;
  profilePhoto?: string;
};

type Notice = {
  _id: string;
  title: string;
  message: string;
  recipientType: RecipientType;
  batchId: NoticeBatch | null;
  studentId: NoticeStudent | null;
  createdAt: string;
};

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
    throw new Error(data.error ?? "Could not complete the notice request.");
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
  "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-950";

const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const outlineButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

const labelClass =
  "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200";

const dialogBackdropClass =
  "fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center sm:p-6";

const dialogClass =
  "relative my-auto w-full max-w-[640px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900";

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
  const [recipientOpen, setRecipientOpen] = useState(false);

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setRecipientType("ALL_STUDENTS");
    setBatchId("");
    setStudentSearch("");
    setSelectedStudent(null);
    setStudentOptions([]);
    setSearchingStudents(false);
    setStudentSearchError("");
    setError("");
  };

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
        `/students?q=${encodeURIComponent(query)}&status=all&page=1&limit=20`
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
    }, 300);

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
      resetForm();
      setCreateOpen(false);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not create this notice."
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
        { method: "DELETE" }
      );

      setNotices((current) =>
        current.filter((item) => item._id !== noticeToDelete._id)
      );

      if (selectedNotice?._id === noticeToDelete._id) {
        setSelectedNotice(null);
      }

      setNoticeToDelete(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not delete this notice."
      );
      setNoticeToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const filteredNotices = notices.filter((item) => {
    const query = noticeSearch.trim().toLocaleLowerCase();

    if (!query) return true;

    return [
      item.title,
      item.message,
      recipientLabels[item.recipientType],
      item.batchId?.name,
      item.studentId?.name,
      item.studentId?.phone,
    ].some((value) => value?.toLocaleLowerCase().includes(query));
  });

  return (
    <section className="min-w-0 space-y-6">
      {error && !createOpen && (
        <div
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
          role="alert"
        >
          <span className="font-bold">!</span>
          <p className="min-w-0 flex-1">{error}</p>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* NOTICE LIST */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <header className="flex flex-col gap-4 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-blue-600 dark:text-blue-400">
              NOTICE MANAGEMENT
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
              Notices
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create and manage announcements for your students.
            </p>
          </div>

          <button
            type="button"
            className={`${primaryButtonClass} w-full sm:w-auto`}
            onClick={() => {
              resetForm();
              setCreateOpen(true);
            }}
          >
            <span className="mr-2 text-lg leading-none">+</span>
            Create Notice
          </button>
        </header>

        <div className="p-4 sm:p-6">
          <div className="max-w-xl">
            <label htmlFor="notice-search" className={labelClass}>
              Search notices
            </label>
            <input
              id="notice-search"
              name="noticeSearch"
              className={inputClass}
              type="search"
              value={noticeSearch}
              onChange={(event) => setNoticeSearch(event.target.value)}
              placeholder="Search title, message or recipient..."
            />
          </div>

          {loading ? (
            <div className="flex min-h-40 items-center justify-center text-sm text-slate-500">
              Loading notices...
            </div>
          ) : filteredNotices.length ? (
            <div className="mt-6 divide-y divide-slate-100 dark:divide-slate-800">
              {filteredNotices.map((item) => (
                <article
                  className="flex min-w-0 flex-col gap-4 py-5 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between"
                  key={item._id}
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-base font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </h3>

                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600 dark:text-slate-400">
                      {item.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                        {recipientLabels[item.recipientType]}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {publishDate(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      className={outlineButtonClass}
                      onClick={() => setSelectedNotice(item)}
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-950/30"
                      onClick={() => setNoticeToDelete(item)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400 dark:bg-slate-800">
                ▤
              </span>
              <h3 className="mt-4 font-semibold text-slate-800 dark:text-white">
                {notices.length ? "No matching notices" : "No notices yet"}
              </h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                {notices.length
                  ? "Try another search term."
                  : "Create your first notice to communicate with students."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CREATE NOTICE MODAL */}
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
            {/* Modal Header */}
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 dark:border-slate-800 dark:bg-slate-900 sm:px-7">
              <div className="min-w-0">
                <p className="text-xs font-bold tracking-[0.18em] text-blue-600 dark:text-blue-400">
                  NOTICE MANAGEMENT
                </p>
                <h2
                  id="create-notice-title"
                  className="mt-2 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl"
                >
                  Create Notice
                </h2>
                <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                  Compose a notice and choose who should receive it.
                </p>
              </div>

              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Close create notice form"
                disabled={saving}
                onClick={() => setCreateOpen(false)}
              >
                ×
              </button>
            </header>

            {/* Modal Form */}
            <form
              className="space-y-5 px-5 py-5 sm:px-7 sm:py-6"
              onSubmit={(event) => void createNotice(event)}
            >
             
{/* Recipient Type - Custom Dropdown */}
<div>
  <label className={labelClass}>
    Recipient Type
  </label>

  <div className="relative">
    <button
      type="button"
      id="recipient-type"
      aria-haspopup="listbox"
      aria-expanded={recipientOpen}
      onClick={() => setRecipientOpen((prev) => !prev)}
      className={`${inputClass} flex items-center justify-between gap-3 text-left ${
        recipientOpen
          ? "border-blue-500 ring-4 ring-blue-100 dark:ring-blue-950"
          : ""
      }`}
    >
      <span className="truncate">
        {recipientLabels[recipientType]}
      </span>

      <svg
        className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
          recipientOpen ? "rotate-180" : ""
        }`}
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="m5 7.5 5 5 5-5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>

    {recipientOpen && (
      <>
        <button
          type="button"
          aria-label="Close recipient options"
          className="fixed inset-0 z-20 cursor-default"
          onClick={() => setRecipientOpen(false)}
        />

        <div
          role="listbox"
          aria-label="Recipient Type"
          className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900"
        >
          {(
            [
              {
                value: "ALL_STUDENTS",
                label: "All Students",
                description: "Send to every student",
                icon: "👥",
              },
              {
                value: "BATCH_WISE",
                label: "Batch Wise",
                description: "Send to a selected batch",
                icon: "📚",
              },
              {
                value: "SINGLE_STUDENT",
                label: "Single Student",
                description: "Send to one selected student",
                icon: "👤",
              },
            ] as const
          ).map((option) => {
            const active = recipientType === option.value;

            return (
              <button
                type="button"
                role="option"
                aria-selected={active}
                key={option.value}
                onClick={() => {
                  setRecipientType(option.value);
                  setBatchId("");
                  setStudentSearch("");
                  setSelectedStudent(null);
                  setStudentOptions([]);
                  setStudentSearchError("");
                  setRecipientOpen(false);
                }}
                className={`flex w-full min-w-0 items-center gap-3 rounded-lg px-3 py-3 text-left transition ${
                  active
                    ? "bg-blue-50 dark:bg-blue-950/40"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-slate-800">
                  {option.icon}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm font-semibold ${
                      active
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-slate-800 dark:text-slate-100"
                    }`}
                  >
                    {option.label}
                  </span>

                  <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                    {option.description}
                  </span>
                </span>

                {active && (
                  <svg
                    className="h-5 w-5 shrink-0 text-blue-600"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="m4 10 4 4 8-8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </>
    )}
  </div>

  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
    {recipientType === "ALL_STUDENTS" &&
      "This notice will be sent to all students."}
    {recipientType === "BATCH_WISE" &&
      "Choose a batch to send this notice to its students."}
    {recipientType === "SINGLE_STUDENT" &&
      "Search for one student and select their account."}
  </p>
</div>


              {/* Batch Selection */}
              {recipientType === "BATCH_WISE" && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
                  <label htmlFor="notice-batch" className={labelClass}>
                    Select Batch <span className="text-rose-500">*</span>
                  </label>

                  <select
                    id="notice-batch"
                    name="batchId"
                    className={inputClass}
                    required
                    value={batchId}
                    onChange={(event) => setBatchId(event.target.value)}
                  >
                    <option value="">Choose a batch</option>
                    {batches.map((batch) => (
                      <option key={batch._id} value={batch._id}>
                        {batch.name}
                      </option>
                    ))}
                  </select>

                  {batches.length === 0 && (
                    <p className="mt-2 text-xs text-rose-600">
                      No batches are available.
                    </p>
                  )}
                </div>
              )}

              {/* Single Student Search */}
              {recipientType === "SINGLE_STUDENT" && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
                  <label htmlFor="notice-student-search" className={labelClass}>
                    Select Student <span className="text-rose-500">*</span>
                  </label>

                  <input
                    id="notice-student-search"
                    name="studentSearch"
                    className={inputClass}
                    value={studentSearch}
                    placeholder="Enter student name or mobile number"
                    onChange={(event) => {
                      setStudentSearch(event.target.value);
                      setSelectedStudent(null);
                      setStudentOptions([]);
                      setSearchingStudents(false);
                      setStudentSearchError("");
                    }}
                  />

                  {selectedStudent && (
<div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
  <div className="flex min-w-0 items-center gap-3">
    {selectedStudent.profilePhoto ? (
      <img
        src={selectedStudent.profilePhoto}
        alt={`${selectedStudent.name} profile`}
        className="h-12 w-12 shrink-0 rounded-full border border-emerald-200 object-cover dark:border-emerald-800"
      />
    ) : (
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-sm font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
        {selectedStudent.name
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part.charAt(0).toUpperCase())
          .join("") || "S"}
      </span>
    )}

    <div className="min-w-0">
      <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
        Selected Student
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-emerald-900 dark:text-emerald-200">
        {selectedStudent.name}
      </p>
      <p className="text-xs text-emerald-700 dark:text-emerald-400">
        {selectedStudent.phone}
      </p>
    </div>
  </div>

  <button
    type="button"
    className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/50"
    onClick={() => {
      setSelectedStudent(null);
      setStudentSearch("");
      setStudentOptions([]);
    }}
  >
    Change
  </button>
</div>
                  )}

                  {searchingStudents && (
                    <p className="mt-3 text-sm text-slate-500">
                      Searching students...
                    </p>
                  )}

                  {studentSearchError && (
                    <p
                      className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
                      role="alert"
                    >
                      {studentSearchError}
                    </p>
                  )}

                  {!searchingStudents && studentOptions.length > 0 && (
                    <div className="mt-3 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
{studentOptions.map((student) => {
  const initials = student.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <button
      type="button"
      key={student._id}
      className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-blue-50 dark:border-slate-800 dark:hover:bg-slate-800"
      onClick={() => {
        setSelectedStudent(student);
        setStudentSearch(`${student.name} · ${student.phone}`);
        setStudentOptions([]);
      }}
    >
      <span className="flex min-w-0 items-center gap-3">
        {student.profilePhoto ? (
          <img
            src={student.profilePhoto}
            alt={`${student.name} profile`}
            className="h-11 w-11 shrink-0 rounded-full border border-slate-200 object-cover dark:border-slate-700"
          />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
            {initials || "S"}
          </span>
        )}

        <span className="min-w-0">
          <span className="block break-words text-sm font-semibold text-slate-800 dark:text-slate-100">
            {student.name}
          </span>
          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
            {student.phone}
          </span>
        </span>
      </span>

      <span className="shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-400">
        Select
      </span>
    </button>
  );
})}
                    </div>
                  )}

                  {!searchingStudents &&
                    studentSearch.trim() &&
                    !selectedStudent &&
                    !studentSearchError &&
                    studentOptions.length === 0 && (
                      <p className="mt-3 text-sm text-slate-500">
                        No matching students found.
                      </p>
                    )}
                </div>
              )}

              {/* Title */}
              <div>
                <label htmlFor="notice-title" className={labelClass}>
                  Notice Title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="notice-title"
                  name="title"
                  className={inputClass}
                  required
                  maxLength={120}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Enter notice title"
                />
                <p className="mt-1.5 text-right text-xs text-slate-400">
                  {title.length}/120
                </p>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="notice-message" className={labelClass}>
                  Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="notice-message"
                  name="message"
                  className={`${inputClass} min-h-36 resize-y leading-6`}
                  required
                  rows={5}
                  maxLength={3000}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Write your notice message here..."
                />
                <p className="mt-1.5 text-right text-xs text-slate-400">
                  {message.length}/3000
                </p>
              </div>

              {error && (
                <div
                  className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* Actions */}
              <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className={outlineButtonClass}
                  disabled={saving}
                  onClick={() => {
                    resetForm();
                    setCreateOpen(false);
                  }}
                >
                  Cancel
                </button>

                <button
                  className={primaryButtonClass}
                  type="submit"
                  disabled={
                    saving ||
                    (recipientType === "BATCH_WISE" && !batchId) ||
                    (recipientType === "SINGLE_STUDENT" && !selectedStudent)
                  }
                >
                  {saving ? "Sending..." : "Send Notice"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* VIEW NOTICE DETAILS */}
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
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:p-7">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-blue-600">
                  NOTICE MANAGEMENT
                </p>
                <h2
                  id="notice-details-title"
                  className="mt-2 text-xl font-bold text-slate-900 dark:text-white"
                >
                  Notice Details
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close notice details"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setSelectedNotice(null)}
              >
                ×
              </button>
            </header>

            <div className="space-y-5 p-5 sm:p-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notice Title
                </p>
                <p className="mt-2 break-words text-base font-semibold text-slate-900 dark:text-white">
                  {selectedNotice.title}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Complete Notice Message
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 dark:text-slate-300">
                  {selectedNotice.message}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 border-t border-slate-200 pt-5 dark:border-slate-800 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Recipient Type
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                    {recipientLabels[selectedNotice.recipientType]}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Publish Date
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                    {publishDate(selectedNotice.createdAt)}
                  </p>
                </div>

                {selectedNotice.recipientType === "BATCH_WISE" && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Batch
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                      {selectedNotice.batchId?.name ?? "Batch unavailable"}
                    </p>
                  </div>
                )}

                {selectedNotice.recipientType === "SINGLE_STUDENT" && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Student
                    </p>
                    <p className="mt-2 break-words text-sm font-medium text-slate-800 dark:text-slate-200">
                      {selectedNotice.studentId
                        ? `${selectedNotice.studentId.name} · ${selectedNotice.studentId.phone}`
                        : "Student unavailable"}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-800">
                <button
                  type="button"
                  className={primaryButtonClass}
                  onClick={() => setSelectedNotice(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {noticeToDelete && (
        <div className={dialogBackdropClass}>
          <section
            className={`${dialogClass} max-w-md p-5 sm:p-7`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="notice-delete-title"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-xl font-bold text-rose-600 dark:bg-rose-950/50">
              !
            </div>

            <h2
              id="notice-delete-title"
              className="mt-4 text-xl font-bold text-slate-900 dark:text-white"
            >
              Delete Notice?
            </h2>

            <p className="mt-2 break-words text-sm leading-6 text-slate-600 dark:text-slate-400">
              Are you sure you want to permanently delete “
              {noticeToDelete.title}”?
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
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={deleting}
                onClick={() => void confirmDelete()}
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
