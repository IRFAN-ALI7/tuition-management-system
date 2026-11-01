"use client";

import Image from "next/image";

export type StudentProfile = {
  _id: string;
  studentId?: string;
  name: string;
  fatherName?: string;
  phone: string;
  address?: string;
  gender?: string;
  className?: string;
  batchId?: {
    _id: string;
    name: string;
    startTime: string;
    endTime: string;
  } | null;
  admissionDate?: string;
  monthlyFees?: number | null;
  profilePhoto?: string;
  active: boolean;
  createdAt?: string;
};

type Props = {
  student: StudentProfile;
  statusUpdating: boolean;
  deleting: boolean;
  buttonClass: string;
  onToggleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onResetPassword: () => void;
  money: (value: number) => string;
  date: (value?: string) => string;
  prettyTime: (value: string) => string;
};

export default function StudentProfileHeader({
  student,
  statusUpdating,
  deleting,
  buttonClass,
  onToggleStatus,
  onEdit,
  onDelete,
  onResetPassword,
  money,
  date,
  prettyTime,
}: Props) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {student.profilePhoto ? (
            <Image
              className="h-[88px] w-[88px] shrink-0 rounded-2xl object-cover ring-4 ring-indigo-50 dark:ring-indigo-950"
              src={student.profilePhoto}
              alt={student.name}
              width={88}
              height={88}
              unoptimized
            />
          ) : (
            <span className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-3xl font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {student.name.slice(0, 1).toUpperCase()}
            </span>
          )}

          <div className="min-w-0">
            <div className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
              Student Profile
            </div>

            <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {student.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {student.studentId || "Student ID unavailable"}
            </p>

            <span
              className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                student.active
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
              }`}
            >
              {student.active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
          <button
            type="button"
            role="switch"
            aria-checked={student.active}
            aria-label="Toggle student account status"
            disabled={statusUpdating}
            onClick={onToggleStatus}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
              student.active
                ? "bg-green-500"
                : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                student.active ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>

          <button
            type="button"
            className={buttonClass}
            onClick={onResetPassword}
          >
            Reset Password
          </button>

          <button
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onEdit}
          >
            Edit Student
          </button>

          <button
            className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Student"}
          </button>
        </div>
      </div>

      <dl className="mt-7 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 dark:border-slate-800 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Father's name", value: student.fatherName || "—" },
          { label: "Phone number", value: student.phone || "—" },
          { label: "Address", value: student.address || "—" },
          { label: "Gender", value: student.gender || "—" },
          { label: "Class", value: student.className || "—" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60"
          >
            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {item.label}
            </dt>
            <dd className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">
              {item.value}
            </dd>
          </div>
        ))}

        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
          <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Batch
          </dt>
          <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {student.batchId ? (
              <>
                {student.batchId.name}
                <small className="mt-1 block font-normal text-slate-500 dark:text-slate-400">
                  {prettyTime(student.batchId.startTime)} –{" "}
                  {prettyTime(student.batchId.endTime)}
                </small>
              </>
            ) : (
              "Unassigned"
            )}
          </dd>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
          <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Admission date
          </dt>
          <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {date(student.admissionDate || student.createdAt)}
          </dd>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
          <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Monthly fees
          </dt>
          <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {typeof student.monthlyFees === "number"
              ? money(student.monthlyFees)
              : "—"}
          </dd>
        </div>
      </dl>
    </section>
  );
}