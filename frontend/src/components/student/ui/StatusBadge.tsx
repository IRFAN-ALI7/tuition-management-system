
interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({
  status,
  className = "",
}: StatusBadgeProps) {
  const normalizedStatus = status.trim().toLowerCase();

  let styles =
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  if (
    ["paid", "present", "active", "passed", "completed", "approved"].includes(
      normalizedStatus
    )
  ) {
    styles =
      "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400";
  } else if (
    ["due", "absent", "pending", "inactive", "unpaid"].includes(
      normalizedStatus
    )
  ) {
    styles =
      "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400";
  } else if (
    ["failed", "rejected", "overdue", "cancelled"].includes(normalizedStatus)
  ) {
    styles =
      "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles} ${className}`}
    >
      {status || "Unknown"}
    </span>
  );
}
