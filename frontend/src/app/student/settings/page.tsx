
"use client";

import PageHeader from "@/components/student/ui/PageHeader";
import SectionCard from "@/components/student/ui/SectionCard";
import ThemeToggle from "@/components/ThemeToggle";

export default function StudentSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your Student Portal preferences."
      />

      <SectionCard
        title="Appearance"
        description="Choose how your Student Portal looks."
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Theme Preference
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Switch between light and dark mode.
            </p>
          </div>

          <ThemeToggle />
        </div>
      </SectionCard>

      <SectionCard
        title="Account Security"
        description="Keep your student account secure."
      >
        <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Password Management
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            If you need to reset your password, please contact your Tuition
            Admin.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Account Information">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your account details are managed securely by the Tuition Admin.
        </p>
      </SectionCard>
    </div>
  );
}
