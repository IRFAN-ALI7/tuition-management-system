"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Details,
  FeePayment,
  FeeStudent,
  UnpaidMonth,
  MONTHS,
  money,
  today,
  inputClass,
  primaryButtonClass,
  outlineButtonClass,
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

type Props = {
  initialStudentId: string;
  onClose: () => void;
  onSaved: (payment: FeePayment) => void | Promise<void>;
};

export default function PaymentModal({
  initialStudentId,
  onClose,
  onSaved,
}: Props) {
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
        feeApi(`/fees/students/options?q=${encodeURIComponent(search)}`),
        initialStudentId
          ? feeApi(`/fees/students/options?id=${initialStudentId}`)
          : Promise.resolve({ students: [] }),
      ])
        .then(([result, selected]) => {
          if (!live) return;

          const options = [
            ...(result.students as FeeStudent[]),
            ...(selected.students as FeeStudent[]),
          ];

          setStudents(
            Array.from(
              new Map(options.map((student) => [student._id, student])).values(),
            ),
          );
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
    if (!studentId) {
      setDetails(null);
      setLoadingStudent(false);
      return;
    }

    let live = true;
    setLoadingStudent(true);

    void feeApi(
      `/fees/students/${studentId}?year=${new Date().getFullYear()}`,
    )
      .then((data: Details) => {
        if (live) {
          setDetails(data);
          setAllocations({});
          setAmount("");
          setError("");
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or student ID"
            />
          </label>

          <label className="block space-y-1.5 text-sm font-medium text-slate-700">
            Select Student
            <select
              className={inputClass}
              required
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                setDetails(null);
                setAllocations({});
                setAmount("");
                setIdempotencyKey("");
                setLoadingStudent(Boolean(e.target.value));
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
              Loading student fee balances...
            </div>
          ) : (
            details && (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <small className="text-sm text-slate-500">Monthly fee</small>
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
                                      {money(item.paidAmount)} · Due {money(max)}
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
                                    onChange={(e) =>
                                      updateAllocation(key, Number(e.target.value))
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
                onChange={(e) => {
                  setIdempotencyKey("");
                  setAmount(e.target.value);
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
                onChange={(e) => {
                  setIdempotencyKey("");
                  setPaymentDate(e.target.value);
                }}
              />
            </label>

            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Payment Method
              <select
                className={inputClass}
                value={method}
                onChange={(e) => {
                  setIdempotencyKey("");
                  setMethod(e.target.value);
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
                onChange={(e) => {
                  setIdempotencyKey("");
                  setReference(e.target.value);
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
              disabled={saving || loadingStudent || !details?.unpaidMonths.length}
            >
              {saving ? "Saving payment..." : "Save Payment"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}