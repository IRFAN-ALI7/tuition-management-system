type IconProps = {
  children: string;
};

const paths: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-5v-6h-5v6h-5A1.5 1.5 0 0 1 3 19.5z",

  students:
    "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m8-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0m3 2a4 4 0 0 1 0 7m2 4v-2a4 4 0 0 0-3-3.87",

  batches:
    "M4 4h16v16H4zM8 2v4m8-4v4M4 9h16m-11 4h2m3 0h2m-7 4h2",

  attendance:
    "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",

  fees:
    "M12 2v20m6-16H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",

  exams:
    "M7 3h10l4 4v14H3V3zm10 0v5h4M7 13h10m-10 4h7",

  notices:
    "M4 11V8a2 2 0 0 1 2-2h10l5-3v18l-5-3H6a2 2 0 0 1-2-2v-3m4 5 2 5h4l-2-5",

  reports:
    "M4 20V12h4v8m4 0V5h4v15m4 0V9h4v11M2 21h21",

  audit:
    "M12 8v5l3 2m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0",

  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8m0-6v3m0 14v3m10-10h-3M5 12H2m17.07-7.07-2.12 2.12M7.05 16.95l-2.12 2.12m14.14 0-2.12-2.12M7.05 7.05 4.93 4.93",
};

export default function Icon({ children }: IconProps) {
  return (
    <span
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-full w-full"
      >
        <path d={paths[children] ?? paths.home} />
      </svg>
    </span>
  );
}