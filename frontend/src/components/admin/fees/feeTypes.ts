export type BatchOption = {
  _id: string;
  name: string;
};

export type FeeStudent = {
  _id: string;
  studentId?: string;
  name: string;
  phone: string;
  className?: string;
  monthlyFees?: number | null;
  active?: boolean;
};

export type FeeRow = {
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

export type FeeSummaryData = {
  totalExpected: number;
  feesCollected: number;
  totalDue: number;
  studentsPaid: number;
  studentsDue: number;
};

export type FeeAllocation = {
  year: number;
  month: number;
  amount: number;
};

export type FeePayment = {
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

export type UnpaidMonth = FeeAllocation & {
  feeAmount: number;
  paidAmount: number;
  remainingAmount: number;
};

export type Details = {
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
  totals: {
    paidAmount: number;
    dueAmount: number;
  };
  payments: FeePayment[];
};

export const MONTHS = [
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

export const money = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

export const outlineButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

export const modalBackdropClass =
  "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-6";

export const modalClass =
  "relative my-auto max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7";

export const today = () => {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
};