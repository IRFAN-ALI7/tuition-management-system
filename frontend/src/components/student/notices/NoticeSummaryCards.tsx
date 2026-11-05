import {
  FileText,
  Users,
  UserRound,
  UsersRound,
} from "lucide-react";

import type { NoticeSummary } from "@/types/student-notices";

interface Props {
  summary: NoticeSummary;
}

export default function NoticeSummaryCards({ summary }: Props) {
  const cards = [
    {
      label: "Total Notices",
      value: summary.total,
      icon: FileText,
      tone: "violet",
    },
    {
      label: "All Students",
      value: summary.allStudents,
      icon: Users,
      tone: "blue",
    },
    {
      label: "Your Batch",
      value: summary.batch,
      icon: UsersRound,
      tone: "amber",
    },
    {
      label: "Personal",
      value: summary.personal,
      icon: UserRound,
      tone: "green",
    },
  ];

  const tones: Record<string, string> = {
    violet:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
    blue:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    amber:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    green:
      "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300",
  };

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4"
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tones[card.tone]}`}
              >
                <Icon size={18} />
              </div>

              <p className="truncate text-[10px] font-bold text-slate-500 dark:text-slate-400 sm:text-xs">
                {card.label}
              </p>
            </div>

            <p className="mt-3 text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
