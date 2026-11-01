type Props = {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
};

export default function StudentPager({
  page,
  totalPages,
  total,
  onChange,
}: Props) {
  return (
    <footer className="flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
      <span>
        {total} records · Page {page} of {totalPages}
      </span>

      <div className="flex gap-2">
        <button
          className="rounded-lg border border-slate-200 px-3 py-2 font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </button>

        <button
          className="rounded-lg border border-slate-200 px-3 py-2 font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
      </div>
    </footer>
  );
}