"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

type BatchOption = { _id: string; name: string };

type FeeStudent = {
  _id: string;
  studentId?: string;
  name: string;
  phone: string;
  className?: string;
  monthlyFees?: number | null;
  active?: boolean;
};

type FeeRow = {
  _id: string;
  student: FeeStudent;
  batch?: BatchOption;
  year: number;
  month: number;
  feeAmount: number;
  paidAmount: number;
  remainingAmount: number;
  totalDueAmount: number;
  status: "paid" | "due";
};

type FeeSummary = {
  totalExpected: number;
  feesCollected: number;
  totalDue: number;
  studentsPaid: number;
  studentsDue: number;
};

type FeeAllocation = { year: number; month: number; amount: number };

type FeePayment = {
  _id: string;
  receiptNumber: string;
  studentId: string;
  student?: FeeStudent;
  amount: number;
  paymentDate: string;
  method: string;
  referenceNumber: string;
  allocations: FeeAllocation[];
  createdAt?: string;
};

type UnpaidMonth = FeeAllocation & {
  feeAmount: number;
  paidAmount: number;
  remainingAmount: number;
};

type Details = {
  student: FeeStudent & {
    fatherName?: string;
    address?: string;
    className?: string;
    batchId?: BatchOption | null;
  };
  year: number;
  months: {
    year: number;
    month: number;
    feeAmount: number;
    paidAmount: number;
    remainingAmount: number;
    status: string;
  }[];
  unpaidMonths: UnpaidMonth[];
  totals: { paidAmount: number; dueAmount: number };
  payments: FeePayment[];
};

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const money = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
};

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

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const outlineButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

const modalBackdropClass =
  "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-6";

const modalClass =
  "relative my-auto max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7";

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
  const [summary, setSummary] = useState<FeeSummary>({
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
      setSummary(result.summary as FeeSummary);
      setPagination(result.pagination);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load fees.",
      );
    } finally {
      setLoading(false);
    }
  }, [year, month, page, limit, query, batchId, status]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        void loadRows();
      },
      query ? 250 : 0,
    );

    return () => window.clearTimeout(timer);
  }, [loadRows, query]);

  useEffect(() => {
    if (!detailStudentId) return;

    let live = true;

    void feeApi(`/fees/students/${detailStudentId}?year=${year}`)
      .then((data) => {
        if (live) setDetails(data as Details);
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
        if (live) setDetailsLoading(false);
      });

    return () => {
      live = false;
    };
  }, [detailStudentId, year]);

  const openDetails = (id: string) => {
    setDetails(null);
    setDetailsError("");
    setDetailsLoading(true);
    setDetailStudentId(id);
  };

  const openPayment = (studentId = "") => {
    setDetailStudentId("");
    setInitialStudentId(studentId);
    setPaymentOpen(true);
    setNotice("");
    setError("");
  };

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

  const yearOptions = Array.from(
    { length: Math.max(0, now.getFullYear() - 1999) },
    (_, index) => now.getFullYear() - index,
  );

  const pageCount = Math.max(1, pagination.totalPages);
  const pageStart = Math.max(1, Math.min(page - 2, pageCount - 4));
  const pageEnd = Math.min(pageCount, pageStart + 4);

  return (
    <section className="space-y-6">
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
          className={primaryButtonClass}
          onClick={() => openPayment()}
        >
          ＋ Record Payment
        </button>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <label className="flex max-w-40 flex-col gap-1.5 text-sm font-medium text-slate-700">
          Year
          <select
            className={inputClass}
            value={year}
            onChange={(event) => {
              setYear(Number(event.target.value));
              setPage(1);
            }}
          >
            {yearOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <div
          className="flex gap-2 overflow-x-auto pb-2"
          role="tablist"
          aria-label="Fee month"
        >
          {MONTHS.map((name, index) => (
            <button
              type="button"
              role="tab"
              aria-selected={month === index + 1}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition ${
                month === index + 1
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              key={name}
              onClick={() => {
                setMonth(index + 1);
                setPage(1);
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Total Fees Expected",
            value: money(summary.totalExpected),
            icon: "₹",
            color: "border-blue-200 bg-blue-50 text-blue-700",
          },
          {
            label: "Fees Collected",
            value: money(summary.feesCollected),
            icon: "✓",
            color: "border-emerald-200 bg-emerald-50 text-emerald-700",
          },
          {
            label: "Total Remaining / Due",
            value: money(summary.totalDue),
            icon: "↘",
            color: "border-amber-200 bg-amber-50 text-amber-700",
          },
          {
            label: "Students Paid",
            value: summary.studentsPaid.toLocaleString("en-IN"),
            icon: "●",
            color: "border-indigo-200 bg-indigo-50 text-indigo-700",
          },
          {
            label: "Students Due",
            value: summary.studentsDue.toLocaleString("en-IN"),
            icon: "!",
            color: "border-rose-200 bg-rose-50 text-rose-700",
          },
        ].map((item) => (
          <article
            key={item.label}
            className={`flex min-w-0 items-start gap-3 rounded-xl border p-4 ${item.color}`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/80 text-lg font-bold">
              {item.icon}
            </span>
            <div className="min-w-0">
              <small className="block text-xs font-medium opacity-80">
                {item.label}
              </small>
              <strong className="mt-1 block break-words text-lg font-bold">
                {item.value}
              </strong>
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row">
        <label className="relative flex-1">
          <span
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-slate-400"
          >
            ⌕
          </span>
          <input
            className={`${inputClass} pl-10`}
            aria-label="Search student by name or ID"
            placeholder="Search by student name or ID…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </label>

        <select
          className={`${inputClass} lg:w-48`}
          aria-label="Filter by batch"
          value={batchId}
          onChange={(event) => {
            setBatchId(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Batches</option>
          {batches.map((batch) => (
            <option key={batch._id} value={batch._id}>
              {batch.name}
            </option>
          ))}
        </select>

        <select
          className={`${inputClass} lg:w-40`}
          aria-label="Filter by fee status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="due">Due</option>
        </select>

        <button
          className={outlineButtonClass}
          onClick={() => {
            setQuery("");
            setBatchId("all");
            setStatus("all");
            setPage(1);
          }}
        >
          Reset
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {error && (
          <div
            className="m-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            className="m-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
            role="status"
          >
            <span>{notice}</span>
            <div className="flex items-center gap-3">
              {receipt && (
                <button
                  className="font-semibold underline"
                  onClick={() => setReceipt(receipt)}
                >
                  View / Print receipt
                </button>
              )}
              <button
                aria-label="Dismiss message"
                className="text-lg"
                onClick={() => setNotice("")}
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {[
                  "Student ID",
                  "Student Name",
                  "Batch",
                  "Monthly Fees",
                  `${MONTHS[month - 1]} Paid`,
                  "Total Due",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap border-b border-slate-200 px-4 py-3 font-semibold"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-slate-500"
                    colSpan={8}
                  >
                    Loading fees…
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row._id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                      {row.student.studentId ??
                        `STU${row.student._id.slice(-6).toUpperCase()}`}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {row.student.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.batch?.name ?? (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {money(row.feeAmount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {money(row.paidAmount)}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 font-semibold ${
                        row.totalDueAmount
                          ? "text-rose-600"
                          : "text-slate-700"
                      }`}
                    >
                      {money(row.totalDueAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          row.status === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {row.status === "paid" ? "Paid" : "Due"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          onClick={() => openDetails(row.student._id)}
                        >
                          View
                        </button>
                        <button
                          className="whitespace-nowrap rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                          onClick={() => openPayment(row.student._id)}
                        >
                          Record Payment
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-slate-500"
                    colSpan={8}
                  >
                    {query
                      ? "No students match this search."
                      : "No monthly fee records found for this month."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col gap-4 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-slate-500">
            Showing {pagination.total ? (page - 1) * limit + 1 : 0}–
            {Math.min(page * limit, pagination.total)} of{" "}
            {pagination.total.toLocaleString("en-IN")} students
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Rows per page
              <select
                className="rounded-md border border-slate-300 bg-white px-2 py-1.5"
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>

            <button
              className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 disabled:opacity-40"
              disabled={page <= 1 || loading}
              aria-label="Previous page"
              onClick={() => setPage((current) => current - 1)}
            >
              ‹
            </button>

            {Array.from(
              { length: Math.max(0, pageEnd - pageStart + 1) },
              (_, index) => pageStart + index,
            ).map((item) => (
              <button
                key={item}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  page === item
                    ? "bg-blue-600 text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
                aria-current={page === item ? "page" : undefined}
                onClick={() => setPage(item)}
              >
                {item}
              </button>
            ))}

            <button
              className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 disabled:opacity-40"
              disabled={page >= pageCount || loading}
              aria-label="Next page"
              onClick={() => setPage((current) => current + 1)}
            >
              ›
            </button>
          </div>
        </footer>
      </div>

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
                      className={outlineButtonClass}
                      onClick={() => openPayment(details.student._id)}
                    >
                      Record payment
                    </button>
                  </div>

                  <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <dt className="text-xs font-medium text-slate-500">
                        Father&apos;s name
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
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {details.months.map((item) => (
                      <article
                        key={item.month}
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

      {receipt && (
        <ReceiptModal
          payment={receipt}
          onClose={() => setReceipt(null)}
        />
      )}
    </section>
  );
}

function PaymentModal({
  initialStudentId,
  onClose,
  onSaved,
}: {
  initialStudentId: string;
  onClose: () => void;
  onSaved: (payment: FeePayment) => void | Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<FeeStudent[]>([]);
  const [studentId, setStudentId] = useState(initialStudentId);
  const [details, setDetails] = useState<Details | null>(null);
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  const [amount, setAmount] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [paymentDate, setPaymentDate] = useState(today());
  const [method, setMethod] = useState("Cash");
  const [reference, setReference] = useState("");
  const [loadingStudent, setLoadingStudent] = useState(
    Boolean(initialStudentId),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;

    const timer = window.setTimeout(() => {
      void Promise.all([
        feeApi(
          `/fees/students/options?q=${encodeURIComponent(search)}`,
        ),
        initialStudentId
          ? feeApi(`/fees/students/options?id=${initialStudentId}`)
          : Promise.resolve({ students: [] }),
      ])
        .then(([result, selected]) => {
          if (live) {
            const options = [
              ...(result.students as FeeStudent[]),
              ...(selected.students as FeeStudent[]),
            ];

            setStudents(
              Array.from(
                new Map(
                  options.map((student) => [student._id, student]),
                ).values(),
              ),
            );
          }
        })
        .catch((caught) => {
          if (live) {
            setError(
              caught instanceof Error
                ? caught.message
                : "Could not search students.",
            );
          }
        });
    }, 200);

    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [search, initialStudentId]);

  useEffect(() => {
    if (!studentId) return;

    let live = true;

    void feeApi(
      `/fees/students/${studentId}?year=${new Date().getFullYear()}`,
    )
      .then((data: Details) => {
        if (live) {
          setDetails(data);
          setAllocations({});
          setAmount("");
        }
      })
      .catch((caught) => {
        if (live) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Could not load student dues.",
          );
        }
      })
      .finally(() => {
        if (live) setLoadingStudent(false);
      });

    return () => {
      live = false;
    };
  }, [studentId]);

  const allocTotal = Object.values(allocations).reduce(
    (sum, value) => sum + value,
    0,
  );

  const updateAllocation = (key: string, value: number) => {
    setIdempotencyKey("");

    const next = { ...allocations, [key]: value };
    setAllocations(next);
    setAmount(
      Object.values(next)
        .reduce((sum, item) => sum + item, 0)
        .toFixed(2),
    );
  };

  const toggleMonth = (item: UnpaidMonth) => {
    setIdempotencyKey("");

    const key = `${item.year}-${item.month}`;

    if (key in allocations) {
      const next = { ...allocations };
      delete next[key];
      setAllocations(next);
      setAmount(
        Object.values(next)
          .reduce((sum, value) => sum + value, 0)
          .toFixed(2),
      );
    } else {
      updateAllocation(key, item.remainingAmount);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const parsedAmount = Number(amount);

    if (
      !studentId ||
      !Object.keys(allocations).length ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0 ||
      Math.round(parsedAmount * 100) !== Math.round(allocTotal * 100)
    ) {
      setError(
        "Select unpaid months and make sure their allocations exactly match the amount received.",
      );
      return;
    }

    setSaving(true);

    try {
      const requestKey =
        idempotencyKey ||
        window.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      setIdempotencyKey(requestKey);

      const result = await feeApi("/fees/payments", {
        method: "POST",
        body: JSON.stringify({
          studentId,
          amount: parsedAmount,
          paymentDate,
          method,
          referenceNumber: reference,
          idempotencyKey: requestKey,
          allocations: Object.entries(allocations).map(([key, value]) => {
            const [year, month] = key.split("-").map(Number);
            return { year, month, amount: value };
          }),
        }),
      });

      await onSaved(result.payment as FeePayment);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save payment.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={modalBackdropClass} onClick={onClose}>
      <section
        className={`${modalClass} max-w-3xl`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-payment-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-4 top-3 rounded-lg px-2 py-1 text-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close payment form"
          onClick={onClose}
        >
          ×
        </button>

        <div className="text-xs font-bold tracking-[0.18em] text-blue-600">
          FEES MANAGEMENT
        </div>
        <h2
          id="record-payment-title"
          className="mt-2 text-2xl font-bold text-slate-900"
        >
          Record Payment
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Allocate each payment to one or more outstanding monthly fees.
        </p>

        {error && (
          <div
            className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
            role="alert"
          >
            {error}
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={(event) => void submit(event)}>
          <label className="block space-y-1.5 text-sm font-medium text-slate-700">
            Search student
            <input
              className={inputClass}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or student ID"
            />
          </label>

          <label className="block space-y-1.5 text-sm font-medium text-slate-700">
            Select Student
            <select
              className={inputClass}
              required
              value={studentId}
              onChange={(event) => {
                setStudentId(event.target.value);
                setDetails(null);
                setAllocations({});
                setAmount("");
                setIdempotencyKey("");
                setLoadingStudent(Boolean(event.target.value));
                setError("");
              }}
            >
              <option value="">Choose a student</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} · {student.studentId ?? student._id.slice(-6)}
                  {student.active ? "" : " · Inactive"}
                </option>
              ))}
            </select>
          </label>

          {loadingStudent ? (
            <div className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">
              Loading student fee balances…
            </div>
          ) : (
            details && (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <small className="text-sm text-slate-500">
                      Monthly fee
                    </small>
                    <strong className="mt-1 block text-xl font-bold text-slate-900">
                      {money(details.student.monthlyFees ?? 0)}
                    </strong>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <small className="text-sm text-rose-700">
                      All outstanding dues
                    </small>
                    <strong className="mt-1 block text-xl font-bold text-rose-800">
                      {money(details.totals.dueAmount)}
                    </strong>
                  </div>
                </div>

                <fieldset className="rounded-xl border border-slate-200 p-4">
                  <legend className="px-2 text-sm font-semibold text-slate-800">
                    Select unpaid month(s) and allocate received amount
                  </legend>

                  <div className="mt-2 space-y-3">
                    {details.unpaidMonths.length ? (
                      details.unpaidMonths
                        .slice()
                        .reverse()
                        .map((item) => {
                          const key = `${item.year}-${item.month}`;
                          const checked = key in allocations;
                          const max = item.remainingAmount;

                          return (
                            <div
                              className={`rounded-lg border p-3 transition ${
                                checked
                                  ? "border-blue-300 bg-blue-50"
                                  : "border-slate-200 bg-white"
                              }`}
                              key={key}
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                                  <input
                                    className="mt-1 h-4 w-4 accent-blue-600"
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleMonth(item)}
                                  />
                                  <span className="min-w-0">
                                    <strong className="block text-sm text-slate-900">
                                      {MONTHS[item.month - 1]} {item.year}
                                    </strong>
                                    <small className="mt-1 block text-xs leading-5 text-slate-500">
                                      Fee {money(item.feeAmount)} · Paid{" "}
                                      {money(item.paidAmount)} · Due{" "}
                                      {money(max)}
                                    </small>
                                  </span>
                                </label>

                                {checked && (
                                  <input
                                    className={`${inputClass} sm:w-40`}
                                    aria-label={`Amount allocated to ${MONTHS[item.month - 1]} ${item.year}`}
                                    type="number"
                                    min="0.01"
                                    max={max}
                                    step="0.01"
                                    value={allocations[key]}
                                    onChange={(event) =>
                                      updateAllocation(
                                        key,
                                        Number(event.target.value),
                                      )
                                    }
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="py-5 text-center text-sm text-slate-500">
                        No unpaid eligible months for this student.
                      </div>
                    )}
                  </div>
                </fieldset>
              </>
            )
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Amount Received (₹)
              <input
                className={inputClass}
                required
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => {
                  setIdempotencyKey("");
                  setAmount(event.target.value);
                }}
              />
            </label>

            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Payment Date
              <input
                className={inputClass}
                required
                type="date"
                value={paymentDate}
                onChange={(event) => {
                  setIdempotencyKey("");
                  setPaymentDate(event.target.value);
                }}
              />
            </label>

            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Payment Method
              <select
                className={inputClass}
                value={method}
                onChange={(event) => {
                  setIdempotencyKey("");
                  setMethod(event.target.value);
                }}
              >
                <option>Cash</option>
                <option>UPI</option>
                <option>Bank Transfer</option>
              </select>
            </label>

            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Transaction / Reference (optional)
              <input
                className={inputClass}
                maxLength={100}
                value={reference}
                onChange={(event) => {
                  setIdempotencyKey("");
                  setReference(event.target.value);
                }}
                placeholder="UPI reference or receipt note"
              />
            </label>
          </div>

          <div
            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
              Math.round(Number(amount || 0) * 100) ===
              Math.round(allocTotal * 100)
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            <span className="text-sm font-medium">
              Allocated total: <strong>{money(allocTotal)}</strong>
            </span>
            <span className="text-sm">
              Amount received: <strong>{money(Number(amount || 0))}</strong>
            </span>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              className={outlineButtonClass}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className={primaryButtonClass}
              type="submit"
              disabled={
                saving || loadingStudent || !details?.unpaidMonths.length
              }
            >
              {saving ? "Saving payment…" : "Save Payment"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ReceiptModal({
  payment,
  onClose,
}: {
  payment: FeePayment;
  onClose: () => void;
}) {
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
          className="no-print absolute right-4 top-3 rounded-lg px-2 py-1 text-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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

        <div className="no-print mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <button className={outlineButtonClass} onClick={onClose}>
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