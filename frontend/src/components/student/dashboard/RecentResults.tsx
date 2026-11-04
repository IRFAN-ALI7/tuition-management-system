
import StatusBadge from "../ui/StatusBadge";
import EmptyState from "../ui/EmptyState";

export interface StudentResult {
  _id: string;
  subject?: string;
  examName?: string;
  marks?: number;
  totalMarks?: number;
  percentage?: number;
  date?: string;
}

interface RecentResultsProps {
  results: StudentResult[];
}

export default function RecentResults({ results }: RecentResultsProps) {
  if (!results.length) {
    return (
      <EmptyState
        title="No exam results yet"
        description="Your exam results will appear here when they are published."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <th className="px-3 py-3 font-medium">Exam / Subject</th>
            <th className="px-3 py-3 font-medium">Marks</th>
            <th className="px-3 py-3 font-medium">Percentage</th>
            <th className="px-3 py-3 font-medium">Result</th>
          </tr>
        </thead>

        <tbody>
          {results.map((result) => {
            const percentage =
              result.percentage ??
              (result.marks !== undefined &&
              result.totalMarks &&
              result.totalMarks > 0
                ? (result.marks / result.totalMarks) * 100
                : 0);

            return (
              <tr
                key={result._id}
                className="border-b border-gray-100 last:border-0 dark:border-gray-800"
              >
                <td className="px-3 py-4 font-medium text-gray-900 dark:text-white">
                  {result.examName || result.subject || "Examination"}
                </td>
                <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                  {result.marks ?? "—"}
                  {result.totalMarks ? ` / ${result.totalMarks}` : ""}
                </td>
                <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                  {percentage.toFixed(1)}%
                </td>
                <td className="px-3 py-4">
                  <StatusBadge
                    status={percentage >= 33 ? "Passed" : "Pending"}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
