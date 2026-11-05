
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
  const information = [
    {
      label: "Father's Name",
      value: student.fatherName || "—",
    },
    {
      label: "Phone Number",
      value: student.phone || "—",
    },
    {
      label: "Address",
      value: student.address || "—",
    },
    {
      label: "Gender",
      value: student.gender || "—",
    },
    {
      label: "Class",
      value: student.className || "—",
    },
    {
      label: "Batch",
      value: student.batchId ? student.batchId.name : "Unassigned",
      extra: student.batchId
        ? `${prettyTime(student.batchId.startTime)} – ${prettyTime(
            student.batchId.endTime
          )}`
        : "",
    },
    {
      label: "Admission Date",
      value: date(student.admissionDate || student.createdAt),
    },
    {
      label: "Monthly Fees",
      value:
        typeof student.monthlyFees === "number"
          ? money(student.monthlyFees)
          : "—",
    },
  ];

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:p-7">
      {/* Profile identity */}
      <div className="flex min-w-0 items-center gap-4">
        {student.profilePhoto ? (
          <Image
            className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-4 ring-indigo-50 dark:ring-indigo-950 sm:h-20 sm:w-20"
            src={student.profilePhoto}
            alt={student.name}
            width={80}
            height={80}
            unoptimized
          />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-2xl font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 sm:h-20 sm:w-20 sm:text-3xl">
            {student.name.slice(0, 1).toUpperCase()}
          </span>
        )}

        <div className="min-w-0">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400 sm:text-xs">
            Student Profile
          </p>

          <h1 className="break-words text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {student.name}
          </h1>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            {student.studentId || "Student ID unavailable"}
          </p>

          <span
            className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold sm:text-xs ${
              student.active
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                student.active ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            {student.active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* All actions in one row */}
      <div className="mt-5 grid grid-cols-[40px_minmax(0,1.45fr)_minmax(0,0.75fr)_minmax(0,0.8fr)] items-center gap-2 sm:mt-6 sm:flex sm:gap-3">
        {/* Status toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={student.active}
          aria-label="Toggle student account status"
          title={student.active ? "Deactivate" : "Activate"}
          disabled={statusUpdating}
          onClick={onToggleStatus}
          className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:h-7 sm:w-12 ${
            student.active
              ? "bg-emerald-500"
              : "bg-slate-300 dark:bg-slate-600"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 sm:h-6 sm:w-6 ${
              student.active
                ? "translate-x-[18px] sm:translate-x-[22px]"
                : "translate-x-0.5"
            }`}
          />
        </button>

        {/* Reset Password */}
        <button
          type="button"
          className={`${buttonClass} min-w-0 whitespace-nowrap px-1.5 py-2 text-[10px] sm:px-4 sm:py-2.5 sm:text-sm`}
          onClick={onResetPassword}
        >
          Reset Password
        </button>

        {/* Edit */}
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-w-0 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-1.5 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-950 sm:px-5 sm:py-2.5 sm:text-sm"
        >
          Edit
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="inline-flex min-w-0 items-center justify-center rounded-xl bg-rose-600 px-1.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:py-2.5 sm:text-sm"
        >
          {deleting ? "..." : "Delete"}
        </button>
      </div>

      {/* Student information */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 bg-indigo-50/80 px-4 py-3 dark:bg-indigo-950/40 sm:px-5">
          <svg
            className="h-6 w-6 shrink-0 text-indigo-600 dark:text-indigo-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
          </svg>

          <h2 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
            Student Information
          </h2>
        </div>

        <dl className="grid grid-cols-2 divide-x divide-slate-200 px-3 py-3 dark:divide-slate-800 sm:px-5 sm:py-4">
          {[information.slice(0, 4), information.slice(4, 8)].map(
            (column, columnIndex) => (
              <div
                key={columnIndex}
                className="min-w-0 space-y-4 px-2 sm:space-y-5 sm:px-4"
              >
                {column.map((item) => (
                  <div
                    key={item.label}
                    className="grid min-w-0 grid-cols-1 gap-1"
                  >
                    <dt className="text-[10px] font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
                      {item.label}
                    </dt>

                    <dd className="break-words text-xs font-semibold text-slate-900 [overflow-wrap:anywhere] dark:text-slate-100 sm:text-sm">
                      {item.value}
                    </dd>

                    {"extra" in item && item.extra && (
                      <dd className="text-[9px] text-slate-500 dark:text-slate-400 sm:text-xs">
                        {item.extra}
                      </dd>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </dl>
      </div>
    </section>
  );
}
