
"use client";

import {
  FeePayment,
  money,
  outlineButtonClass,
  primaryButtonClass,
  modalBackdropClass,
  modalClass,
} from "./feeTypes";

type Props = {
  payment: FeePayment;
  onClose: () => void;
};

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
function formatDateTime(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

export default function ReceiptModal({ payment, onClose }: Props) {
  const student = payment.student;
  const details = payment.receiptDetails;

  const receiptFields = [
    { label: "Student Name", value: student?.name ?? "—" },
    { label: "Father Name", value: student?.fatherName ?? "—" },
    { label: "Class", value: student?.className ?? "—" },
    {
      label: "Admission Date",
      value: formatDate(student?.admissionDate),
    },
    {
      label: "Monthly Fees",
      value: money(student?.monthlyFees ?? 0),
    },
    {
      label: "Total Due",
      value: money(details?.totalDue ?? 0),
    },
    {
      label: "Total Paid",
      value: money(details?.totalPaid ?? 0),
    },
    {
      label: "Remaining Due",
      value: money(details?.remainingDue ?? 0),
    },
    {
      label: "Payment Date",
      value: formatDateTime(payment.actualPaymentDate ?? payment.createdAt),
    },
  ];

  return (
    <div className={modalBackdropClass} onClick={onClose}>
      <section
        className={`${modalClass} max-w-xl`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fee-receipt-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="print:hidden absolute right-4 top-3 rounded-lg px-2 py-1 text-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close receipt"
          onClick={onClose}
        >
          ×
        </button>

        <div className="fee-receipt-print">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-2xl text-white">
              ✳
            </span>

            <div>
              <strong className="block text-lg font-bold text-slate-900">
                Udaan Learning Centre
              </strong>
              <small className="text-xs font-semibold tracking-[0.15em] text-slate-500">
                FEE PAYMENT RECEIPT
              </small>
            </div>
          </div>

          <div className="my-5 border-t-2 border-slate-200" />

          <h2
            id="fee-receipt-title"
            className="text-center text-2xl font-bold text-slate-900"
          >
            Payment Receipt
          </h2>

          <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
            {receiptFields.map((field) => (
              <div
                key={field.label}
                className="grid grid-cols-2 gap-3 py-3 text-sm"
              >
                <span className="text-slate-500">
                  {field.label}
                </span>

                <strong className="break-words text-right text-slate-900">
                  {field.value}
                </strong>
              </div>
            ))}
          </div>
        </div>

        <div className="print:hidden mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            className={outlineButtonClass}
            onClick={onClose}
          >
            Close
          </button>

          <button
            type="button"
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
