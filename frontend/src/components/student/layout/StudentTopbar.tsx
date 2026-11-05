
"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

interface StudentTopbarProps {
  name: string;
  image?: string;
  onMenuClick: () => void;
  onLogout: () => void;
}

const pageTitles: Record<string, string> = {
  "/student": "Student Portal",
  "/student/profile": "My Profile",
  "/student/batch": "My Batch",
  "/student/attendance": "Attendance",
  "/student/fees": "Fee Management",
  "/student/exams": "Exams & Results",
  "/student/notices": "Notices",
  "/student/settings": "Settings",
};

export default function StudentTopbar({
  name,
  image,
  onMenuClick,
  onLogout,
}: StudentTopbarProps) {
  const { dark, toggleTheme } = useTheme();
  const pathname = usePathname();

  const initial = name.trim().charAt(0).toUpperCase() || "S";
  const title = pageTitles[pathname] ?? "Student Portal";

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 sm:h-[76px] sm:px-6 lg:px-8">
      {/* Left section */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-violet-800 dark:hover:bg-slate-800 lg:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold text-slate-900 dark:text-white sm:text-base">
            {title}
          </p>
          <p className="mt-0.5 hidden text-[11px] text-slate-400 sm:block">
            Your learning space
          </p>
        </div>
      </div>

      {/* Right section */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          title={dark ? "Light mode" : "Dark mode"}
          className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {dark ? (
            <svg
              viewBox="0 0 24 24"
              className="size-[19px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="size-[19px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z" />
            </svg>
          )}
        </button>

        {/* Student profile */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <div className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-violet-100 bg-violet-100 text-sm font-bold text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300 sm:size-10">
            {image ? (
              <Image
                src={image}
                alt={`${name} profile photo`}
                fill
                sizes="40px"
                unoptimized
                className="object-cover"
              />
            ) : (
              initial
            )}
          </div>

<span className="hidden max-w-[150px] truncate text-sm font-bold text-slate-800 dark:text-slate-100 sm:block md:max-w-[180px]">
  {name || "Student"}
</span>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-100 bg-white px-2.5 text-rose-600 transition hover:border-rose-200 hover:bg-rose-50 dark:border-rose-900/50 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-950/30 sm:px-3.5"
          aria-label="Logout"
          title="Logout"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-[17px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 17l5-5-5-5M15 12H3" />
            <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
          </svg>
          <span className="hidden text-xs font-semibold sm:inline">
            Logout
          </span>
        </button>
      </div>
    </header>
  );
}
