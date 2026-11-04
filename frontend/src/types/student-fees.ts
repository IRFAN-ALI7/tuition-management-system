
export interface StudentFeeMonth {
  year: number;
  month: number;
  feeAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "Paid" | "Due" | "Upcoming" | "Not due" | string;
}

export interface StudentFeePaymentAllocation {
  year: number;
  month: number;
  amount: number;
}

export interface StudentFeePayment {
  _id: string;
  receiptNumber: string;
  studentId: string;
  amount: number;
  paymentDate: string;
  method: string;
  referenceNumber?: string;
  allocations: StudentFeePaymentAllocation[];
  createdAt?: string;
}

export interface StudentFeeProfile {
  _id: string;
  studentId?: string;
  name: string;
  monthlyFees: number | null;
  batch?: {
    _id: string;
    name: string;
    startTime?: string;
    endTime?: string;
  } | null;
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
  totals: {
    paidAmount: number;
    dueAmount: number;
  };
  payments: StudentFeePayment[];
  paymentPagination: StudentFeePagination;
}

export interface StudentReceipt {
  _id: string;
  receiptNumber: string;
  studentId: string;
  amount: number;
  paymentDate: string;
  method: string;
  referenceNumber?: string;
  allocations: StudentFeePaymentAllocation[];
  createdAt?: string;

  student: {
    _id: string;
    studentId?: string;
    name: string;
    fatherName?: string;
    phone?: string;
    className?: string;
    admissionDate?: string;
    monthlyFees?: number | null;
  };

  receiptDetails: {
    totalDue: number;
    totalPaid: number;
    remainingDue: number;
  };
}

export const FEE_MONTHS = [
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

export function formatMoney(value: number | null | undefined) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

export function formatFeeDate(value?: string) {
  if (!value) return "—";

  const dateValue = value.slice(0, 10);
  const parts = dateValue.split("-").map(Number);

  if (
    parts.length !== 3 ||
    parts.some((part) => !Number.isFinite(part))
  ) {
    return "—";
  }

  return new Date(
    parts[0],
    parts[1] - 1,
    parts[2]
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
