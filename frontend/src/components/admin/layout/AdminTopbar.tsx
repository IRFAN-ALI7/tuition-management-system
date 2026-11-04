
"use client";

import type { RefObject } from "react";
import NextImage from "next/image";
import type { AdminProfile, Section, Batch } from "../shared/types";

type Props = {
  section: Section;
  adminProfile: AdminProfile | null;
  search: string;
  setSearch: (value: string) => void;
  globalSearchRef: RefObject<HTMLInputElement | null>;
  setSection: (section: Section) => void;
  setMobileMenu: (value: boolean) => void;
  batches: Batch[];
  api: (path: string, init?: RequestInit) => Promise<unknown>;
  setStudentFilters: React.Dispatch<
    React.SetStateAction<{
      q: string;
      className: string;
      batchId: string;
      status: string;
      page: number;
      limit: number;
    }>
  >;
  onLogout: () => void;
};

export default function AdminTopbar({
  section,
  adminProfile,
  search,
  setSearch,
  globalSearchRef,
  setSection,
  setMobileMenu,
  batches,
  api,
  setStudentFilters,
  onLogout,
}: Props) {
  const handleSearch = async () => {
    const query = search.trim().toLowerCase();
    if (!query) return;

    try {
         const result = (await api(
  `/students?q=${encodeURIComponent(query)}&page=1&limit=20`
)) as {
  pagination?: {
    total?: number;
  };
};

if (result.pagination?.total) {
        setStudentFilters((current) => ({
          ...current,
          q: query,
          page: 1,
        }));

        setSection("Students");
      } else if (
        batches.some((batch) => batch.name.toLowerCase().includes(query))
      ) {
        setSection("Classes & Batches");
      }
    } catch {
      if (batches.some((batch) => batch.name.toLowerCase().includes(query))) {
        setSection("Classes & Batches");
      }
    }
  };

  return (
    <header className="sticky top-0 z-20 flex min-h-16 w-full items-center gap-2 border-b border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-950 sm:gap-3 sm:px-5 md:px-6">
      {/* Mobile menu button */}
      <button
        type="button"
        className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg transition hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
        aria-label="Open navigation"
        onClick={() => setMobileMenu(true)}
      >
        <span className="h-0.5 w-5 rounded-full bg-current" />
        <span className="h-0.5 w-5 rounded-full bg-current" />
        <span className="h-0.5 w-5 rounded-full bg-current" />
      </button>

      {/* Breadcrumb */}
      <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
        <span className="text-gray-500 dark:text-gray-400">Admin</span>
        <span className="text-gray-400">/</span>
        <strong className="truncate text-gray-900 dark:text-white">
          {section}
        </strong>
      </div>

      {/* Global Search */}
      <label className="ml-auto flex min-w-0 max-w-md flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:ring-blue-900/30">
        <svg
          viewBox="0 0 20 20"
          className="h-5 w-5 shrink-0 text-gray-400"
          aria-hidden="true"
        >
          <circle
            cx="8.5"
            cy="8.5"
            r="5.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="m13 13 4.5 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          />
        </svg>

        <input
          ref={globalSearchRef}
          className="min-w-0 w-full bg-transparent py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
          aria-label="Search students"
          placeholder="Search students..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void handleSearch();
          }}
        />

        <kbd className="hidden shrink-0 rounded-md bg-white px-2 py-1 text-xs text-gray-500 shadow-sm dark:bg-gray-800 sm:block">
          Ctrl K
        </kbd>
      </label>

      {/* Header Actions */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {/* Notifications */}
        <button
          type="button"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Notifications and notices"
          onClick={() => setSection("Notices")}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 13h4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Admin Profile */}
        <button
          type="button"
          className="flex min-w-0 items-center gap-2 rounded-xl p-1 transition hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Open admin profile"
          onClick={() => setSection("Profile")}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            {adminProfile?.image ? (
              <NextImage
                src={adminProfile.image}
                alt="Admin profile"
                width={48}
                height={48}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              adminProfile?.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() ?? "AD"
            )}
          </span>

          <span className="hidden min-w-0 text-left sm:block">
            <strong className="block max-w-28 truncate text-xs text-gray-900 dark:text-white">
              {adminProfile?.name ?? "Admin"}
            </strong>
            <small className="text-xs text-gray-500 dark:text-gray-400">
              Administrator
            </small>
          </span>

          <span className="hidden text-gray-400 sm:block">⌄</span>
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          className="shrink-0 rounded-lg border border-red-200 px-2.5 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 sm:px-3 sm:text-sm dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
