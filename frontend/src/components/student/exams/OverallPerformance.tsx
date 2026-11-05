
import type { ExamSummary } from "@/types/student-exams";

interface Props {
  summary: ExamSummary;
}

export default function OverallPerformance({ summary }: Props) {
  const average = Math.min(
    100,
    Math.max(0, Number(summary.overallAverage) || 0)
  );

  const bands = [
    {
      range: "80+",
      label: "80% and above",
      count:
        summary.scoreBands.find((item) => item.range === "80+")?.count ?? 0,
      dot: "bg-green-500",
      badge:
        "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
    },
    {
      range: "60-79",
      label: "60% – 79%",
      count:
        summary.scoreBands.find((item) => item.range === "60-79")?.count ?? 0,
      dot: "bg-blue-500",
      badge:
        "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
    },
    {
      range: "40-59",
      label: "40% – 59%",
      count:
        summary.scoreBands.find((item) => item.range === "40-59")?.count ?? 0,
      dot: "bg-amber-500",
      badge:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    },
    {
      range: "below-40",
      label: "Below 40%",
      count:
        summary.scoreBands.find((item) => item.range === "below-40")?.count ?? 0,
      dot: "bg-red-500",
      badge:
        "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Overall Performance
        </h2>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Your overall examination score and performance distribution.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 items-center gap-6 sm:grid-cols-[0.8fr_1.2fr] sm:gap-8">
        {/* Overall score */}
        <div className="flex justify-center">
          <div
            className="grid h-36 w-36 place-items-center rounded-full sm:h-40 sm:w-40"
            style={{
              background: `conic-gradient(#7c3aed ${average}%, #e2e8f0 ${average}% 100%)`,
            }}
            role="img"
            aria-label={`Overall average ${average.toFixed(1)} percent`}
          >
            <div className="flex h-[78%] w-[78%] flex-col items-center justify-center rounded-full bg-white dark:bg-slate-900">
              <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {average.toFixed(1)}%
              </p>

              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                Average Score
              </p>
            </div>
          </div>
        </div>

        {/* Score distribution */}
        <div className="space-y-3">
          {bands.map((band) => (
            <div
              key={band.range}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-3 dark:border-slate-800"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${band.dot}`}
                />

                <span
                  className={`truncate rounded-md px-2 py-1 text-[10px] font-bold sm:text-xs ${band.badge}`}
                >
                  {band.label}
                </span>
              </div>

              <span className="shrink-0 text-xs font-bold text-slate-800 dark:text-white">
                {band.count} {band.count === 1 ? "Exam" : "Exams"}
              </span>
            </div>
          ))}

          <p className="pt-1 text-[10px] text-slate-400">
            Distribution is based on completed exam results.
          </p>
        </div>
      </div>
    </section>
  );
}
