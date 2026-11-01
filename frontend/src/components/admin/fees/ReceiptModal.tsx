
"use client";

import {
  FeePayment,
  MONTHS,
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

export default function ReceiptModal({ payment, onClose }: Props) {
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

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <span className="text-slate-500">Receipt No.</span>
            <strong className="break-words text-right text-slate-900">
              {payment.receiptNumber}
            </strong>

            <span className="text-slate-500">Payment Date</span>
            <strong className="text-right text-slate-900">
              {payment.paymentDate}
            </strong>
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <strong className="block text-base text-slate-900">
              {payment.student?.name ?? "Student"}
            </strong>
            <span className="mt-1 block text-sm text-slate-500">
              {payment.student?.studentId ?? ""} ·{" "}
              {payment.student?.phone ?? ""}
            </span>
          </div>

          <div className="mt-6">
            <strong className="text-sm font-semibold text-slate-900">
              Fee allocation
            </strong>

            <div className="mt-2 divide-y divide-slate-200 border-y border-slate-200">
              {payment.allocations.map((allocation) => (
                <div
                  key={`${allocation.year}-${allocation.month}`}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="text-slate-600">
                    {MONTHS[allocation.month - 1]} {allocation.year}
                  </span>
                  <b className="text-slate-900">
                    {money(allocation.amount)}
                  </b>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-blue-50 p-4">
            <span className="text-sm font-medium text-blue-800">
              Amount received
            </span>
            <strong className="text-xl font-bold text-blue-800">
              {money(payment.amount)}
            </strong>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <span className="text-slate-500">Payment method</span>
            <strong className="text-right text-slate-900">
              {payment.method}
            </strong>

            {payment.referenceNumber && (
              <>
                <span className="text-slate-500">Reference</span>
                <strong className="break-words text-right text-slate-900">
                  {payment.referenceNumber}
                </strong>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Thank you. Please retain this receipt for your records.
          </p>
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
