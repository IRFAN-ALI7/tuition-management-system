
export type FeeStatus = "Paid" | "Due" | "Upcoming" | "Not due";

export interface StudentFeeMonth {
  year: number;
  month: number;
  feeAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: FeeStatus | string;
}

export interface StudentFeeAllocation {
  year: number;
  month: number;
  amount: number;
}

export interface StudentFeePayment {
  _id: string;
  receiptNumber: string;
  studentId?: string;
  amount: number;
  paymentDate: string;
  method: string;
  referenceNumber?: string;
  allocations: StudentFeeAllocation[];
  createdAt?: string;
  actualPaymentDate?: string;
  student?: {
    _id?: string;
    studentId?: string;
    name: string;
    phone?: string;
    fatherName?: string;
    className?: string;
    admissionDate?: string;
    monthlyFees?: number | null;
  };
  receiptDetails?: {
    totalDue: number;
    totalPaid: number;
    remainingDue: number;
  };
}

export interface StudentFeeProfile {
  _id: string;
  studentId?: string;
  name: string;
  monthlyFees: number | null;
  batch?: {
    name: string;
    startTime: string;
    endTime: string;
  } | null;
}

export interface StudentFeeTotals {
  feeAmount: number;
  paidAmount: number;
  dueAmount: number;
}

export interface StudentFeePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StudentFeeData {
  student: StudentFeeProfile;
  year: number;
  months: StudentFeeMonth[];
  unpaidMonths: StudentFeeMonth[];
  totals: StudentFeeTotals;
  payments: StudentFeePayment[];
  paymentPagination: StudentFeePagination;
}

export interface StudentMonthDetails {
  month: StudentFeeMonth;
  installments: StudentFeePayment[];
}

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

export const money = (value?: number | null) =>
  `₹${Number(value ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

export function formatFeeDate(value?: string) {
  if (!value) return "—";

  const datePart = value.slice(0, 10);
  const parts = datePart.split("-").map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return "—";
  }

  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

export function formatFeeTime(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

export function formatFeeDateTime(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}
