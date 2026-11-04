
interface AttendanceOverviewProps {
  present: number;
  absent: number;
  total: number;
  percentage: number | null;
}

export default function AttendanceOverview({
  present,
  absent,
  total,
  percentage,
}: AttendanceOverviewProps) {
  const hasRecords = total > 0 && percentage !== null;
  const safePercentage = hasRecords
    ? Math.min(100, Math.max(0, percentage))
    : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-7">
        {/* Attendance ring */}
        <div className="relative grid h-40 w-40 shrink-0 place-items-center sm:h-44 sm:w-44">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: hasRecords
                ? `conic-gradient(#7c3aed ${safePercentage}%, #e9e7ef ${safePercentage}% 100%)`
                : "conic-gradient(#e9e7ef 0% 100%)",
            }}
          />

          <div className="absolute inset-[10px] rounded-full bg-white dark:bg-slate-900" />

          <div className="relative text-center">
            <p className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {hasRecords ? `${safePercentage.toFixed(1)}%` : "—"}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Attendance
            </p>
          </div>
        </div>

        {/* Counts */}
        <div className="w-full min-w-0 flex-1 space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Present
              </span>
            </div>

            <strong className="text-lg font-bold text-green-700 dark:text-green-400">
              {present}
            </strong>
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Absent
              </span>
            </div>

            <strong className="text-lg font-bold text-rose-600 dark:text-rose-400">
              {absent}
            </strong>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Total Classes
              </span>
            </div>

            <strong className="text-lg font-bold text-slate-900 dark:text-white">
              {total}
            </strong>
          </div>
        </div>
      </div>

      {!hasRecords && (
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-center text-xs text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
          Your attendance summary will appear here once your Tuition Admin records attendance.
        </div>
      )}

      {hasRecords && (
        <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-300">
              Attendance progress
            </span>

            <span className="font-bold text-violet-700 dark:text-violet-400">
              {present} / {total}
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-violet-600 transition-all duration-500"
              style={{ width: `${safePercentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
