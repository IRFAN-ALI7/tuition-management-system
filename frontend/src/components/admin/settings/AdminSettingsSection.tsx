
"use client";

import ThemeToggle from "@/components/ThemeToggle";

export default function AdminSettingsSection() {
  return (
    <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      <div className="mb-2 text-xs font-semibold tracking-wider text-blue-600">
        PREFERENCES
      </div>

      <h2 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
        Settings
      </h2>

      <p className="mb-6 mt-1 text-sm leading-6 text-gray-500">
        Personalize the Admin Dashboard appearance. This preference is saved
        for your admin account on this device.
      </p>

      <article className="flex min-w-0 flex-col gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <strong className="block text-sm text-gray-900 dark:text-white">
            Dark mode
          </strong>

          <small className="mt-1 block text-sm leading-5 text-gray-500">
            Use the dark Udaan theme across admin pages.
          </small>
        </div>

        <div className="flex shrink-0 items-center">
          <ThemeToggle />
        </div>
      </article>
    </section>
  );
}
