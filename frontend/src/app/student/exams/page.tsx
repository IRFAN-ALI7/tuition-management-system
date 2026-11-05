"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";

import PageHeader from "@/components/student/ui/PageHeader";
import LoadingState from "@/components/student/ui/LoadingState";

import ExamSummaryCards from "@/components/student/exams/ExamSummaryCards";
import OverallPerformance from "@/components/student/exams/OverallPerformance";
import ExamList from "@/components/student/exams/ExamList";
import ExamResultModal from "@/components/student/exams/ExamResultModal";

import type {
  ExamApiResponse,
  ExamPagination,
  ExamResult,
  ExamSummary,
} from "@/types/student-exams";

import {
  DEFAULT_EXAM_SUMMARY,
} from "@/types/student-exams";

const DEFAULT_PAGINATION: ExamPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

export default function StudentExamsPage() {
  const [results, setResults] = useState<ExamResult[]>([]);

  const [summary, setSummary] = useState<ExamSummary>(
    DEFAULT_EXAM_SUMMARY
  );

  const [pagination, setPagination] = useState<ExamPagination>(
    DEFAULT_PAGINATION
  );

  const [selectedSubject, setSelectedSubject] = useState("all");
  const [page, setPage] = useState(1);

  const [selectedResult, setSelectedResult] =
    useState<ExamResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadResults() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "10",
          subject: selectedSubject,
        });

        const response = (await api(
          `/student/exams?${params.toString()}`
        )) as ExamApiResponse;

        if (cancelled) return;

        setResults(response.results ?? []);

        setSummary({
          ...DEFAULT_EXAM_SUMMARY,
          ...response.summary,
        });

        setPagination({
          ...DEFAULT_PAGINATION,
          ...response.pagination,
        });
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load exam results."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadResults();

    return () => {
      cancelled = true;
    };
  }, [page, selectedSubject, retryCount]);

  function handleSubjectChange(subject: string) {
    setSelectedSubject(subject);
    setPage(1);
    setSelectedResult(null);
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
    setSelectedResult(null);
  }

  if (loading && results.length === 0 && page === 1) {
    return <LoadingState message="Loading exam results..." />;
  }

  return (
    <div className="mx-auto max-w-[1450px] space-y-5 pb-8 sm:space-y-6">
      <PageHeader
        title="Exams & Results"
        description="Track your exams, marks and academic performance."
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-sm font-bold text-red-700 dark:text-red-300">
            Unable to load exam results
          </p>

          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() => setRetryCount((value) => value + 1)}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Performance summary */}
      <ExamSummaryCards summary={summary} />

      {/* Overall performance */}
      <OverallPerformance summary={summary} />

      {/* Exam results */}
      {loading && results.length > 0 && (
        <div className="rounded-xl bg-violet-50 px-4 py-2 text-xs font-medium text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
          Updating exam results...
        </div>
      )}

      <ExamList
        results={results}
        subjects={summary.subjects}
        selectedSubject={selectedSubject}
        onSubjectChange={handleSubjectChange}
        onView={setSelectedResult}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Complete result details popup */}
      <ExamResultModal
        result={selectedResult}
        onClose={() => setSelectedResult(null)}
      />
    </div>
  );
}