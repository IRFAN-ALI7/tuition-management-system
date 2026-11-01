"use client";

export type ReceiptPayment = {
  _id: string;
  receiptNumber: string;
  amount: number;
  paymentDate: string;
  method: string;
  referenceNumber: string;
  allocations: {
    year: number;
    month: number;
    amount: number;
  }[];
};

type Props = {
  receipt: ReceiptPayment;
  studentName: string;
  studentId?: string;
  months: string[];
  money: (value: number) => string;
  date: (value?: string) => string;
  buttonClass: string;
  primaryButtonClass: string;
  onClose: () => void;
};

export default function StudentReceiptModal({
  receipt,
  studentName,
  studentId,
  months,
  money,
  date,
  buttonClass,
  primaryButtonClass,
  onClose,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="relative my-auto w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:p-8 print:bg-white print:text-black"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-receipt-title"
      >
        <button
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 print:hidden"
          onClick={onClose}
          aria-label="Close receipt"
        >
          ×
        </button>

        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white">
            ✳
          </span>

          <div>
            <strong className="block text-base font-bold text-slate-900 dark:text-white">
              Udaan Learning Centre
            </strong>
            <small className="text-xs text-slate-500 dark:text-slate-400">
              Fee payment receipt
            </small>
          </div>
        </div>

        <h2
          id="student-receipt-title"
          className="text-xl font-bold text-slate-900 dark:text-white"
        >
          Payment receipt
        </h2>

        <div className="mb-6 mt-3 rounded-xl bg-slate-50 p-3 text-center font-mono font-bold tracking-wider text-slate-800 dark:bg-slate-800 dark:text-white">
          {receipt.receiptNumber}
        </div>

        <dl className="divide-y divide-slate-100 dark:divide-slate-800">
          {[
            { label: "Student", value: studentName || "—" },
            { label: "Student ID", value: studentId || "—" },
            { label: "Payment date", value: date(receipt.paymentDate) },
            { label: "Payment method", value: receipt.method },
            { label: "Reference", value: receipt.referenceNumber || "—" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-start justify-between gap-4 py-3"
            >
              <dt className="text-sm text-slate-500 dark:text-slate-400">
                {item.label}
              </dt>

              <dd className="break-words text-right text-sm font-semibold text-slate-800 dark:text-slate-100">
                {item.value}
              </dd>
            </div>
          ))}

          <div className="flex items-center justify-between gap-4 py-4">
            <dt className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Amount received
            </dt>

            <dd className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {money(receipt.amount)}
            </dd>
          </div>
        </dl>

        <div className="mt-5 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
          <strong className="block text-sm text-slate-800 dark:text-slate-100">
            Allocated months
          </strong>

          {receipt.allocations.map((item) => (
            <div
              className="flex items-center justify-between gap-3 text-sm"
              key={item.year + "-" + item.month}
            >
              <span className="text-slate-600 dark:text-slate-300">
                {months[item.month - 1]} {item.year}
              </span>

              <b className="text-slate-900 dark:text-white">
                {money(item.amount)}
              </b>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3 print:hidden">
          <button className={buttonClass} onClick={onClose}>
            Close
          </button>

          <button
            className={primaryButtonClass}
            onClick={() => window.print()}
          >
            Print receipt
          </button>
        </div>
      </section>
    </div>
  );
}