
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import PageHeader from "@/components/student/ui/PageHeader";
import SectionCard from "@/components/student/ui/SectionCard";
import LoadingState from "@/components/student/ui/LoadingState";
import EmptyState from "@/components/student/ui/EmptyState";
import StatusBadge from "@/components/student/ui/StatusBadge";

interface ExamResult {
  _id: string;
  examId?: string;
  examDate?: string;
  name?: string;
  subject?: string;
  batch?: string;
  totalMarks?: number;
  obtainedMarks?: number;
  percentage?: number;
}

interface ExamSummary {
  examsTaken?: number;
  totalObtained?: number;
  totalPossible?: number;
  overallAverage?: number;
  subjectAverages?: Array<{
    subject: string;
    average?: number;
  }>;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export default function StudentExamsPage() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [summary, setSummary] = useState<ExamSummary>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadResults() {
      try {
        const response = await api("/student/exams");
        if (cancelled) return;

        setResults(response.results ?? []);
        setSummary(response.summary ?? {});
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load exam results."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadResults();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingState message="Loading exam results..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exams & Results"
        description="Review your examination performance and subject-wise marks."
      />

      {error && (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Exams Taken</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {summary.examsTaken ?? results.length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Marks</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {summary.totalObtained ?? 0} / {summary.totalPossible ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Overall Average</p>
          <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {Number(summary.overallAverage ?? 0).toFixed(1)}%
          </p>
        </div>
      </div>

      <SectionCard title="Subject Performance">
        {!summary.subjectAverages?.length ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Subject-wise performance will appear here when results are available.
          </p>
        ) : (
          <div className="space-y-4">
            {summary.subjectAverages.map((item, index) => (
              <div key={`${item.subject}-${index}`}>
                <div className="mb-2 flex justify-between gap-3 text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {item.subject}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Number(item.average ?? 0).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{
                      width: `${Math.min(100, Math.max(0, Number(item.average ?? 0)))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Exam Results"
        description="Results published by your Tuition Admin."
      >
        {results.length === 0 ? (
          <EmptyState
            title="No results published yet"
            description="Your examination results will appear here once published."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="px-3 py-3 font-medium">Exam</th>
                  <th className="px-3 py-3 font-medium">Subject</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Marks</th>
                  <th className="px-3 py-3 font-medium">Percentage</th>
                  <th className="px-3 py-3 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr
                    key={result._id}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                  >
                    <td className="px-3 py-4 font-medium text-gray-900 dark:text-white">
                      {result.name || "Examination"}
                    </td>
                    <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                      {result.subject || "—"}
                    </td>
                    <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                      {formatDate(result.examDate)}
                    </td>
                    <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                      {result.obtainedMarks ?? 0} / {result.totalMarks ?? 0}
                    </td>
                    <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                      {Number(result.percentage ?? 0).toFixed(1)}%
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge
                        status={Number(result.percentage ?? 0) >= 33 ? "Passed" : "Needs Improvement"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
