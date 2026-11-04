
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import PageHeader from "@/components/student/ui/PageHeader";
import SectionCard from "@/components/student/ui/SectionCard";
import LoadingState from "@/components/student/ui/LoadingState";
import EmptyState from "@/components/student/ui/EmptyState";
import StatusBadge from "@/components/student/ui/StatusBadge";

interface FeeMonth {
  year: number;
  month: number;
  feeAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
}

interface FeePayment {
  _id: string;
  amount?: number;
  receiptNumber?: string;
  paymentDate?: string;
  paymentMode?: string;
  createdAt?: string;
}

interface FeeData {
  months: FeeMonth[];
  unpaidMonths: FeeMonth[];
  totals?: {
    feeAmount?: number;
    paidAmount?: number;
    remainingAmount?: number;
  };
  payments: FeePayment[];
}

const money = (value?: number) =>
  `₹${Number(value ?? 0).toLocaleString("en-IN")}`;

const monthName = (month: number) =>
  new Date(2000, month - 1, 1).toLocaleString("en-IN", { month: "long" });

const dateLabel = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

export default function StudentFeesPage() {
  const [data, setData] = useState<FeeData>({
    months: [],
    unpaidMonths: [],
    payments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadFees() {
      try {
        const response = await api("/student/fees");
        if (cancelled) return;

        setData({
          months: response.months ?? [],
          unpaidMonths: response.unpaidMonths ?? [],
          totals: response.totals,
          payments: response.payments ?? [],
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load fees.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadFees();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingState message="Loading fee details..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Fees"
        description="View your monthly fee status and payment history."
      />

      {error && (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Fees</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {money(data.totals?.feeAmount)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Paid Amount</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {money(data.totals?.paidAmount)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Remaining Due</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {money(data.totals?.remainingAmount)}
          </p>
        </div>
      </div>

      <SectionCard
        title="Monthly Fee Status"
        description="Your monthly fee records."
      >
        {data.months.length === 0 ? (
          <EmptyState
            title="No fee records available"
            description="Your monthly fee details will appear here when recorded by the admin."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="px-3 py-3 font-medium">Month</th>
                  <th className="px-3 py-3 font-medium">Fee</th>
                  <th className="px-3 py-3 font-medium">Paid</th>
                  <th className="px-3 py-3 font-medium">Remaining</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.months.map((item, index) => (
                  <tr
                    key={`${item.year}-${item.month}-${index}`}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                  >
                    <td className="px-3 py-4 font-medium text-gray-900 dark:text-white">
                      {monthName(item.month)} {item.year}
                    </td>
                    <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                      {money(item.feeAmount)}
                    </td>
                    <td className="px-3 py-4 text-green-600">
                      {money(item.paidAmount)}
                    </td>
                    <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                      {money(item.remainingAmount)}
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Payment History"
        description="Payments recorded by your Tuition Admin."
      >
        {data.payments.length === 0 ? (
          <EmptyState
            title="No payment history"
            description="Your recorded payments will appear here."
          />
        ) : (
          <div className="space-y-3">
            {data.payments.map((payment) => (
              <div
                key={payment._id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-gray-100 p-4 dark:border-gray-800 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {money(payment.amount)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {dateLabel(payment.paymentDate ?? payment.createdAt)}
                    {payment.paymentMode ? ` • ${payment.paymentMode}` : ""}
                  </p>
                  {payment.receiptNumber && (
                    <p className="mt-1 text-xs text-gray-400">
                      Receipt: {payment.receiptNumber}
                    </p>
                  )}
                </div>
                <StatusBadge status="Paid" />
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
