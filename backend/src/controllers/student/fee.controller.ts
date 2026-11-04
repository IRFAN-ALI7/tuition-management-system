
import type { Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";

import type { AuthRequest } from "../../middleware/authenticate";
import { getStudentByUserId } from "../../services/student/studentData.service";

import FeeLedger from "../../models/FeeLedger.model";
import FeePayment from "../../models/FeePayment.model";
import { ensureFeeLedgersThrough } from "../../services/feeLedger.service";

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const monthSerial = (year: number, month: number) =>
  year * 12 + month - 1;

const validDate = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

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

    if (!Number.isInteger(year) || year < 2000 || year > 9999) {
      response.status(400).json({
        error: "Choose a valid year.",
      });
      return;
    }

    const paymentPage = Math.max(
      1,
      Number(request.query.paymentPage) || 1
    );

    const paymentLimit = Math.min(
      100,
      Math.max(1, Number(request.query.paymentLimit) || 20)
    );

    await ensureFeeLedgersThrough(currentYear, currentMonth);

    const [yearLedgers, allLedgers, payments, paymentCount, batch] =
      await Promise.all([
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
          .sort({ paymentDate: -1, createdAt: -1 })
          .skip((paymentPage - 1) * paymentLimit)
          .limit(paymentLimit)
          .lean(),

        FeePayment.countDocuments({
          studentId: student._id,
        }),

        student.batchId
          ? student.populate("batchId", "name startTime endTime")
          : Promise.resolve(student),
      ]);

    const byMonth = new Map(
      yearLedgers.map((ledger) => [ledger.month, ledger])
    );

    const startMonth = getStudentStartMonth(student);

    const months = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const ledger = byMonth.get(month);

      const future =
        monthSerial(year, month) >
        monthSerial(currentYear, currentMonth);

      const beforeAdmission =
        startMonth !== null &&
        monthSerial(year, month) < startMonth;

      const feeAmount = ledger?.feeAmount ?? 0;
      const paidAmount = ledger?.paidAmount ?? 0;

      const status = future
        ? "Upcoming"
        : beforeAdmission
          ? "Not due"
          : ledger
            ? paidAmount >= feeAmount
              ? "Paid"
              : "Due"
            : "Not due";

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

    const totalFee = allLedgers.reduce(
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

    response.json({
      student: {
        _id: student._id,
        studentId: student.studentId,
        name: student.name,
        monthlyFees: student.monthlyFees,
        batch: (batch as any).batchId ?? null,
      },

      year,
      months,
      unpaidMonths,

      totals: {
        feeAmount: roundMoney(totalFee),
        paidAmount: roundMoney(totalPaid),
        dueAmount: roundMoney(totalDue),
      },

      payments: payments.map((payment) => ({
        _id: payment._id,
        receiptNumber: payment.receiptNumber,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        method: payment.method,
        referenceNumber: payment.referenceNumber,
        allocations: payment.allocations,
        createdAt: payment.createdAt,
      })),

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

// GET /api/student/fees/payments/:paymentId
// Student can access only their own payment receipt.
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

    const paymentId = String(request.params.paymentId ?? "").trim();

    if (!paymentId) {
      response.status(400).json({
        error: "Payment ID or receipt number is required.",
      });
      return;
    }

    // Ownership is checked directly in the payment query.
    const paymentQuery = isValidObjectId(paymentId)
      ? {
          _id: paymentId,
          studentId: student._id,
        }
      : {
          receiptNumber: paymentId,
          studentId: student._id,
        };

    const payment = (await FeePayment.findOne(paymentQuery).lean()) as any;

    if (!payment) {
      response.status(404).json({
        error: "Payment receipt not found.",
      });
      return;
    }

    const ledgerTotals = await FeeLedger.aggregate([
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
                  $subtract: ["$feeAmount", "$paidAmount"],
                },
              ],
            },
          },
        },
      },
    ]);

    const totals = ledgerTotals[0] ?? {
      totalDue: 0,
      totalPaid: 0,
      remainingDue: 0,
    };

    response.json({
      payment: {
        _id: payment._id,
        receiptNumber: payment.receiptNumber,

        studentId: String(student._id),

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

        amount: payment.amount,
        paymentDate: payment.paymentDate,
        actualPaymentDate: payment.createdAt,
        method: payment.method,
        referenceNumber: payment.referenceNumber,
        allocations: payment.allocations,
        createdAt: payment.createdAt,

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
