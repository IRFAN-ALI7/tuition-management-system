"use client";

import ThemeToggle from "@/components/ThemeToggle";

export default function AdminSettingsSection() {
  return (
    <section className="mx-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Customize your admin workspace appearance.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-700 dark:bg-gray-800/60">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Appearance
          </h2>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Switch between light and dark theme.
          </p>
        </div>

        <div className="shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </section>
  );
}