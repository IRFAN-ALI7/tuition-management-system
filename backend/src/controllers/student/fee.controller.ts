import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/authenticate";

import { getStudentByUserId } from "../../services/student/studentData.service";
import { ensureFeeLedgersThrough } from "../../services/feeLedger.service";

import FeeLedger from "../../models/FeeLedger.model";
import FeePayment from "../../models/FeePayment.model";

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const monthSerial = (year: number, month: number) =>
  year * 12 + month - 1;

const validDate = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) ===
    value;

const getStudentStartMonth = (student: any): number | null => {
  if (validDate(student.admissionDate)) {
    const [year, month] = student.admissionDate.split("-").map(Number);

    return monthSerial(year, month);
  }

  if (student.createdAt) {
    const createdAt = new Date(student.createdAt);

    if (!Number.isNaN(createdAt.valueOf())) {
      return monthSerial(
        createdAt.getFullYear(),
        createdAt.getMonth() + 1
      );
    }
  }

  return null;
};

const getMonthStatus = (
  year: number,
  month: number,
  currentYear: number,
  currentMonth: number,
  startMonth: number | null,
  feeAmount: number,
  paidAmount: number,
  hasLedger: boolean
) => {
  const future =
    monthSerial(year, month) >
    monthSerial(currentYear, currentMonth);

  const beforeAdmission =
    startMonth !== null &&
    monthSerial(year, month) < startMonth;

  if (future) return "Upcoming";
  if (beforeAdmission) return "Not due";
  if (!hasLedger) return "Not due";

  return paidAmount >= feeAmount ? "Paid" : "Due";
};

const publicPayment = (payment: any) => ({
  _id: payment._id,
  receiptNumber: payment.receiptNumber,
  amount: payment.amount,
  paymentDate: payment.paymentDate,
  method: payment.method,
  referenceNumber: payment.referenceNumber,
  allocations: payment.allocations,
  createdAt: payment.createdAt,
});

// GET /api/student/fees
export async function getStudentFees(
  request: AuthRequest,
  response: Response,
  next: NextFunction
) {
  try {
    const student = await getStudentByUserId(request.auth!.userId);

    if (!student) {
      response.status(404).json({
        error: "Student record not found.",
      });
      return;
    }

    const now = new Date();

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const yearRaw = request.query.year;

    const year =
      typeof yearRaw === "string" && /^\d{4}$/.test(yearRaw)
        ? Number(yearRaw)
        : currentYear;

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 9999
    ) {
      response.status(400).json({
        error: "Choose a valid year.",
      });
      return;
    }

    const requestedPage = Number(request.query.paymentPage);

    const paymentPage =
      Number.isFinite(requestedPage) && requestedPage > 0
        ? Math.floor(requestedPage)
        : 1;

    const requestedLimit = Number(request.query.paymentLimit);

    const paymentLimit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(100, Math.max(1, Math.floor(requestedLimit)))
        : 20;

    await ensureFeeLedgersThrough(currentYear, currentMonth);

    const [
      yearLedgers,
      allLedgers,
      payments,
      paymentCount,
    ] = await Promise.all([
      FeeLedger.find({
        studentId: student._id,
        year,
      })
        .sort({ month: 1 })
        .lean(),

      FeeLedger.find({
        studentId: student._id,
      })
        .sort({ year: 1, month: 1 })
        .lean(),

      FeePayment.find({
        studentId: student._id,
      })
        .sort({
          paymentDate: -1,
          createdAt: -1,
        })
        .skip((paymentPage - 1) * paymentLimit)
        .limit(paymentLimit)
        .lean(),

      FeePayment.countDocuments({
        studentId: student._id,
      }),
    ]);

    const byMonth = new Map(
      yearLedgers.map((ledger) => [ledger.month, ledger])
    );

    const startMonth = getStudentStartMonth(student);

    const months = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const ledger = byMonth.get(month);

      const feeAmount = ledger?.feeAmount ?? 0;
      const paidAmount = ledger?.paidAmount ?? 0;

      const status = getMonthStatus(
        year,
        month,
        currentYear,
        currentMonth,
        startMonth,
        feeAmount,
        paidAmount,
        Boolean(ledger)
      );

      return {
        year,
        month,
        feeAmount,
        paidAmount,
        remainingAmount: roundMoney(
          Math.max(0, feeAmount - paidAmount)
        ),
        status,
      };
    });

    const unpaidMonths = allLedgers
      .filter((ledger) => ledger.paidAmount < ledger.feeAmount)
      .map((ledger) => ({
        year: ledger.year,
        month: ledger.month,
        feeAmount: ledger.feeAmount,
        paidAmount: ledger.paidAmount,
        remainingAmount: roundMoney(
          Math.max(0, ledger.feeAmount - ledger.paidAmount)
        ),
      }));

    const totalFeeAmount = allLedgers.reduce(
      (sum, ledger) => sum + ledger.feeAmount,
      0
    );

    const totalPaid = allLedgers.reduce(
      (sum, ledger) => sum + ledger.paidAmount,
      0
    );

    const totalDue = allLedgers.reduce(
      (sum, ledger) =>
        sum + Math.max(0, ledger.feeAmount - ledger.paidAmount),
      0
    );

    const batchStudent = student.batchId
      ? await student.populate("batchId", "name startTime endTime")
      : student;

    response.json({
      student: {
        _id: student._id,
        studentId: student.studentId,
        name: student.name,
        monthlyFees: student.monthlyFees,
        batch: batchStudent.batchId ?? null,
      },

      year,

      months,

      unpaidMonths,

      totals: {
        feeAmount: roundMoney(totalFeeAmount),
        paidAmount: roundMoney(totalPaid),
        dueAmount: roundMoney(totalDue),
      },

      payments: payments.map(publicPayment),

      paymentPagination: {
        page: paymentPage,
        limit: paymentLimit,
        total: paymentCount,
        totalPages: Math.max(
          1,
          Math.ceil(paymentCount / paymentLimit)
        ),
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/student/fees/months/:year/:month
    // GET /api/student/fees/months/:year/:month
export async function getStudentMonthFeeDetails(
  request: AuthRequest,
  response: Response,
  next: NextFunction
) {
  try {
    const student = await getStudentByUserId(request.auth!.userId);

    if (!student) {
      response.status(404).json({
        error: "Student record not found.",
      });
      return;
    }

    const year = Number(request.params.year);
    const month = Number(request.params.month);

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 9999 ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      response.status(400).json({
        error: "Choose a valid month and year.",
      });
      return;
    }

    const now = new Date();

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    await ensureFeeLedgersThrough(currentYear, currentMonth);

    type LedgerRecord = {
      feeAmount: number;
      paidAmount: number;
    };

    const ledger = (await FeeLedger.findOne({
      studentId: student._id,
      year,
      month,
    }).lean()) as unknown as LedgerRecord | null;

    const feeAmount = ledger?.feeAmount ?? 0;
    const paidAmount = ledger?.paidAmount ?? 0;

    const remainingAmount = roundMoney(
      Math.max(0, feeAmount - paidAmount)
    );

    const startMonth = getStudentStartMonth(student);

    const status = getMonthStatus(
      year,
      month,
      currentYear,
      currentMonth,
      startMonth,
      feeAmount,
      paidAmount,
      Boolean(ledger)
    );

    const payments = await FeePayment.find({
      studentId: student._id,
      allocations: {
        $elemMatch: {
          year,
          month,
        },
      },
    })
      .sort({
        paymentDate: -1,
        createdAt: -1,
      })
      .lean();

    type PaymentAllocation = {
      year: number;
      month: number;
      amount: number;
    };

    const installments = (payments as any[]).map(
      (payment: any) => {
        const allocations =
          payment.allocations as PaymentAllocation[];

        const allocation = allocations.find(
          (item: PaymentAllocation) =>
            item.year === year && item.month === month
        );

        return {
          ...publicPayment(payment),
          allocatedAmount: allocation?.amount ?? 0,
        };
      }
    );

    const monthDetails = {
      year,
      month,
      feeAmount,
      paidAmount,
      remainingAmount,
      status,
    };

    response.json({
      monthDetails,
      installments,
      payments: installments,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/student/fees/payments/:paymentId
export async function getStudentPaymentReceipt(
  request: AuthRequest,
  response: Response,
  next: NextFunction
) {
  try {
    const student = await getStudentByUserId(request.auth!.userId);

    if (!student) {
      response.status(404).json({
        error: "Student record not found.",
      });
      return;
    }

    const paymentId = request.params.paymentId as string;

    // Important: studentId is always included in this query.
    // A student cannot access another student's receipt.
    const payment = await FeePayment.findOne({
      studentId: student._id,
      $or: [
        {
          _id: paymentId,
        },
        {
          receiptNumber: paymentId,
        },
      ],
    }).lean();

    if (!payment) {
      response.status(404).json({
        error: "Payment receipt not found.",
      });
      return;
    }

    type LedgerTotals = {
      totalDue: number;
      totalPaid: number;
      remainingDue: number;
    };

    const ledgerTotals = (await FeeLedger.aggregate([
      {
        $match: {
          studentId: student._id,
        },
      },
      {
        $group: {
          _id: null,

          totalDue: {
            $sum: "$feeAmount",
          },

          totalPaid: {
            $sum: "$paidAmount",
          },

          remainingDue: {
            $sum: {
              $max: [
                0,
                {
                  $subtract: [
                    "$feeAmount",
                    "$paidAmount",
                  ],
                },
              ],
            },
          },
        },
      },
    ])) as LedgerTotals[];

    const totals = ledgerTotals[0] ?? {
      totalDue: 0,
      totalPaid: 0,
      remainingDue: 0,
    };

    response.json({
      payment: {
        ...publicPayment(payment),

        student: {
          _id: student._id,
          studentId: student.studentId,
          name: student.name,
          phone: student.phone,
          fatherName: student.fatherName,
          className: student.className,
          admissionDate: student.admissionDate,
          monthlyFees: student.monthlyFees,
        },

        receiptDetails: {
          totalDue: roundMoney(totals.totalDue),
          totalPaid: roundMoney(totals.totalPaid),
          remainingDue: roundMoney(totals.remainingDue),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}