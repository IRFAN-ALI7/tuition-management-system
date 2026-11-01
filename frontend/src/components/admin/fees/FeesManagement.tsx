
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
  modalBackdropClass,
  modalClass,
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

  // Open payment modal
  const openPayment = (studentId = "") => {
    setDetailStudentId("");
    setInitialStudentId(studentId);
    setPaymentOpen(true);
    setNotice("");
    setError("");
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
    {
      length: Math.max(0, now.getFullYear() - 1999),
    },
    (_, index) => now.getFullYear() - index,
  );

  // Pagination
  const pageCount = Math.max(1, pagination.totalPages);

  const pageStart = Math.max(
    1,
    Math.min(page - 2, pageCount - 4),
  );

  const pageEnd = Math.min(pageCount, pageStart + 4);

  return (
    <section className="space-y-6">
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
            setReceipt(payment);
            setNotice("Payment saved successfully.");

            await refreshAfterPayment();
          }}
        />
      )}

      {/* Student fee details modal */}
      {detailStudentId && (
        <div
          className={modalBackdropClass}
          onClick={() => setDetailStudentId("")}
        >
          <section
            className={`${modalClass} max-w-5xl`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="fee-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-3 rounded-lg px-2 py-1 text-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close student fee details"
              onClick={() => setDetailStudentId("")}
            >
              ×
            </button>

            <div className="text-xs font-bold tracking-[0.18em] text-blue-600">
              STUDENT ACCOUNT
            </div>

            <h2
              id="fee-details-title"
              className="mt-2 text-2xl font-bold text-slate-900"
            >
              Monthly fee details
            </h2>

            {detailsLoading ? (
              <div className="py-10 text-center text-slate-500">
                Loading student fee history…
              </div>
            ) : detailsError ? (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {detailsError}
              </div>
            ) : (
              details && (
                <>
                  {/* Student information */}
                  <div className="mt-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                      {details.student.name.slice(0, 1).toUpperCase()}
                    </span>

                    <div className="min-w-0 flex-1">
                      <strong className="block text-lg font-semibold text-slate-900">
                        {details.student.name}
                      </strong>

                      <small className="mt-1 block break-words text-sm text-slate-500">
                        {details.student.studentId ?? "Student"} ·{" "}
                        {details.student.phone} ·{" "}
                        {details.student.className || "Class not set"}
                      </small>
                    </div>

                    <button
                      type="button"
                      className={outlineButtonClass}
                      onClick={() => openPayment(details.student._id)}
                    >
                      Record payment
                    </button>
                  </div>

                  {/* Additional student details */}
                  <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <dt className="text-xs font-medium text-slate-500">
                        Father's name
                      </dt>

                      <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
                        {details.student.fatherName || "—"}
                      </dd>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3">
                      <dt className="text-xs font-medium text-slate-500">
                        Batch
                      </dt>

                      <dd className="mt-1 text-sm font-semibold text-slate-800">
                        {details.student.batchId?.name || "Unassigned"}
                      </dd>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3">
                      <dt className="text-xs font-medium text-slate-500">
                        Address
                      </dt>

                      <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
                        {details.student.address || "—"}
                      </dd>
                    </div>
                  </dl>

                  {/* Fee summary */}
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <small className="text-sm text-slate-500">
                        Monthly fees
                      </small>

                      <strong className="mt-1 block text-xl font-bold text-slate-900">
                        {money(details.student.monthlyFees ?? 0)}
                      </strong>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <small className="text-sm text-emerald-700">
                        Total paid
                      </small>

                      <strong className="mt-1 block text-xl font-bold text-emerald-800">
                        {money(details.totals.paidAmount)}
                      </strong>
                    </div>

                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                      <small className="text-sm text-rose-700">
                        Outstanding
                      </small>

                      <strong className="mt-1 block text-xl font-bold text-rose-800">
                        {money(details.totals.dueAmount)}
                      </strong>
                    </div>
                  </div>

                  {/* Monthly records */}
                  <div className="mt-6 flex items-center justify-between gap-3">
                    <strong className="text-base font-semibold text-slate-900">
                      Monthly records
                    </strong>

                    <select
                      className={`${inputClass} w-auto`}
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
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {details.months.map((item) => (
                      <article
                        key={`${item.year}-${item.month}`}
                        className={`rounded-xl border p-4 ${
                          item.status === "Due"
                            ? "border-rose-200 bg-rose-50/60"
                            : item.status === "Paid"
                              ? "border-emerald-200 bg-emerald-50/60"
                              : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-sm text-slate-900">
                            {MONTHS[item.month - 1]}
                          </strong>

                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              item.status === "Paid"
                                ? "bg-emerald-100 text-emerald-700"
                                : item.status === "Due"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <small className="mt-3 block text-xs text-slate-600">
                          Fee {money(item.feeAmount)} · Paid{" "}
                          {money(item.paidAmount)}
                        </small>

                        <b className="mt-2 block text-sm text-slate-900">
                          Remaining {money(item.remainingAmount)}
                        </b>
                      </article>
                    ))}
                  </div>

                  {/* Payment history */}
                  <div className="mt-7 flex items-center justify-between gap-3">
                    <strong className="text-base font-semibold text-slate-900">
                      Payment history
                    </strong>

                    <span className="text-sm text-slate-500">
                      {details.payments.length} payment
                      {details.payments.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="mt-3 space-y-3">
                    {details.payments.length ? (
                      details.payments.map((payment) => (
                        <article
                          key={payment._id}
                          className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"
                        >
                          <div className="min-w-0 flex-1">
                            <strong className="block text-sm font-semibold text-slate-900">
                              {payment.receiptNumber}
                            </strong>

                            <small className="mt-1 block text-xs text-slate-500">
                              {new Date(
                                `${payment.paymentDate}T12:00:00`,
                              ).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}{" "}
                              · {payment.method}
                              {payment.referenceNumber
                                ? ` · Ref ${payment.referenceNumber}`
                                : ""}
                            </small>

                            <small className="mt-1 block break-words text-xs text-slate-500">
                              {payment.allocations
                                .map(
                                  (allocation) =>
                                    `${MONTHS[allocation.month - 1]} ${allocation.year}: ${money(allocation.amount)}`,
                                )
                                .join(" · ")}
                            </small>
                          </div>

                          <b className="text-base font-bold text-slate-900">
                            {money(payment.amount)}
                          </b>

                          <button
                            type="button"
                            className={outlineButtonClass}
                            onClick={() => setReceipt(payment)}
                          >
                            Receipt
                          </button>
                        </article>
                      ))
                    ) : (
                      <div className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                        No payments recorded yet.
                      </div>
                    )}
                  </div>
                </>
              )
            )}
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
