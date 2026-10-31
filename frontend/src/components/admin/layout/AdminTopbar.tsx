
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
  api: (path: string, init?: RequestInit) => Promise<any>;
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
      const result = await api(
        `/students?q=${encodeURIComponent(query)}&page=1&limit=20`
      );

      if (result.pagination.total) {
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
    <header className="sticky top-0 z-20 flex min-h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-950 md:px-6">
      <button
        className="flex flex-col gap-1.5 lg:hidden"
        aria-label="Open navigation"
        onClick={() => setMobileMenu(true)}
      >
        <i className="h-0.5 w-5 bg-current" />
        <i className="h-0.5 w-5 bg-current" />
        <i className="h-0.5 w-5 bg-current" />
      </button>

      <div className="hidden items-center gap-2 text-sm sm:flex">
        <span className="text-gray-500">Admin</span>
        <b className="text-gray-400">/</b>
        <strong>{section}</strong>
      </div>

      <label className="ml-auto flex max-w-md flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 dark:border-gray-700">
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
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"
          aria-label="Search students"
          placeholder="Search students..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void handleSearch();
          }}
        />

        <kbd className="hidden rounded bg-gray-100 px-2 py-1 text-xs text-gray-500 dark:bg-gray-800 sm:block">
          Ctrl K
        </kbd>
      </label>

      <div className="flex items-center gap-3">
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Notifications and notices"
          onClick={() => setSection("Notices")}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 13h4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <i className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <button
          className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => setSection("Profile")}
        >
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-xs font-semibold dark:bg-gray-800">
            {adminProfile?.image ? (
              <NextImage
                src={adminProfile.image}
                alt=""
                width={48}
                height={48}
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

          <span className="hidden text-left sm:block">
            <strong className="block text-xs">
              {adminProfile?.name ?? "Admin"}
            </strong>
            <small className="text-xs text-gray-500">Administrator</small>
          </span>

          <b className="hidden text-gray-400 sm:block">⌄</b>
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
