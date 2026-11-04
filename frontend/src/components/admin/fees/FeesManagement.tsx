
"use client";

import { useCallback, useEffect, useState } from "react";

import FeeFilters from "./FeeFilters";
import FeeSummary from "./FeeSummary";
import FeeTable from "./FeeTable";
import PaymentModal from "./PaymentModal";
import ReceiptModal from "./ReceiptModal";

import {
  type BatchOption,
  type Details,
  type FeePayment,
  type FeeRow,
  type FeeSummaryData,
  MONTHS,
  money,
  inputClass,
  outlineButtonClass,
  primaryButtonClass,
} from "./feeTypes";

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function feeApi(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error ?? "Request failed. Please try again.");
  }

  return data;
}

export function FeesManagement({
  batches,
  onPaymentSaved,
}: {
  batches: BatchOption[];
  onPaymentSaved?: () => void;
}) {
  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [query, setQuery] = useState("");
  const [batchId, setBatchId] = useState("all");
  const [status, setStatus] = useState("all");

  const [rows, setRows] = useState<FeeRow[]>([]);

  const [summary, setSummary] = useState<FeeSummaryData>({
    totalExpected: 0,
    feesCollected: 0,
    totalDue: 0,
    studentsPaid: 0,
    studentsDue: 0,
  });

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [initialStudentId, setInitialStudentId] = useState("");

  const [detailStudentId, setDetailStudentId] = useState("");
  const [details, setDetails] = useState<Details | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const [receipt, setReceipt] = useState<FeePayment | null>(null);

  // Load monthly fee records
  const loadRows = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        year: String(year),
        month: String(month),
        page: String(page),
        limit: String(limit),
        q: query,
        batchId,
        status,
      });

      const result = await feeApi(`/fees?${params.toString()}`);

      setRows(result.students as FeeRow[]);
      setSummary(result.summary as FeeSummaryData);
      setPagination(result.pagination);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load fees.",
      );
    } finally {
      setLoading(false);
    }
  }, [year, month, page, limit, query, batchId, status]);

  // Debounced search and filters
  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        void loadRows();
      },
      query ? 250 : 0,
    );

    return () => window.clearTimeout(timer);
  }, [loadRows, query]);

  // Load selected student's fee details
  useEffect(() => {
    if (!detailStudentId) return;

    let live = true;

    void feeApi(
      `/fees/students/${detailStudentId}?year=${year}`,
    )
      .then((data) => {
        if (live) {
          setDetails(data as Details);
        }
      })
      .catch((caught) => {
        if (live) {
          setDetailsError(
            caught instanceof Error
              ? caught.message
              : "Could not load student fee details.",
          );
        }
      })
      .finally(() => {
        if (live) {
          setDetailsLoading(false);
        }
      });

    return () => {
      live = false;
    };
  }, [detailStudentId, year]);

  // Open student details
  const openDetails = (id: string) => {
    setDetails(null);
    setDetailsError("");
    setDetailsLoading(true);
    setDetailStudentId(id);
  };

  // Close student details
  const closeDetails = () => {
    setDetailStudentId("");
    setDetails(null);
    setDetailsError("");
    setDetailsLoading(false);
  };

  // Open payment modal
  const openPayment = (studentId = "") => {
    setDetailStudentId("");
    setInitialStudentId(studentId);
    setPaymentOpen(true);
    setNotice("");
    setError("");
  };

  // Load complete receipt details
  const openReceipt = async (paymentId: string) => {
    setError("");

    try {
      const result = await feeApi(`/fees/payments/${paymentId}`);
      setReceipt(result.payment as FeePayment);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load receipt.",
      );
    }
  };

  // Refresh data after successful payment
  const refreshAfterPayment = async () => {
    await loadRows();

    if (detailStudentId) {
      const data = await feeApi(
        `/fees/students/${detailStudentId}?year=${year}`,
      );

      setDetails(data as Details);
    }

    onPaymentSaved?.();
  };

  // Year dropdown options
  const yearOptions = Array.from(
  { length: 10 },
  (_, index) => now.getFullYear() - index,
);

  // Pagination
  const pageCount = Math.max(1, pagination.totalPages);

  const pageStart = Math.max(
    1,
    Math.min(page - 2, pageCount - 4),
  );

  const pageEnd = Math.min(pageCount, pageStart + 4);

  const detailLabelClass =
    "text-[11px] font-medium uppercase tracking-wide text-slate-500";

  const detailValueClass =
    "mt-1 break-words text-sm font-semibold text-slate-800";

  const closeButtonClass =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900";

  return (
    <section className="min-w-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Fees Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Track monthly fees, payments and outstanding balances
          </p>
        </div>

        <button
          type="button"
          className={primaryButtonClass}
          onClick={() => openPayment()}
        >
          ＋ Record Payment
        </button>
      </div>

      {/* Filters */}
      <FeeFilters
        year={year}
        month={month}
        yearOptions={yearOptions}
        batches={batches}
        query={query}
        batchId={batchId}
        status={status}
        onYearChange={(value) => {
          setYear(value);
          setPage(1);
        }}
        onMonthChange={(value) => {
          setMonth(value);
          setPage(1);
        }}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        onBatchChange={(value) => {
          setBatchId(value);
          setPage(1);
        }}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        onReset={() => {
          setQuery("");
          setBatchId("all");
          setStatus("all");
          setPage(1);
        }}
      />

      {/* Summary cards */}
      <FeeSummary summary={summary} />

      {/* Fee records table */}
      <FeeTable
        rows={rows}
        loading={loading}
        error={error}
        notice={notice}
        hasReceipt={Boolean(receipt)}
        query={query}
        month={month}
        page={page}
        limit={limit}
        pagination={pagination}
        pageStart={pageStart}
        pageEnd={pageEnd}
        onView={openDetails}
        onPayment={openPayment}
        onViewReceipt={() => {
          if (receipt) setReceipt(receipt);
        }}
        onDismissNotice={() => setNotice("")}
        onPageChange={setPage}
        onLimitChange={(value) => {
          setLimit(value);
          setPage(1);
        }}
      />

      {/* Payment modal */}
      {paymentOpen && (
        <PaymentModal
          initialStudentId={initialStudentId}
          onClose={() => setPaymentOpen(false)}
          onSaved={async (payment) => {
            setPaymentOpen(false);
            setNotice("Payment saved successfully.");

            await refreshAfterPayment();
            await openReceipt(payment._id);
          }}
        />
      )}

      {/* Student fee details modal */}
      {detailStudentId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-2 backdrop-blur-sm sm:p-5"
          onClick={closeDetails}
        >
          <section
            className="relative my-auto flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fee-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3 sm:px-6 sm:py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600 sm:text-xs">
                  Student Account
                </p>

                <h2
                  id="fee-details-title"
                  className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-2xl"
                >
                  Monthly fee details
                </h2>

                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                  Student fee account and payment history
                </p>
              </div>

              <button
                type="button"
                className={closeButtonClass}
                aria-label="Close student fee details"
                onClick={closeDetails}
              >
                ×
              </button>
            </div>

            {/* Modal body */}
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-4 sm:px-6 sm:py-5">
              {detailsLoading ? (
                <div className="flex min-h-64 flex-col items-center justify-center text-center">
                  <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
                  <p className="mt-4 text-sm font-medium text-slate-600">
                    Loading student fee history…
                  </p>
                </div>
              ) : detailsError ? (
                <div
                  className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
                  role="alert"
                >
                  <strong className="block font-semibold">
                    Unable to load fee details
                  </strong>

                  <p className="mt-1">{detailsError}</p>

                  <button
                    type="button"
                    className={`${outlineButtonClass} mt-3`}
                    onClick={() => openDetails(detailStudentId)}
                  >
                    Try again
                  </button>
                </div>
              ) : (
                details && (
                  <div className="space-y-5 sm:space-y-6">
                    {/* Student identity */}
                    <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white shadow-sm sm:h-14 sm:w-14 sm:text-xl">
                            {details.student.name.slice(0, 1).toUpperCase()}
                          </span>

                          <div className="min-w-0">
                            <h3 className="break-words text-base font-bold text-slate-900 sm:text-xl">
                              {details.student.name}
                            </h3>

                            <p className="mt-1 break-words text-xs text-slate-600 sm:text-sm">
                              {details.student.studentId ?? "Student"}{" "}
                              <span className="px-1 text-slate-400">·</span>
                              {details.student.phone}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-indigo-700 ring-1 ring-indigo-100">
                                {details.student.className || "Class not set"}
                              </span>

                              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
                                {details.student.batchId?.name || "Unassigned"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`${primaryButtonClass} w-full shrink-0 sm:w-auto`}
                          onClick={() => openPayment(details.student._id)}
                        >
                          + Record Payment
                        </button>
                      </div>
                    </section>

                    {/* Student information */}
                    <section>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                          Student information
                        </h3>

                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                          Profile details
                        </span>
                      </div>

                      <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
                          <dt className={detailLabelClass}>
                            Father&apos;s name
                          </dt>
                          <dd className={detailValueClass}>
                            {details.student.fatherName || "—"}
                          </dd>
                        </div>

                        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
                          <dt className={detailLabelClass}>
                            Phone number
                          </dt>
                          <dd className={detailValueClass}>
                            {details.student.phone || "—"}
                          </dd>
                        </div>

                        <div className="col-span-2 min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:col-span-1">
                          <dt className={detailLabelClass}>Address</dt>
                          <dd className={detailValueClass}>
                            {details.student.address || "—"}
                          </dd>
                        </div>
                      </dl>
                    </section>

                    {/* Fee summary */}
                    <section>
                      <h3 className="mb-3 text-sm font-bold text-slate-900 sm:text-base">
                        Fee summary
                      </h3>

                      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                        <div className="min-w-0 rounded-xl border border-indigo-100 bg-indigo-50 p-3 sm:p-4">
                          <span className="block text-[10px] font-medium leading-tight text-indigo-700 sm:text-xs">
                            Monthly fees
                          </span>

                          <strong className="mt-2 block break-words text-sm font-bold text-indigo-900 sm:text-xl">
                            {money(details.student.monthlyFees ?? 0)}
                          </strong>
                        </div>

                        <div className="min-w-0 rounded-xl border border-emerald-200 bg-emerald-50 p-3 sm:p-4">
                          <span className="block text-[10px] font-medium leading-tight text-emerald-700 sm:text-xs">
                            Total paid
                          </span>

                          <strong className="mt-2 block break-words text-sm font-bold text-emerald-800 sm:text-xl">
                            {money(details.totals.paidAmount)}
                          </strong>
                        </div>

                        <div className="min-w-0 rounded-xl border border-rose-200 bg-rose-50 p-3 sm:p-4">
                          <span className="block text-[10px] font-medium leading-tight text-rose-700 sm:text-xs">
                            Outstanding
                          </span>

                          <strong className="mt-2 block break-words text-sm font-bold text-rose-800 sm:text-xl">
                            {money(details.totals.dueAmount)}
                          </strong>
                        </div>
                      </div>
                    </section>

                    {/* Monthly records */}
                    <section>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                            Monthly records
                          </h3>

                          <p className="mt-0.5 text-xs text-slate-500">
                            Month-wise fee and payment status
                          </p>
                        </div>

                        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                          Year

                          <select
                            className={`${inputClass} w-[100px] py-2`}
                            aria-label="Student details year"
                            value={year}
                            onChange={(event) => {
                              setDetailsLoading(true);
                              setDetailsError("");
                              setYear(Number(event.target.value));
                            }}
                          >
                            {yearOptions.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                        {details.months.map((item) => (
                          <article
                            key={`${item.year}-${item.month}`}
                            className={`min-w-0 rounded-xl border p-3 sm:p-4 ${
                              item.status === "Due"
                                ? "border-rose-200 bg-rose-50/70"
                                : item.status === "Paid"
                                  ? "border-emerald-200 bg-emerald-50/70"
                                  : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1">
                              <strong className="text-xs font-bold text-slate-900 sm:text-sm">
                                {MONTHS[item.month - 1]}
                              </strong>

                              <span
                                className={`rounded-full px-2 py-1 text-[9px] font-bold sm:text-[10px] ${
                                  item.status === "Paid"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : item.status === "Due"
                                      ? "bg-rose-100 text-rose-700"
                                      : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>

                            <div className="mt-3 space-y-1.5">
                              <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs">
                                <span className="text-slate-500">Fee</span>
                                <b className="text-slate-800">
                                  {money(item.feeAmount)}
                                </b>
                              </div>

                              <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs">
                                <span className="text-slate-500">Paid</span>
                                <b className="text-emerald-700">
                                  {money(item.paidAmount)}
                                </b>
                              </div>

                              <div className="border-t border-slate-200/70 pt-2">
                                <span className="block text-[9px] font-medium uppercase tracking-wide text-slate-500">
                                  Remaining
                                </span>

                                <strong
                                  className={`mt-0.5 block break-words text-xs font-bold sm:text-sm ${
                                    item.remainingAmount > 0
                                      ? "text-rose-700"
                                      : "text-emerald-700"
                                  }`}
                                >
                                  {money(item.remainingAmount)}
                                </strong>
                              </div>
                            </div>
                          </article>
                        ))}

                        {!details.months.length && (
                          <div className="col-span-2 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 sm:col-span-3">
                            No monthly records available for this year.
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Payment history */}
                    <section>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                            Payment history
                          </h3>

                          <p className="mt-0.5 text-xs text-slate-500">
                            Previous payment transactions
                          </p>
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {details.payments.length}{" "}
                          {details.payments.length === 1
                            ? "Payment"
                            : "Payments"}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {details.payments.length ? (
                          details.payments.map((payment) => (
                            <article
                              key={payment._id}
                              className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:p-4"
                            >
                              <div className="flex min-w-0 flex-1 items-start gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                  ₹
                                </span>

                                <div className="min-w-0 flex-1">
                                  <strong className="block break-all text-sm font-bold text-slate-900">
                                    {payment.receiptNumber}
                                  </strong>

                                  <p className="mt-1 break-words text-xs text-slate-500">
                                    {new Date(
                                      `${payment.paymentDate}T12:00:00`,
                                    ).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                    {" · "}
                                    {payment.method}
                                  </p>

                                  {payment.referenceNumber && (
                                    <p className="mt-1 break-all text-[10px] text-slate-500">
                                      Ref: {payment.referenceNumber}
                                    </p>
                                  )}

                                  <p className="mt-1 break-words text-[10px] leading-relaxed text-slate-500">
                                    {payment.allocations
                                      .map(
                                        (allocation) =>
                                          `${MONTHS[allocation.month - 1]} ${allocation.year}: ${money(allocation.amount)}`,
                                      )
                                      .join(" · ")}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
                                <strong className="text-base font-bold text-emerald-700">
                                  {money(payment.amount)}
                                </strong>

                                <button
                                  type="button"
                                  className={`${outlineButtonClass} px-3 py-2 text-xs`}
                                  onClick={() => void openReceipt(payment._id)}
                                >
                                  View Receipt
                                </button>
                              </div>
                            </article>
                          ))
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                            <p className="text-sm font-semibold text-slate-700">
                              No payments recorded yet
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Payment transactions will appear here after a payment is recorded.
                            </p>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                )
              )}
            </div>

            {/* Modal footer */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3 sm:px-6">
              <p className="hidden text-xs text-slate-500 sm:block">
                Udaan Learning Centre · Student fee account
              </p>

              <div className="flex w-full justify-end gap-2 sm:w-auto">
                <button
                  type="button"
                  className={outlineButtonClass}
                  onClick={closeDetails}
                >
                  Close
                </button>

                {details && (
                  <button
                    type="button"
                    className={primaryButtonClass}
                    onClick={() => openPayment(details.student._id)}
                  >
                    + Record Payment
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Receipt modal */}
      {receipt && (
        <ReceiptModal
          payment={receipt}
          onClose={() => setReceipt(null)}
        />
      )}
    </section>
  );
}
