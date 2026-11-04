
"use client";

import { useEffect } from "react";
import {
  Download,
  Printer,
  X,
} from "lucide-react";

import {
  FEE_MONTHS,
  formatFeeDate,
  formatMoney,
  type StudentReceipt,
} from "@/types/student-fees";

interface Props {
  receipt: StudentReceipt;
  onClose: () => void;
}

export default function FeeReceiptModal({
  receipt,
  onClose,
}: Props) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  function handlePrint() {
    window.print();
  }

  const student = receipt.student;
  const details = receipt.receiptDetails;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-receipt-title"
        className="relative my-auto max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:p-7"
      >
        <div className="receipt-print-area">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet-600 text-xl font-black text-white">
                U
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Udaan Learning Centre
                </h2>
                <p className="text-[10px] font-bold tracking-[0.15em] text-violet-600 dark:text-violet-400">
                  FEE PAYMENT RECEIPT
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="receipt-hide grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close receipt"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="my-5 border-t-2 border-dashed border-slate-200 dark:border-slate-700" />

          <div className="text-center">
            <h3
              id="student-receipt-title"
              className="text-2xl font-extrabold text-slate-900 dark:text-white"
            >
              Payment Receipt
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Official payment confirmation
            </p>
          </div>

          <div className="mt-5 rounded-xl bg-violet-50 p-4 text-center dark:bg-violet-950/30">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
              Amount Received
            </p>
            <p className="mt-1 text-3xl font-extrabold text-violet-800 dark:text-violet-200">
              {formatMoney(receipt.amount)}
            </p>
            <p className="mt-1 break-all text-[10px] font-semibold text-violet-600 dark:text-violet-400">
              {receipt.receiptNumber}
            </p>
          </div>

          <div className="mt-5">
            <h4 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Student Information
            </h4>

            <div className="grid grid-cols-2 gap-2">
              {[
                ["Student Name", student.name],
                ["Student ID", student.studentId || "—"],
                ["Father's Name", student.fatherName || "—"],
                ["Class", student.className || "—"],
                ["Mobile", student.phone || "—"],
                ["Admission Date", formatFeeDate(student.admissionDate)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="min-w-0 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                >
                  <p className="text-[9px] text-slate-500 dark:text-slate-400">
                    {label}
                  </p>
                  <p className="mt-1 break-words text-xs font-bold text-slate-800 dark:text-slate-200">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <h4 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Payment Information
            </h4>

            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-3 dark:divide-slate-800 dark:border-slate-700">
              {[
                ["Receipt Number", receipt.receiptNumber],
                ["Payment Date", formatFeeDate(receipt.paymentDate)],
                ["Payment Method", receipt.method],
                ["Reference Number", receipt.referenceNumber || "—"],
                ["Monthly Fee", formatMoney(student.monthlyFees)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-3 py-3 text-xs"
                >
                  <span className="text-slate-500 dark:text-slate-400">
                    {label}
                  </span>
                  <strong className="max-w-[60%] break-words text-right text-slate-800 dark:text-slate-200">
                    {value}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <h4 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Payment Allocation
            </h4>

            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              {receipt.allocations.map((allocation, index) => (
                <div
                  key={`${allocation.year}-${allocation.month}-${index}`}
                  className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-3 text-xs last:border-0 dark:border-slate-800"
                >
                  <span className="text-slate-600 dark:text-slate-300">
                    {FEE_MONTHS[allocation.month - 1]} {allocation.year}
                  </span>
                  <strong className="text-slate-900 dark:text-white">
                    {formatMoney(allocation.amount)}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <h4 className="mb-2 text-xs font-extrabold text-slate-700 dark:text-slate-200">
              Account Summary
            </h4>

            {[
              ["Total Fee Ledger", details.totalDue],
              ["Total Paid", details.totalPaid],
              ["Remaining Due", details.remainingDue],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between gap-3 py-1.5 text-xs"
              >
                <span className="text-slate-500 dark:text-slate-400">
                  {label}
                </span>
                <strong className="text-slate-800 dark:text-slate-200">
                  {formatMoney(Number(value))}
                </strong>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-dashed border-slate-300 pt-4 text-center dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Thank you for your payment.
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Udaan Learning Centre
            </p>
          </div>
        </div>

        <div className="receipt-hide mt-5 flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 dark:border-slate-700 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700"
          >
            <Download className="h-4 w-4" />
            Print / Save as PDF
          </button>
        </div>
      </section>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }

          .receipt-print-area,
          .receipt-print-area * {
            visibility: visible !important;
          }

          .receipt-print-area {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            padding: 24px !important;
            background: white !important;
            color: #0f172a !important;
          }

          .receipt-hide {
            display: none !important;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>
    </div>
  );
}
