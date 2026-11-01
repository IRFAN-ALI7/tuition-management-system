
import FeeLedger from "../models/FeeLedger.model";
import Student from "../models/Student.model";

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const monthSerial = (year: number, month: number) =>
  year * 12 + month - 1;

const fromSerial = (serial: number) => ({
  year: Math.floor(serial / 12),
  month: (serial % 12) + 1,
});

const validDate = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) ===
    value;

const studentStartMonth = (
  admissionDate: unknown,
  createdAtValue: unknown
): number | null => {
  if (validDate(admissionDate)) {
    const [year, month] = admissionDate.split("-").map(Number);
    return monthSerial(year, month);
  }

  if (
    createdAtValue instanceof Date ||
    typeof createdAtValue === "string"
  ) {
    const createdAt = new Date(createdAtValue);

    if (!Number.isNaN(createdAt.valueOf())) {
      return monthSerial(
        createdAt.getFullYear(),
        createdAt.getMonth() + 1
      );
    }
  }

  return null;
};

/**
 * Creates missing monthly fee ledgers for active students.
 *
 * - Generates records from admission month through target month.
 * - Does not generate records for inactive students.
 * - Never overwrites existing fee or payment amounts.
 * - Uses upsert and the unique student/year/month index
 *   to prevent duplicate monthly records.
 */
export async function ensureFeeLedgersThrough(
  targetYear: number,
  targetMonth: number
): Promise<void> {
  if (
    !Number.isInteger(targetYear) ||
    targetYear < 2000 ||
    targetYear > 9999 ||
    !Number.isInteger(targetMonth) ||
    targetMonth < 1 ||
    targetMonth > 12
  ) {
    throw new Error("Invalid target month or year for fee ledger generation.");
  }

  const target = monthSerial(targetYear, targetMonth);

  const students = await Student.find({
    active: true,
    monthlyFees: { $gt: 0 },
  })
    .select("_id monthlyFees admissionDate createdAt")
    .lean();

  if (!students.length) return;

  const existing = await FeeLedger.find({
    studentId: {
      $in: students.map((student) => student._id),
    },
    year: { $lte: targetYear },
  })
    .select("studentId year month")
    .lean();

  const existingKeys = new Set(
    existing.map(
      (ledger) =>
        `${String(ledger.studentId)}-${ledger.year}-${ledger.month}`
    )
  );

  let operations: Record<string, unknown>[] = [];

  for (const student of students) {
    const monthlyFee = student.monthlyFees;

    if (
      typeof monthlyFee !== "number" ||
      !Number.isFinite(monthlyFee) ||
      monthlyFee <= 0
    ) {
      continue;
    }

    const start = Math.max(
      studentStartMonth(
        student.admissionDate,
        student.createdAt
      ) ?? target,
      monthSerial(2000, 1)
    );

    for (let serial = start; serial <= target; serial += 1) {
      const { year, month } = fromSerial(serial);

      const key = `${String(student._id)}-${year}-${month}`;

      if (existingKeys.has(key)) {
        continue;
      }

      operations.push({
        updateOne: {
          filter: {
            studentId: student._id,
            year,
            month,
          },
          update: {
            $setOnInsert: {
              studentId: student._id,
              year,
              month,
              feeAmount: roundMoney(monthlyFee),
              paidAmount: 0,
            },
          },
          upsert: true,
        },
      });

      if (operations.length >= 500) {
        await FeeLedger.bulkWrite(operations as any[], {
          ordered: false,
        });

        operations = [];
      }
    }
  }

  if (operations.length) {
    await FeeLedger.bulkWrite(operations as any[], {
      ordered: false,
    });
  }
}
