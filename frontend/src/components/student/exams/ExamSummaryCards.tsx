import {
  Award,
  BookOpenCheck,
  ClipboardList,
  TrendingUp,
} from "lucide-react";

import type { ExamSummary } from "@/types/student-exams";

interface Props {
  summary: ExamSummary;
}

export default function ExamSummaryCards({ summary }: Props) {
  const cards = [
    {
      title: "Total Exams",
      value: summary.totalExams,
      description: "Exams assigned to you",
      icon: ClipboardList,
      tone: "violet",
    },
    {
      title: "Exams Completed",
      value: summary.examsCompleted,
      description: "Results available",
      icon: BookOpenCheck,
      tone: "green",
    },
    {
      title: "Average Score",
      value: `${Number(summary.overallAverage).toFixed(1)}%`,
      description: "Across completed exams",
      icon: TrendingUp,
      tone: "blue",
    },
    {
      title: "Best Score",
      value: `${Number(summary.bestScore).toFixed(1)}%`,
      description: "Your highest exam score",
      icon: Award,
      tone: "red",
    },
  ];

  const tones: Record<string, string> = {
    violet:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-300",
    green:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300",
    blue:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300",
    red:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300",
  };

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className={`min-w-0 rounded-2xl border p-3 shadow-sm sm:p-4 ${tones[card.tone]}`}
          >
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/80 dark:bg-slate-900/60">
                <Icon size={19} strokeWidth={2.2} />
              </div>

              <p className="min-w-0 truncate text-[10px] font-bold sm:text-xs">
                {card.title}
              </p>
            </div>

            <p className="mt-3 text-xl font-extrabold tracking-tight sm:text-2xl">
              {card.value}
            </p>

            <p className="mt-1 hidden text-[10px] opacity-75 sm:block sm:text-xs">
              {card.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}