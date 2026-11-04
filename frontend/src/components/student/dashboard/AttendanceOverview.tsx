
interface AttendanceOverviewProps {
  present?: number;
  absent?: number;
  total?: number;
  percentage?: number;
}

export default function AttendanceOverview({
  present = 0,
  absent = 0,
  total = 0,
  percentage = 0,
}: AttendanceOverviewProps) {
  const safePercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Attendance Overview
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Your overall attendance
          </p>
        </div>
        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {safePercentage}%
        </span>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${safePercentage}%` }}
        />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Present</p>
          <p className="mt-1 text-xl font-bold text-green-600">{present}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Absent</p>
          <p className="mt-1 text-xl font-bold text-red-500">{absent}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
            {total}
          </p>
        </div>
      </div>
    </div>
  );
}
