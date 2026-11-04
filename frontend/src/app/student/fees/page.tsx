
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CreditCard,
  GraduationCap,
  ReceiptText,
} from "lucide-react";

import { api } from "@/lib/api";
import PageHeader from "@/components/student/ui/PageHeader";

import FeeOverview from "@/components/student/fees/FeeOverview";
import MonthlyFeeStatement from "@/components/student/fees/MonthlyFeeStatement";
import SelectedMonthDetails from "@/components/student/fees/SelectedMonthDetails";
import PaymentHistory from "@/components/student/fees/PaymentHistory";
import FeeReceiptModal from "@/components/student/fees/FeeReceiptModal";

import {
  type StudentFeeData,
  type StudentFeePayment,
  type StudentReceipt,
} from "@/types/student-fees";

const CURRENT_DATE = new Date();
const CURRENT_YEAR = CURRENT_DATE.getFullYear();
const CURRENT_MONTH = CURRENT_DATE.getMonth() + 1;
const PAYMENT_LIMIT = 5;

export default function StudentFeesPage() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [paymentPage, setPaymentPage] = useState(1);

  const [data, setData] = useState<StudentFeeData | null>(null);

  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [error, setError] = useState("");

  const [receipt, setReceipt] = useState<StudentReceipt | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState("");

  const availableYears = useMemo(
    () =>
      Array.from(
        { length: 10 },
        (_, index) => CURRENT_YEAR - index
      ),
    []
  );

  // Retry fee data loading
  const loadFees = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        year: String(year),
        paymentPage: String(paymentPage),
        paymentLimit: String(PAYMENT_LIMIT),
      });

      const response = await api(
        `/student/fees?${params.toString()}`
      );

      setData(response as StudentFeeData);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load fee details."
      );
    } finally {
      setLoading(false);
      setPaymentsLoading(false);
    }
  }, [year, paymentPage]);

  // Load fee details whenever year or payment page changes
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (data) {
        setPaymentsLoading(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams({
          year: String(year),
          paymentPage: String(paymentPage),
          paymentLimit: String(PAYMENT_LIMIT),
        });

        const response = await api(
          `/student/fees?${params.toString()}`
        );

        if (cancelled) return;

        setData(response as StudentFeeData);
        setError("");
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load fee details."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setPaymentsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [year, paymentPage]);

  const months = data?.months ?? [];

  const selectedMonthData = useMemo(
    () =>
      months.find((item) => item.month === selectedMonth),
    [months, selectedMonth]
  );

  const paidMonths = months.filter(
    (item) => item.status === "Paid"
  ).length;

  const totalRecordedMonths = months.filter(
    (item) => item.status === "Paid" || item.status === "Due"
  ).length;

  const totalPaid = data?.totals.paidAmount ?? 0;
  const totalDue = data?.totals.dueAmount ?? 0;

  const payments: StudentFeePayment[] = data?.payments ?? [];

  const paymentPagination = data?.paymentPagination ?? {
    page: 1,
    limit: PAYMENT_LIMIT,
    total: 0,
    totalPages: 1,
  };

  function handleYearChange(nextYear: number) {
    setYear(nextYear);
    setPaymentPage(1);

    if (nextYear === CURRENT_YEAR) {
      setSelectedMonth(CURRENT_MONTH);
    } else {
      setSelectedMonth(12);
    }
  }

  async function handleReceipt(paymentId: string) {
    setReceiptError("");
    setReceiptLoading(true);

    try {
      const response = await api(
        `/student/fees/payments/${encodeURIComponent(paymentId)}`
      );

      setReceipt(response.payment as StudentReceipt);
    } catch (caught) {
      setReceiptError(
        caught instanceof Error
          ? caught.message
          : "Unable to open receipt."
      );
    } finally {
      setReceiptLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1320px] space-y-5">
        <PageHeader
          title="My Fees"
          description="View your monthly fee statement and payment history."
        />

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>

        <div className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1320px] space-y-5 pb-5 sm:space-y-6">
      <PageHeader
        title="My Fees"
        description="View your monthly fee statement, outstanding dues and complete payment history."
      />

      {/* Fee page introduction */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-700 via-violet-600 to-indigo-600 p-5 text-white shadow-lg shadow-violet-900/10 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 right-1/3 h-40 w-40 rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="relative flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-100">
              <CreditCard className="h-3.5 w-3.5" />
              Student Portal / Fees
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              My Fees
            </h1>

            <p className="mt-2 max-w-xl text-xs leading-5 text-violet-100 sm:text-sm">
              Your fee account, month-wise payment status and
              downloadable payment receipts — all in one place.
            </p>
          </div>

          <div className="hidden h-20 w-20 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10 sm:grid">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
        </div>
      </section>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-bold">Unable to load fee details</p>
            <p className="mt-1 text-xs">{error}</p>

            <button
              type="button"
              onClick={() => void loadFees()}
              className="mt-2 text-xs font-bold underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Overview */}
      <FeeOverview
        monthlyFee={data?.student.monthlyFees ?? null}
        totalPaid={totalPaid}
        totalDue={totalDue}
        paidMonths={paidMonths}
        totalMonths={totalRecordedMonths}
      />

      {/* Monthly statement */}
      {data && (
        <MonthlyFeeStatement
          months={months}
          year={year}
          currentYear={CURRENT_YEAR}
          currentMonth={CURRENT_MONTH}
          selectedMonth={selectedMonth}
          availableYears={availableYears}
          onYearChange={handleYearChange}
          onMonthSelect={setSelectedMonth}
        />
      )}

      {/* Selected month details */}
      {data && (
        <SelectedMonthDetails
          month={selectedMonthData}
          year={year}
        />
      )}

      {/* Payment history */}
      <PaymentHistory
        payments={payments}
        pagination={paymentPagination}
        loading={paymentsLoading}
        onPageChange={setPaymentPage}
        onReceipt={handleReceipt}
      />

      {/* Receipt loading */}
      {receiptLoading && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm">
          <div className="rounded-xl bg-white px-5 py-4 text-sm font-semibold text-slate-800 shadow-xl dark:bg-slate-900 dark:text-white">
            Loading receipt...
          </div>
        </div>
      )}

      {/* Receipt error */}
      {receiptError && (
        <div
          role="alert"
          className="fixed bottom-5 right-5 z-[110] flex max-w-sm items-start gap-3 rounded-xl border border-red-200 bg-white p-4 text-sm text-red-700 shadow-xl dark:border-red-900 dark:bg-slate-900 dark:text-red-300"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />

          <div className="min-w-0 flex-1">
            {receiptError}

            <button
              type="button"
              onClick={() => setReceiptError("")}
              className="ml-2 font-bold underline"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Receipt modal */}
      {receipt && (
        <FeeReceiptModal
          receipt={receipt}
          onClose={() => setReceipt(null)}
        />
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 pt-4 text-[10px] text-slate-400 dark:border-slate-800">
        <ReceiptText className="h-3.5 w-3.5" />
        <span>Udaan Learning Centre · Your fee account</span>
        <span>·</span>
        <span>Your payments are recorded by the Tuition Admin.</span>
      </div>
    </div>
  );
}
