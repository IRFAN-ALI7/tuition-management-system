
"use client";

import { useEffect } from "react";
import {
  type StudentFeePayment,
  money,
  MONTHS,
  formatFeeDate,
  formatFeeDateTime,
} from "@/types/student-fees";

interface Props {
  payment: StudentFeePayment | null;
  onClose: () => void;
}

export default function FeeReceiptModal({ payment, onClose }: Props) {
  useEffect(() => {
    if (!payment) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);

    return () => document.removeEventListener("keydown", handleEscape);
  }, [payment, onClose]);

  if (!payment) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <section
        className="my-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-receipt-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="fee-receipt-print">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet-700 text-xl font-extrabold text-white">
              U
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Udaan Learning Centre
              </h2>
              <p className="text-[10px] font-bold tracking-[0.16em] text-slate-500">
                OFFICIAL FEE PAYMENT RECEIPT
              </p>
            </div>
          </div>

          <div className="my-5 border-t-2 border-dashed border-slate-200" />

          <div className="text-center">
            <h3
              id="student-receipt-title"
              className="text-2xl font-extrabold text-slate-900"
            >
              Payment Receipt
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Payment confirmation
            </p>
            <p className="mt-3 text-sm font-extrabold text-violet-700">
              {payment.receiptNumber}
            </p>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Student Details
            </p>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-500">Student Name</p>
                <p className="mt-1 font-bold text-slate-900">
                  {payment.student?.name ?? "—"}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Student ID</p>
                <p className="mt-1 font-bold text-slate-900">
                  {payment.student?.studentId ?? "—"}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Father Name</p>
                <p className="mt-1 font-bold text-slate-900">
                  {payment.student?.fatherName ?? "—"}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Class</p>
                <p className="mt-1 font-bold text-slate-900">
                  {payment.student?.className ?? "—"}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Phone</p>
                <p className="mt-1 font-bold text-slate-900">
                  {payment.student?.phone ?? "—"}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Monthly Fee</p>
                <p className="mt-1 font-bold text-slate-900">
                  {money(payment.student?.monthlyFees)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Payment Information
            </p>

            <div className="divide-y divide-slate-100 border-y border-slate-200">
              {[
                ["Payment Date", formatFeeDate(payment.paymentDate)],
                [
                  "Recorded Date & Time",
                  formatFeeDateTime(payment.createdAt),
                ],
                ["Payment Method", payment.method],
                ["Reference Number", payment.referenceNumber || "—"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-2 gap-3 py-3 text-xs"
                >
                  <span className="text-slate-500">{label}</span>
                  <strong className="break-words text-right text-slate-900">
                    {value}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Month-wise Payment Allocation
            </p>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              {payment.allocations.map((allocation, index) => (
                <div
                  key={`${allocation.year}-${allocation.month}-${index}`}
                  className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-3 text-xs last:border-0"
                >
                  <span className="text-slate-600">
                    {MONTHS[allocation.month - 1]} {allocation.year}
                  </span>
                  <strong className="text-slate-900">
                    {money(allocation.amount)}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl bg-green-50 p-4">
            <div>
              <p className="text-xs font-bold text-green-800">
                Total Amount Received
              </p>
              <p className="mt-1 text-[10px] text-green-700">
                Payment recorded successfully
              </p>
            </div>

            <p className="text-xl font-extrabold text-green-700">
              {money(payment.amount)}
            </p>
          </div>

          {payment.receiptDetails && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[10px] text-slate-500">Total Paid</p>
                <p className="mt-1 text-sm font-bold text-green-700">
                  {money(payment.receiptDetails.totalPaid)}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[10px] text-slate-500">Remaining Due</p>
                <p className="mt-1 text-sm font-bold text-red-600">
                  {money(payment.receiptDetails.remainingDue)}
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-dashed border-slate-300 pt-4 text-center">
            <p className="text-xs font-semibold text-slate-700">
              Udaan Learning Centre
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Thank you for your payment.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse justify-end gap-2 border-t border-slate-200 pt-4 sm:flex-row print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-violet-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-800"
          >
            Print / Save as PDF
          </button>
        </div>
      </section>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }

          .fee-receipt-print,
          .fee-receipt-print * {
            visibility: visible !important;
          }

          .fee-receipt-print {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            padding: 12mm !important;
            color: #111827 !important;
            background: white !important;
          }

          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
