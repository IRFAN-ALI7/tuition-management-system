"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import PageHeader from "@/components/student/ui/PageHeader";
import LoadingState from "@/components/student/ui/LoadingState";

import FeeOverview from "@/components/student/fees/FeeOverview";
import MonthlyFeeStatement from "@/components/student/fees/MonthlyFeeStatement";
import PaymentHistory from "@/components/student/fees/PaymentHistory";
import FeeReceiptModal from "@/components/student/fees/FeeReceiptModal";

import {
  type StudentFeeData,
  type StudentFeeMonth,
  type StudentFeePayment,
  type StudentMonthDetails,
} from "@/types/student-fees";

export default function StudentFeesPage() {
  const currentDate = new Date();

  const [year, setYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [paymentPage, setPaymentPage] = useState(1);

  const [data, setData] = useState<StudentFeeData | null>(null);

  const [monthDetails, setMonthDetails] =
    useState<StudentMonthDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [monthLoading, setMonthLoading] = useState(false);

  const [error, setError] = useState("");
  const [monthError, setMonthError] = useState("");
  const [receiptError, setReceiptError] = useState("");

  const [receipt, setReceipt] = useState<StudentFeePayment | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

       const [feeRetryKey, setFeeRetryKey] = useState(0);
  const [monthRetryKey, setMonthRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadFees() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          year: String(year),
          paymentPage: String(paymentPage),
          paymentLimit: "10",
        });

        const response = (await api(
          `/student/fees?${params.toString()}`,
        )) as StudentFeeData;

        if (cancelled) return;

        setData(response);
      } catch (caught) {
        if (cancelled) return;

        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load fee details.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadFees();

    return () => {
      cancelled = true;
    };
  }, [year, paymentPage, feeRetryKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadMonthDetails() {
      if (selectedMonth === null) {
        setMonthDetails(null);
        setMonthError("");
        setMonthLoading(false);
        return;
      }

      setMonthLoading(true);
      setMonthError("");

      try {
        const response = (await api(
          `/student/fees/months/${year}/${selectedMonth}`,
        )) as StudentMonthDetails;

        if (cancelled) return;

        setMonthDetails(response);
      } catch (caught) {
        if (cancelled) return;

        setMonthDetails(null);

        setMonthError(
          caught instanceof Error
            ? caught.message
            : "Unable to load this month's details.",
        );
      } finally {
        if (!cancelled) {
          setMonthLoading(false);
        }
      }
    }

    void loadMonthDetails();

    return () => {
      cancelled = true;
    };
  }, [year, selectedMonth, monthRetryKey]);

  function handleYearChange(nextYear: number) {
    setYear(nextYear);
    setPaymentPage(1);
    setSelectedMonth(null);
    setMonthDetails(null);
  }

  function handleMonthSelect(month: number) {
    setSelectedMonth((current) =>
      current === month ? null : month,
    );
  }

  async function handleReceipt(paymentId: string) {
    setReceiptError("");
    setReceiptLoading(true);

    try {
      const response = await api(
        `/student/fees/payments/${encodeURIComponent(paymentId)}`,
      );

      setReceipt(response.payment as StudentFeePayment);
    } catch (caught) {
      setReceiptError(
        caught instanceof Error
          ? caught.message
          : "Unable to load receipt.",
      );
    } finally {
      setReceiptLoading(false);
    }
  }

  if (loading && !data) {
    return <LoadingState message="Loading your fee statement..." />;
  }

  if (error && !data) {
    return (
      <div className="space-y-5">
        <PageHeader title="My Fees" />

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-sm font-bold text-red-700 dark:text-red-300">
            Unable to load fee details
          </p>

          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() => setFeeRetryKey((value) => value + 1)}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const months: StudentFeeMonth[] = data?.months ?? [];

  const totals = data?.totals ?? {
    feeAmount: 0,
    paidAmount: 0,
    dueAmount: 0,
  };

  const pagination = data?.paymentPagination ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };

  const yearOptions = Array.from(
    { length: 10 },
    (_, index) => currentDate.getFullYear() - index,
  );

  return (
    <div className="mx-auto max-w-[1450px] space-y-5 pb-8 sm:space-y-6">
      <PageHeader
        title="My Fees"
        description="Track monthly fees, installments, remaining dues and payment receipts."
        action={
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Academic Year

            <select
              value={year}
              onChange={(event) =>
                handleYearChange(Number(event.target.value))
              }
              className="bg-transparent font-bold text-slate-900 outline-none dark:text-white"
            >
              {yearOptions.map((item) => (
                <option
                  key={item}
                  value={item}
                  className="bg-white text-slate-900"
                >
                  {item}
                </option>
              ))}
            </select>
          </label>
        }
      />

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}

      <FeeOverview
        months={months}
        totals={totals}
        monthlyFee={data?.student.monthlyFees ?? null}
      />

      <MonthlyFeeStatement
        year={year}
        months={months}
        selectedMonth={selectedMonth}
        onSelectMonth={handleMonthSelect}
        monthDetails={monthDetails}
        monthLoading={monthLoading}
        monthError={monthError}
        onRetry={() => setMonthRetryKey((value) => value + 1)}
        onReceipt={handleReceipt}
      />

      <PaymentHistory
        payments={data?.payments ?? []}
        pagination={pagination}
        onPageChange={setPaymentPage}
        onReceipt={handleReceipt}
      />

      {receiptLoading && (
        <div className="fixed inset-0 z-[10000] grid place-items-center bg-slate-950/40 p-4">
          <div className="rounded-xl bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-xl dark:bg-slate-900 dark:text-white">
            Loading payment receipt...
          </div>
        </div>
      )}

      {receiptError && (
        <div className="fixed bottom-5 right-5 z-[10001] max-w-sm rounded-xl border border-red-200 bg-white p-4 text-xs text-red-700 shadow-xl dark:border-red-900 dark:bg-slate-900 dark:text-red-300">
          <p>{receiptError}</p>

          <button
            type="button"
            onClick={() => setReceiptError("")}
            className="mt-2 font-bold underline"
          >
            Close
          </button>
        </div>
      )}

      <FeeReceiptModal
        payment={receipt}
        onClose={() => setReceipt(null)}
      />
    </div>
  );
}