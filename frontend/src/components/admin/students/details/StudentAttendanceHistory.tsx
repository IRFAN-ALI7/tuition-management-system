"use client";

import StudentPager from "./StudentPager";

type AttendanceRow = {
  _id: string;
  date: string;
  status: "present" | "absent";
  batch?: { name: string };
};

type AttendanceData = {
  summary: {
    total: number;
    present: number;
    absent: number;
    percentage: number | null;
  };
  pagination: {
    page: number;
    total: number;
    totalPages: number;
  };
  records: AttendanceRow[];
};

type MonthlyAttendance = {
  month: number;
  present: number;
  absent: number;
  total: number;
  percentage: number;
};

type Props = {
  attendance: AttendanceData | null;
  monthlyAttendance: MonthlyAttendance[];
  attendanceYear: string;
  attendanceMonth: string;
  yearOptions: number[];
  months: string[];
  sectionError: string;
  buttonClass: string;
  tableClass: string;
  tableWrapperClass: string;
  emptyClass: string;
  statusClass: (active: boolean) => string;
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  date: (value?: string) => string;
};

export default function StudentAttendanceHistory({
  attendance,
  monthlyAttendance,
  attendanceYear,
  attendanceMonth,
  yearOptions,
  months,
  sectionError,
  buttonClass,
  tableClass,
  tableWrapperClass,
  emptyClass,
  statusClass,
  onYearChange,
  onMonthChange,
  onPageChange,
  onRetry,
  date,
}: Props) {
  return (
    <section className="min-w-0 space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Attendance History
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {attendance?.summary.total
              ? attendance.summary.present +
                " present · " +
                attendance.summary.absent +
                " absent · " +
                attendance.summary.total +
                " marked classes overall"
              : "No attendance records have been marked."}
          </p>
        </div>

        <div className="rounded-2xl bg-indigo-50 px-5 py-3 dark:bg-indigo-950/50">
          <strong className="block text-2xl font-bold text-indigo-700 dark:text-indigo-300">
            {attendance?.summary.percentage === null ||
            attendance?.summary.percentage === undefined
              ? "—"
              : attendance.summary.percentage + "%"}
          </strong>

          <small className="text-xs text-slate-500 dark:text-slate-400">
            Overall attendance
          </small>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          Year

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            value={attendanceYear}
            onChange={(event) => onYearChange(event.target.value)}
          >
            <option value="all">All years</option>

            {yearOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          Month

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            value={attendanceMonth}
            onChange={(event) => onMonthChange(event.target.value)}
          >
            <option value="all">All months</option>

            {months.map((item, index) => (
              <option key={item} value={String(index + 1)}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      {sectionError && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
          role="alert"
        >
          {sectionError}
          <button className={buttonClass} onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {monthlyAttendance.map((item) => (
          <article
            key={item.month}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {months[item.month - 1]}
              </span>

              <strong className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {item.total ? item.percentage + "%" : "—"}
              </strong>
            </div>

            <small className="mt-2 block text-xs text-slate-500 dark:text-slate-400">
              {item.present} present · {item.absent} absent
            </small>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{
                  width: item.total ? item.percentage + "%" : "0%",
                }}
              />
            </div>
          </article>
        ))}

        {!monthlyAttendance.length && (
          <div className={emptyClass}>
            No monthly attendance summary is available.
          </div>
        )}
      </div>

      <div className={tableWrapperClass}>
        <table className={tableClass}>
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              {["Date", "Batch", "Status"].map((heading) => (
                <th className="px-4 py-3 font-semibold" key={heading}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {attendance?.records.map((item) => (
              <tr
                className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                key={item._id}
              >
                <td className="whitespace-nowrap px-4 py-3">
                  {date(item.date)}
                </td>

                <td className="px-4 py-3">
                  {item.batch?.name ?? "Batch unavailable"}
                </td>

                <td className="px-4 py-3">
                  <span className={statusClass(item.status === "present")}>
                    {item.status === "present" ? "Present" : "Absent"}
                  </span>
                </td>
              </tr>
            ))}

            {!attendance?.records.length && (
              <tr>
                <td colSpan={3} className={emptyClass}>
                  {sectionError ||
                    "No marked attendance found for this filter."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {attendance?.pagination && (
        <StudentPager
          page={attendance.pagination.page}
          totalPages={attendance.pagination.totalPages}
          total={attendance.pagination.total}
          onChange={onPageChange}
        />
      )}
    </section>
  );
}