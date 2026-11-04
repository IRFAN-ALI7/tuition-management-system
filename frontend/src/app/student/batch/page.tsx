
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import PageHeader from "@/components/student/ui/PageHeader";
import SectionCard from "@/components/student/ui/SectionCard";
import LoadingState from "@/components/student/ui/LoadingState";
import EmptyState from "@/components/student/ui/EmptyState";
import StatusBadge from "@/components/student/ui/StatusBadge";

interface BatchData {
  _id: string;
  name: string;
  startTime?: string;
  endTime?: string;
  active?: boolean;
}

function formatTime(time?: string) {
  if (!time) return "—";

  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getDuration(start?: string, end?: string) {
  if (!start || !end) return "—";

  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  if ([startHour, startMinute, endHour, endMinute].some(Number.isNaN)) {
    return "—";
  }

  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  if (minutes <= 0) return "—";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours && remainingMinutes) return `${hours} hr ${remainingMinutes} min`;
  if (hours) return `${hours} hr`;
  return `${remainingMinutes} min`;
}

export default function StudentBatchPage() {
  const [batch, setBatch] = useState<BatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBatch() {
      try {
        const response = await api("/student/batch");
        setBatch(
          response.batch ??
            response.data?.batch ??
            response.data ??
            null
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load batch details."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadBatch();
  }, []);

  if (loading) return <LoadingState message="Loading batch details..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Batch"
        description="View your assigned class and batch schedule."
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {!batch ? (
        <EmptyState
          title="No batch assigned"
          description="Please contact your Tuition Admin to know about your batch assignment."
        />
      ) : (
        <>
          <SectionCard
            title="Assigned Batch"
            description="Your current tuition batch information."
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Batch Name
                </p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {batch.name}
                </h2>
              </div>

              <StatusBadge status={batch.active === false ? "Inactive" : "Active"} />
            </div>
          </SectionCard>

          <div className="grid gap-4 sm:grid-cols-2">
            <SectionCard title="Class Starts">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" d="M12 7v5l3 2" />
                  </svg>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatTime(batch.startTime)}
                </p>
              </div>
            </SectionCard>

            <SectionCard title="Class Ends">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" d="M12 7v5l3 2" />
                  </svg>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatTime(batch.endTime)}
                </p>
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Class Duration">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {getDuration(batch.startTime, batch.endTime)}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Scheduled duration of your batch.
            </p>
          </SectionCard>
        </>
      )}
    </div>
  );
}
