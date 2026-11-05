
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "Dashboard", href: "/student", icon: "grid" },
  { label: "My Profile", href: "/student/profile", icon: "user" },
  { label: "My Batch", href: "/student/batch", icon: "book" },
  { label: "Attendance", href: "/student/attendance", icon: "calendar" },
  { label: "Fees", href: "/student/fees", icon: "wallet" },
  { label: "Exams & Results", href: "/student/exams", icon: "award" },
  { label: "Notices", href: "/student/notices", icon: "bell" },
];

function NavIcon({ name }: { name: string }) {
  const common = {
    className: "size-[19px] shrink-0",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "grid":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );

    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );

    case "book":
      return (
        <svg {...common}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
          <path d="M4 17a2.5 2.5 0 0 1 2.5-2.5H20M8 7h8" />
        </svg>
      );

    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
        </svg>
      );

    case "wallet":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="15" rx="2" />
          <path d="M3 9h18M16 14h2M6 5V3h12v2" />
        </svg>
      );

    case "award":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="5" />
          <path d="m8.5 12-1 9 4.5-2.5 4.5 2.5-1-9" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
        </svg>
      );
  }
}

interface StudentSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function StudentSidebar({
  open,
  onClose,
}: StudentSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[3px] lg:hidden"
        />
      )}

      <aside
        aria-label="Student navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(88vw,288px)] flex-col border-r border-violet-100/80 bg-white shadow-xl transition-transform duration-300 ease-out dark:border-slate-800 dark:bg-slate-950 dark:shadow-none lg:w-72 lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-[82px] shrink-0 items-center gap-3 border-b border-slate-100 px-5 dark:border-slate-800">
          <div className="grid size-11 shrink-0 place-items-center rounded-[15px] bg-gradient-to-br from-violet-600 to-indigo-600 text-2xl text-white shadow-lg shadow-violet-500/20">
            ✳
          </div>

          <div className="min-w-0">
            <p className="text-[23px] font-extrabold leading-none tracking-tight text-slate-950 dark:text-white">
              Udaan
            </p>
            <p className="mt-1.5 text-[9px] font-bold tracking-[2.2px] text-violet-600 dark:text-violet-400">
              LEARNING CENTRE
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto grid size-9 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="m18 6-12 12M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation heading */}
        <div className="px-5 pb-3 pt-7">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[1.7px] text-slate-400">
            Student workspace
          </p>
        </div>

        {/* Navigation links */}
        <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-4 pb-5">
          {navigation.map((item) => {
            const active =
              item.href === "/student"
                ? pathname === "/student"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`group relative flex min-h-[48px] items-center gap-3 rounded-xl px-3.5 text-[13px] font-semibold transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-md shadow-violet-500/20"
                    : "text-slate-600 hover:bg-violet-50 hover:text-violet-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-violet-300"
                }`}
              >
                <NavIcon name={item.icon} />

                <span className="flex-1">{item.label}</span>

                {active && (
                  <span className="size-1.5 rounded-full bg-white shadow-sm" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100 p-5 dark:border-slate-800">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 p-4 dark:from-slate-900 dark:to-slate-800">
            <div className="pointer-events-none absolute -right-5 -top-7 size-20 rounded-full bg-violet-200/40 blur-2xl dark:bg-violet-500/10" />

            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-lg bg-white text-violet-600 shadow-sm dark:bg-slate-700 dark:text-violet-300">
                  ✦
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Keep learning!
                </p>
              </div>

              <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                Every small step takes you closer to your goals.
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-[10px] text-slate-400">
            © Udaan Learning Centre
          </p>
        </div>
      </aside>
    </>
  );
}
