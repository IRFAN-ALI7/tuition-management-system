"use client";



import type { ReceiptPayment } from "./StudentReceiptModal";
type Payment = ReceiptPayment;

type ExamRecord = {
  examId: string;
  examDate: string;
  name: string;
  subject: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
};

type AttendanceRow = {
  _id: string;
  date: string;
  status: "present" | "absent";
  batch?: { name: string };
};

type UnpaidMonth = {
  year: number;
  month: number;
  remainingAmount: number;
};

type Props = {
  dueAmount: number;
  hasFeeLedger: boolean;
  unpaidMonths: UnpaidMonth[];
  recentPayments: Payment[];
  recentExams: ExamRecord[];
  recentAttendance: AttendanceRow[];
  feeError?: string;
  examError?: string;
  attendanceError?: string;
  money: (value: number) => string;
  date: (value?: string) => string;
  months: string[];
  emptyClass: string;
  statusClass: (active: boolean) => string;
  onViewFees: () => void;
  onViewExams: () => void;
  onViewAttendance: () => void;
  onOpenReceipt: (payment: Payment) => void;
};

export default function StudentOverview({
  dueAmount,
  hasFeeLedger,
  unpaidMonths,
  recentPayments,
  recentExams,
  recentAttendance,
  feeError,
  examError,
  attendanceError,
  money,
  date,
  months,
  emptyClass,
  statusClass,
  onViewFees,
  onViewExams,
  onViewAttendance,
  onOpenReceipt,
}: Props) {
  const panelClass =
    "min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6";

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <section className={`${panelClass} lg:col-span-2`}>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Current dues
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Outstanding monthly fee balance
            </p>
          </div>

          <strong className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {hasFeeLedger ? money(dueAmount) : "—"}
          </strong>
        </div>

        {unpaidMonths.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unpaidMonths
              .slice(-5)
              .reverse()
              .map((item) => (
                <div
                  key={item.year + "-" + item.month}
                  className="flex items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20"
                >
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {months[item.month - 1]} {item.year}
                  </span>
                  <b className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    {money(item.remainingAmount)}
                  </b>
                </div>
              ))}
          </div>
        ) : (
          <div className={emptyClass}>
            {hasFeeLedger
              ? "No outstanding fee balance."
              : "No fee ledger records are available."}
          </div>
        )}
      </section>

      <section className={panelClass}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Recent fee payments
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Latest recorded transactions
            </p>
          </div>

          <button
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
            onClick={onViewFees}
          >
            View history →
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentPayments.map((item) => (
            <div
              key={item._id}
              className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
            >
              <div className="min-w-0">
                <strong className="block break-all text-sm text-slate-800 dark:text-slate-100">
                  {item.receiptNumber}
                </strong>
                <small className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                  {date(item.paymentDate)} · {item.method}
                </small>
              </div>

              <div className="flex items-center gap-3">
                <b className="text-sm">{money(item.amount)}</b>
                <button
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                  onClick={() => onOpenReceipt(item)}
                >
                  Receipt
                </button>
              </div>
            </div>
          ))}

          {!recentPayments.length && (
            <div className={emptyClass}>
              {feeError || "No payment transactions recorded."}
            </div>
          )}
        </div>
      </section>

      <section className={panelClass}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Recent exam results
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Marks and percentages
            </p>
          </div>

          <button
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
            onClick={onViewExams}
          >
            View history →
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentExams.map((item) => (
            <div
              key={item.examId}
              className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
            >
              <div>
                <strong className="block text-sm text-slate-800 dark:text-slate-100">
                  {item.name || item.subject}
                </strong>
                <small className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                  {date(item.examDate)} · {item.subject}
                </small>
              </div>

              <b className="text-sm">
                {item.obtainedMarks} / {item.totalMarks} · {item.percentage}%
              </b>
            </div>
          ))}

          {!recentExams.length && (
            <div className={emptyClass}>
              {examError || "No exam results recorded."}
            </div>
          )}
        </div>
      </section>

      <section className={`${panelClass} lg:col-span-2`}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Recent attendance
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Latest marked classes
            </p>
          </div>

          <button
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
            onClick={onViewAttendance}
          >
            View history →
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentAttendance.map((item) => (
            <div
              key={item._id}
              className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
            >
              <div>
                <strong className="block text-sm text-slate-800 dark:text-slate-100">
                  {date(item.date)}
                </strong>
                <small className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                  {item.batch?.name || "Batch unavailable"}
                </small>
              </div>

              <span className={statusClass(item.status === "present")}>
                {item.status === "present" ? "Present" : "Absent"}
              </span>
            </div>
          ))}

          {!recentAttendance.length && (
            <div className={emptyClass}>
              {attendanceError || "No attendance records found."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}