
"use client";

import type { Section } from "../shared/types";
import Icon from "../shared/Icon";

type Props = {
  section: Section;
  mobileMenu: boolean;
  setSection: (section: Section) => void;
  setMobileMenu: (value: boolean) => void;
};

const menu: { label: Section; icon: string }[] = [
  { label: "Dashboard", icon: "home" },
  { label: "Students", icon: "students" },
  { label: "Classes & Batches", icon: "batches" },
  { label: "Attendance", icon: "attendance" },
  { label: "Fees", icon: "fees" },
  { label: "Tests & Results", icon: "exams" },
  { label: "Notices", icon: "notices" },
  { label: "Reports", icon: "reports" },
  { label: "Audit Logs", icon: "audit" },
  { label: "Settings", icon: "settings" },
];

export default function AdminSidebar({
  section,
  mobileMenu,
  setSection,
  setMobileMenu,
}: Props) {
  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-[min(18rem,85vw)] shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white p-4 transition-transform duration-300 dark:border-gray-800 dark:bg-gray-950 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:translate-x-0 ${
          mobileMenu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <a
          className="mb-8 flex shrink-0 items-center gap-3 px-2 py-3"
          href="#home"
          onClick={() => {
            setSection("Dashboard");
            setMobileMenu(false);
          }}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
            ✳
          </span>

          <span className="min-w-0">
            <strong className="block text-xl text-gray-900 dark:text-white">
              Udaan
            </strong>
            <small className="text-xs tracking-widest text-gray-500">
              LEARNING CENTRE
            </small>
          </span>
        </a>

        {/* Workspace Heading */}
        <div className="mb-3 flex shrink-0 items-center justify-between px-3 text-xs font-semibold tracking-wider text-gray-400">
          WORKSPACE
          <span>⌄</span>
        </div>

        {/* Navigation */}
        <nav
          className="flex min-h-0 flex-1 flex-col gap-1"
          aria-label="Admin navigation"
        >
          {menu.map((item) => {
            const active = section === item.label;

            return (
              <button
                key={item.label}
                type="button"
                aria-current={active ? "page" : undefined}
                className={`flex w-full shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900"
                }`}
                onClick={() => {
                  setSection(item.label);
                  setMobileMenu(false);
                }}
              >
                <span className="shrink-0">
                  <Icon>{item.icon}</Icon>
                </span>

                <span className="min-w-0 flex-1">
                  {item.label === "Classes & Batches"
                    ? "Batches"
                    : item.label === "Tests & Results"
                      ? "Exams"
                      : item.label}
                </span>

                {item.label === "Notices" && (
                  <i className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Label */}
        <div className="mt-6 shrink-0 border-t border-gray-200 px-3 pt-4 text-xs text-gray-400 dark:border-gray-800">
          Udaan Learning Centre
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileMenu && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileMenu(false)}
        />
      )}
    </>
  );
}
