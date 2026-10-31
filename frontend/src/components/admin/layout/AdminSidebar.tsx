
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
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white p-4 transition-transform dark:border-gray-800 dark:bg-gray-950 lg:static lg:translate-x-0 ${
          mobileMenu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <a
          className="mb-8 flex items-center gap-3 px-2 py-3"
          href="#home"
          onClick={() => setSection("Dashboard")}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
            ✳
          </span>

          <span>
            <strong className="block text-xl">Udaan</strong>
            <small className="text-xs tracking-widest text-gray-500">
              LEARNING CENTRE
            </small>
          </span>
        </a>

        <div className="mb-3 flex items-center justify-between px-3 text-xs font-semibold tracking-wider text-gray-400">
          WORKSPACE
          <span>⌄</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1" aria-label="Admin navigation">
          {menu.map((item) => (
            <button
              key={item.label}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-colors ${
                section === item.label
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900"
              }`}
              onClick={() => {
                setSection(item.label);
                setMobileMenu(false);
              }}
            >
              <Icon>{item.icon}</Icon>

              {item.label === "Classes & Batches"
                ? "Batches"
                : item.label === "Tests & Results"
                  ? "Exams"
                  : item.label}

              {item.label === "Notices" && (
                <i className="ml-auto h-2 w-2 rounded-full bg-orange-500" />
              )}
            </button>
          ))}
        </nav>
      </aside>

      {mobileMenu && (
        <button
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileMenu(false)}
        />
      )}
    </>
  );
}
