"use client";

import StudentPager from "./StudentPager";

type Month = {
  year: number;
  month: number;
  feeAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
};

type Payment = {
  _id: string;
  receiptNumber: string;
  amount: number;
  paymentDate: string;
  method: string;
  referenceNumber: string;
  allocations: { year: number; month: number; amount: number }[];
};

type FeeData = {
  totals: { paidAmount: number; dueAmount: number };
  ledgerCount: number;
  months: Month[];
  payments: Payment[];
  paymentPagination: {
    page: number;
    total: number;
    totalPages: number;
  };
};

type Props = {
  fees: FeeData | null;
  filteredMonths: Month[];
  year: number;
  yearOptions: number[];
  feeMonth: string;
  paymentPage: number;
  sectionError: string;
  buttonClass: string;
  tableClass: string;
  tableWrapperClass: string;
  emptyClass: string;
  months: string[];
  money: (value: number) => string;
  date: (value?: string) => string;
  onYearChange: (value: number) => void;
  onMonthChange: (value: string) => void;
  onPaymentPageChange: (page: number) => void;
  onRetry: () => void;
  onOpenReceipt: (payment: Payment) => void;
};

export default function StudentFeesHistory({
  fees,
  filteredMonths,
  year,
  yearOptions,
  feeMonth,
  sectionError,
  buttonClass,
  tableClass,
  tableWrapperClass,
  emptyClass,
  months,
  money,
  date,
  onYearChange,
  onMonthChange,
  onPaymentPageChange,
  onRetry,
  onOpenReceipt,
}: Props) {
  return (
    <section className="min-w-0 space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Fees History
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monthly fee balances and transaction receipts
          </p>
        </div>

        <label className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
          Year
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            value={year}
            onChange={(event) => onYearChange(Number(event.target.value))}
          >
            {yearOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
            feeMonth === "all"
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
          }`}
          onClick={() => onMonthChange("all")}
        >
          All months
        </button>

        {months.map((item, index) => (
          <button
            key={item}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
              feeMonth === String(index + 1)
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
            }`}
            onClick={() => onMonthChange(String(index + 1))}
          >
            {item}
          </button>
        ))}
      </div>

      {sectionError && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
          role="alert"
        >
          {sectionError}
          <button className={buttonClass} onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

      <div className={tableWrapperClass}>
        <table className={tableClass}>
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              {["Month", "Fee amount", "Paid amount", "Remaining", "Status"].map(
                (heading) => (
                  <th className="px-4 py-3 font-semibold" key={heading}>
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredMonths.map((item) => (
              <tr
                className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                key={item.year + "-" + item.month}
              >
                <td className="whitespace-nowrap px-4 py-3 font-medium">
                  {months[item.month - 1]} {item.year}
                </td>

                <td className="whitespace-nowrap px-4 py-3">
                  {money(item.feeAmount)}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-emerald-600 dark:text-emerald-400">
                  {money(item.paidAmount)}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-rose-600 dark:text-rose-400">
                  {money(item.remainingAmount)}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold " +
                      (item.status === "Paid"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : item.status === "Due"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300")
                    }
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}

            {!filteredMonths.length && (
              <tr>
                <td colSpan={5} className={emptyClass}>
                  {fees?.ledgerCount
                    ? "No ledger rows for this period."
                    : "No fee ledger records are available."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Payment transactions
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Receipt, date, method, reference and fee allocation
          </p>
        </div>

        <strong className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
          {money(fees?.totals.paidAmount ?? 0)} total recorded
        </strong>
      </div>

      <div className={tableWrapperClass}>
        <table className={tableClass}>
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              {[
                "Payment date",
                "Receipt",
                "Method / Reference",
                "Allocation",
                "Amount",
                "Receipt",
              ].map((heading, index) => (
                <th
                  className="px-4 py-3 font-semibold"
                  key={heading + index}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {fees?.payments.map((item) => (
              <tr
                className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                key={item._id}
              >
                <td className="whitespace-nowrap px-4 py-3">
                  {date(item.paymentDate)}
                </td>

                <td className="px-4 py-3 font-semibold">
                  {item.receiptNumber}
                </td>

                <td className="px-4 py-3">
                  {item.method}
                  {item.referenceNumber ? " · " + item.referenceNumber : ""}
                </td>

                <td className="px-4 py-3">
                  {item.allocations
                    .map(
                      (allocation) =>
                        months[allocation.month - 1].slice(0, 3) +
                        " " +
                        allocation.year
                    )
                    .join(", ")}
                </td>

                <td className="whitespace-nowrap px-4 py-3 font-semibold">
                  {money(item.amount)}
                </td>

                <td className="px-4 py-3">
                  <button
                    className={`${buttonClass} whitespace-nowrap px-3 py-2 text-xs`}
                    onClick={() => onOpenReceipt(item)}
                  >
                    View / Print
                  </button>
                </td>
              </tr>
            ))}

            {!fees?.payments.length && (
              <tr>
                <td colSpan={6} className={emptyClass}>
                  No payment transactions recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {fees?.paymentPagination && (
        <StudentPager
          page={fees.paymentPagination.page}
          totalPages={fees.paymentPagination.totalPages}
          total={fees.paymentPagination.total}
          onChange={onPaymentPageChange}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Total amount paid
          </span>
          <strong className="mt-2 block text-xl font-bold text-emerald-700 dark:text-emerald-400">
            {money(fees?.totals.paidAmount ?? 0)}
          </strong>
        </div>

        <div className="rounded-xl bg-rose-50 p-4 dark:bg-rose-950/30">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Total outstanding
          </span>
          <strong className="mt-2 block text-xl font-bold text-rose-700 dark:text-rose-400">
            {money(fees?.totals.dueAmount ?? 0)}
          </strong>
        </div>
      </div>
    </section>
  );
}