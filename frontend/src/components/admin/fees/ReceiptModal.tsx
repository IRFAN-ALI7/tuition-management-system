
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  type FeePayment,
  money,
  outlineButtonClass,
  primaryButtonClass,
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const student = payment.student;
  const details = payment.receiptDetails;

  const receiptFields = [
    {
      label: "Receipt Number",
      value: payment.receiptNumber || "—",
    },
    {
      label: "Student Name",
      value: student?.name ?? "—",
    },
    {
      label: "Father Name",
      value: student?.fatherName ?? "—",
    },
    {
      label: "Class",
      value: student?.className ?? "—",
    },
    {
      label: "Admission Date",
      value: formatDate(student?.admissionDate),
    },
    {
      label: "Monthly Fees",
      value: money(student?.monthlyFees ?? 0),
    },
    {
      label: "Payment Amount",
      value: money(payment.amount),
    },
    {
      label: "Payment Method",
      value: payment.method || "—",
    },
    {
      label: "Reference Number",
      value: payment.referenceNumber || "—",
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
      value: formatDateTime(
        payment.actualPaymentDate ?? payment.createdAt,
      ),
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <section
        className="relative my-auto max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fee-receipt-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="print:hidden absolute right-4 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close receipt"
          onClick={onClose}
        >
          ×
        </button>

        <div className="fee-receipt-print">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-2xl text-white">
              ✳
            </span>

            <div className="min-w-0">
              <strong className="block text-lg font-bold text-slate-900">
                Udaan Learning Centre
              </strong>

              <small className="text-xs font-semibold tracking-[0.15em] text-slate-500">
                FEE PAYMENT RECEIPT
              </small>
            </div>
          </div>

          <div className="my-5 border-t-2 border-slate-200" />

          <div className="text-center">
            <h2
              id="fee-receipt-title"
              className="text-2xl font-bold text-slate-900"
            >
              Payment Receipt
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Official payment confirmation
            </p>
          </div>

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

          {payment.allocations.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-bold text-slate-800">
                Payment Allocation
              </h3>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                {payment.allocations.map((allocation, index) => (
                  <div
                    key={`${allocation.year}-${allocation.month}-${index}`}
                    className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-sm last:border-b-0"
                  >
                    <span className="text-slate-600">
                      {new Date(
                        allocation.year,
                        allocation.month - 1,
                      ).toLocaleDateString("en-IN", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>

                    <strong className="text-slate-900">
                      {money(allocation.amount)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-dashed border-slate-300 pt-4 text-center">
            <p className="text-xs font-medium text-slate-600">
              Thank you for your payment.
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Udaan Learning Centre
            </p>
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
            onClick={handlePrint}
          >
            <span aria-hidden="true">↓</span>
            Print / Save as PDF
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
