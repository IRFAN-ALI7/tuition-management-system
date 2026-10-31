"use client";

import ThemeToggle from "@/components/ThemeToggle";

export default function AdminSettingsSection() {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-2 text-xs font-semibold tracking-wider text-blue-600">
        PREFERENCES
      </div>

      <h2 className="text-xl font-bold">Settings</h2>

      <p className="mb-6 mt-1 text-sm text-gray-500">
        Personalize the Admin Dashboard appearance. This preference is saved
        for your admin account on this device.
      </p>

      <article className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <div>
          <strong className="block text-sm">Dark mode</strong>
          <small className="text-sm text-gray-500">
            Use the dark Udaan theme across admin pages.
          </small>
        </div>

        <ThemeToggle />
      </article>
    </section>
  );
}