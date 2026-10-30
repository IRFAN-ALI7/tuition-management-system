import { randomUUID } from "node:crypto";
import { Router } from "express";
import mongoose, { isValidObjectId, Types } from "mongoose";
import type { AuthRequest } from "../middleware/authenticate";
import FeeLedger from "../models/FeeLedger.model";
import FeePayment from "../models/FeePayment.model";
import Student from "../models/Student.model";

const router = Router();
const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const cents = (value: number) => Math.round(value * 100);
const monthSerial = (year: number, month: number) => year * 12 + month - 1;
const fromSerial = (serial: number) => ({ year: Math.floor(serial / 12), month: (serial % 12) + 1 });
const validDate = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const currentPeriod = () => { const now = new Date(); return { year: now.getFullYear(), month: now.getMonth() + 1 }; };
const studentStartMonth = (admissionDate: unknown, createdAtValue: unknown) => {
  if (validDate(admissionDate)) {
    const [year, month] = admissionDate.split("-").map(Number);
    return monthSerial(year, month);
  }
  if (createdAtValue instanceof Date || typeof createdAtValue === "string") {
    const createdAt = new Date(createdAtValue);
    if (!Number.isNaN(createdAt.valueOf())) return monthSerial(createdAt.getFullYear(), createdAt.getMonth() + 1);
  }
  return null;
};

/** Backfill missing month ledgers idempotently; fee snapshots never overwrite payments or prior amounts. */
async function ensureLedgersThrough(targetYear: number, targetMonth: number) {
  const target = monthSerial(targetYear, targetMonth);
  const students = await Student.find({ active: true, monthlyFees: { $gt: 0 } }).select("_id monthlyFees admissionDate createdAt").lean();
  if (!students.length) return;
  const existing = await FeeLedger.find({ studentId: { $in: students.map((student) => student._id) }, year: { $lte: targetYear } }).select("studentId year month").lean();
  const existingKeys = new Set(existing.map((ledger) => `${String(ledger.studentId)}-${ledger.year}-${ledger.month}`));
  let operations: Record<string, unknown>[] = [];
  for (const student of students) {
    const start = Math.max(studentStartMonth(student.admissionDate, student.createdAt) ?? target, monthSerial(2000, 1));
    for (let serial = start; serial <= target; serial += 1) {
      const { year, month } = fromSerial(serial);
      if (existingKeys.has(`${String(student._id)}-${year}-${month}`)) continue;
      operations.push({ updateOne: { filter: { studentId: student._id, year, month }, update: { $setOnInsert: { studentId: student._id, year, month, feeAmount: roundMoney(student.monthlyFees), paidAmount: 0 } }, upsert: true } });
      if (operations.length >= 500) { await FeeLedger.bulkWrite(operations as any[], { ordered: false }); operations = []; }
    }
  }
  if (operations.length) await FeeLedger.bulkWrite(operations as any[], { ordered: false });
}

function paymentPublic(payment: any, student?: any) {
  return {
    _id: payment._id,
    receiptNumber: payment.receiptNumber,
    studentId: String(payment.studentId?._id ?? payment.studentId),
    student: student ? { _id: student._id, studentId: student.studentId, name: student.name, phone: student.phone } : undefined,
    amount: payment.amount,
    paymentDate: payment.paymentDate,
    method: payment.method,
    referenceNumber: payment.referenceNumber,
    allocations: payment.allocations,
    createdAt: payment.createdAt,
  };
}

router.get("/", async (request, response, next) => {
  try {
    const { year: currentYear, month: currentMonth } = currentPeriod();
    const year = Number(request.query.year ?? currentYear);
    const month = Number(request.query.month ?? currentMonth);
    if (!Number.isInteger(year) || year < 2000 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12) { response.status(400).json({ error: "Choose a valid month and year." }); return; }
    await ensureLedgersThrough(currentYear, currentMonth);
    const requestedPage = Number.parseInt(String(request.query.page ?? "1"), 10);
    const requestedLimit = Number.parseInt(String(request.query.limit ?? "20"), 10);
    const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
    const limit = [20, 50, 100].includes(requestedLimit) ? requestedLimit : 20;
    const q = typeof request.query.q === "string" ? request.query.q.trim() : "";
    const batchId = typeof request.query.batchId === "string" ? request.query.batchId : "all";
    const status = typeof request.query.status === "string" ? request.query.status : "all";
    if (batchId !== "all" && !isValidObjectId(batchId)) { response.status(400).json({ error: "Choose a valid batch filter." }); return; }
    if (!["all", "paid", "due"].includes(status)) { response.status(400).json({ error: "Status filter must be Paid or Due." }); return; }

    const match: Record<string, unknown> = { year, month };
    const pipeline: any[] = [
      { $match: match },
      { $lookup: { from: "students", localField: "studentId", foreignField: "_id", as: "student" } },
      { $unwind: "$student" },
      { $lookup: { from: "batches", localField: "student.batchId", foreignField: "_id", as: "batch" } },
      { $unwind: { path: "$batch", preserveNullAndEmptyArrays: true } },
      { $addFields: { remainingAmount: { $max: [0, { $subtract: ["$feeAmount", "$paidAmount"] }] }, status: { $cond: [{ $gte: ["$paidAmount", "$feeAmount"] }, "paid", "due"] } } },
    ];
    if (q) { const regex = new RegExp(escapeRegex(q), "i"); pipeline.push({ $match: { $or: [{ "student.name": regex }, { "student.studentId": regex }] } }); }
    if (batchId !== "all") pipeline.push({ $match: { "student.batchId": new Types.ObjectId(batchId) } });
    if (status !== "all") pipeline.push({ $match: { status } });
    pipeline.push({ $facet: {
      rows: [
        { $sort: { "student.nameKey": 1, studentId: 1 } }, { $skip: (page - 1) * limit }, { $limit: limit },
        { $lookup: { from: FeeLedger.collection.name, let: { sid: "$studentId" }, pipeline: [{ $match: { $expr: { $eq: ["$studentId", "$$sid"] } } }, { $group: { _id: null, totalDueAmount: { $sum: { $max: [0, { $subtract: ["$feeAmount", "$paidAmount"] }] } } } }], as: "dueTotal" } },
        { $project: { _id: 1, student: { _id: "$student._id", studentId: "$student.studentId", name: "$student.name", phone: "$student.phone", className: "$student.className" }, batch: { _id: "$batch._id", name: "$batch.name" }, year: 1, month: 1, feeAmount: 1, paidAmount: 1, remainingAmount: 1, status: 1, totalDueAmount: { $ifNull: [{ $arrayElemAt: ["$dueTotal.totalDueAmount", 0] }, 0] } } },
      ],
      total: [{ $count: "count" }],
    } });
    const [monthStats, result] = await Promise.all([
      FeeLedger.aggregate([{ $match: { year, month } }, { $group: { _id: null, totalExpected: { $sum: "$feeAmount" }, feesCollected: { $sum: "$paidAmount" }, totalDue: { $sum: { $max: [0, { $subtract: ["$feeAmount", "$paidAmount"] }] } }, studentsPaid: { $sum: { $cond: [{ $gte: ["$paidAmount", "$feeAmount"] }, 1, 0] } }, studentsDue: { $sum: { $cond: [{ $lt: ["$paidAmount", "$feeAmount"] }, 1, 0] } } } }]),
      FeeLedger.aggregate(pipeline),
    ]);
    const stats = monthStats[0] ?? { totalExpected: 0, feesCollected: 0, totalDue: 0, studentsPaid: 0, studentsDue: 0 };
    const facet = result[0] ?? { rows: [], total: [] };
    const total = facet.total[0]?.count ?? 0;
    response.json({ year, month, students: facet.rows, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }, summary: { totalExpected: roundMoney(stats.totalExpected), feesCollected: roundMoney(stats.feesCollected), totalDue: roundMoney(stats.totalDue), studentsPaid: stats.studentsPaid, studentsDue: stats.studentsDue } });
  } catch (error) { next(error); }
});

router.get("/students/options", async (request, response, next) => {
  try {
    const requestedId = typeof request.query.id === "string" ? request.query.id : "";
    if (requestedId) {
      if (!isValidObjectId(requestedId)) { response.status(400).json({ error: "Invalid student ID." }); return; }
      const selected = await Student.findById(requestedId).select("studentId name phone monthlyFees active").lean();
      response.json({ students: selected ? [selected] : [] }); return;
    }
    const q = typeof request.query.q === "string" ? request.query.q.trim() : "";
    const debtors = await FeeLedger.aggregate([{ $match: { $expr: { $lt: ["$paidAmount", "$feeAmount"] } } }, { $group: { _id: "$studentId" } }]);
    const query: Record<string, unknown> = { $or: [{ active: true }, { _id: { $in: debtors.map((item) => item._id) } }] };
    if (q) { const regex = new RegExp(escapeRegex(q), "i"); query.$and = [{ $or: [{ name: regex }, { studentId: regex }] }]; }
    const students = await Student.find(query).select("studentId name phone monthlyFees active").sort({ nameKey: 1 }).limit(40).lean();
    response.json({ students });
  } catch (error) { next(error); }
});

router.get("/students/:studentId", async (request, response, next) => {
  try {
    if (!isValidObjectId(request.params.studentId)) { response.status(400).json({ error: "Invalid student ID." }); return; }
    const current = currentPeriod();
    const year = Number(request.query.year ?? current.year);
    if (!Number.isInteger(year) || year < 2000 || year > 9999) { response.status(400).json({ error: "Choose a valid year." }); return; }
    const paymentPage = Math.max(1, Number(request.query.paymentPage) || 1);
    const requestedPaymentLimit = Number(request.query.paymentLimit);
    const paymentLimit = Number.isFinite(requestedPaymentLimit) && requestedPaymentLimit > 0 ? Math.min(100, Math.max(1, requestedPaymentLimit)) : 0;
    await ensureLedgersThrough(current.year, current.month);
    const student = await Student.findById(request.params.studentId).populate("batchId", "name startTime endTime").lean() as any;
    if (!student) { response.status(404).json({ error: "Student not found." }); return; }
    const [ledgers, allLedgers, payments, paymentCount] = await Promise.all([
      FeeLedger.find({ studentId: student._id, year }).sort({ month: 1 }).lean(),
      FeeLedger.find({ studentId: student._id }).sort({ year: 1, month: 1 }).lean(),
      (() => { const query = FeePayment.find({ studentId: student._id }).sort({ paymentDate: -1, createdAt: -1 }); if (paymentLimit) query.skip((paymentPage - 1) * paymentLimit).limit(paymentLimit); return query.lean(); })(),
      FeePayment.countDocuments({ studentId: student._id }),
    ]);
    const byMonth = new Map(ledgers.map((ledger) => [ledger.month, ledger]));
    const months = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1; const ledger = byMonth.get(month); const future = monthSerial(year, month) > monthSerial(current.year, current.month);
      const startMonth = studentStartMonth(student.admissionDate, student.createdAt);
      const beforeRecord = startMonth !== null && monthSerial(year, month) < startMonth;
      return { year, month, feeAmount: ledger?.feeAmount ?? 0, paidAmount: ledger?.paidAmount ?? 0, remainingAmount: ledger ? roundMoney(Math.max(0, ledger.feeAmount - ledger.paidAmount)) : 0, status: future ? "Upcoming" : beforeRecord ? "Not due" : ledger && ledger.paidAmount >= ledger.feeAmount ? "Paid" : ledger ? "Due" : "Not due" };
    });
    const unpaidMonths = allLedgers.filter((ledger) => ledger.paidAmount < ledger.feeAmount).map((ledger) => ({ year: ledger.year, month: ledger.month, feeAmount: ledger.feeAmount, paidAmount: ledger.paidAmount, remainingAmount: roundMoney(ledger.feeAmount - ledger.paidAmount) }));
    response.json({ student, year, months, unpaidMonths, ledgerCount: allLedgers.length, totals: { paidAmount: roundMoney(allLedgers.reduce((sum, ledger) => sum + ledger.paidAmount, 0)), dueAmount: roundMoney(allLedgers.reduce((sum, ledger) => sum + Math.max(0, ledger.feeAmount - ledger.paidAmount), 0)) }, payments: payments.map((payment) => paymentPublic(payment, student)), paymentPagination: { page: paymentPage, limit: paymentLimit || paymentCount, total: paymentCount, totalPages: paymentLimit ? Math.max(1, Math.ceil(paymentCount / paymentLimit)) : 1 } });
  } catch (error) { next(error); }
});

router.get("/payments/:paymentId", async (request, response, next) => {
  try {
    const payment = await FeePayment.findOne({ $or: [{ _id: isValidObjectId(request.params.paymentId) ? request.params.paymentId : null }, { receiptNumber: request.params.paymentId }] }).lean() as any;
    if (!payment) { response.status(404).json({ error: "Payment receipt not found." }); return; }
    const student = await Student.findById(payment.studentId).select("studentId name phone").lean();
    response.json({ payment: paymentPublic(payment, student) });
  } catch (error) { next(error); }
});

router.post("/payments", async (request, response, next) => {
  try {
    const body = request.body as Record<string, unknown>;
    const studentId = body.studentId; const amount = Number(body.amount); const paymentDate = body.paymentDate; const method = body.method;
    const idempotencyKey = body.idempotencyKey; const referenceNumber = typeof body.referenceNumber === "string" ? body.referenceNumber.trim() : "";
    const allocations = body.allocations;
    if (typeof studentId !== "string" || !isValidObjectId(studentId) || !Number.isFinite(amount) || amount <= 0 || !validDate(paymentDate) || !["Cash", "UPI", "Bank Transfer"].includes(String(method)) || typeof idempotencyKey !== "string" || !idempotencyKey.trim() || idempotencyKey.length > 120 || referenceNumber.length > 100 || !Array.isArray(allocations) || !allocations.length) { response.status(400).json({ error: "Enter a valid student, amount, date, payment method and monthly allocation." }); return; }
    const normalized: { year: number; month: number; amount: number }[] = [];
    for (const item of allocations as Record<string, unknown>[]) {
      const year = Number(item.year); const month = Number(item.month); const allocatedAmount = Number(item.amount);
      if (!Number.isInteger(year) || year < 2000 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12 || !Number.isFinite(allocatedAmount) || allocatedAmount <= 0) { response.status(400).json({ error: "Each allocation needs a valid month, year and positive amount." }); return; }
      normalized.push({ year, month, amount: roundMoney(allocatedAmount) });
    }
    if (new Set(normalized.map((item) => `${item.year}-${item.month}`)).size !== normalized.length) { response.status(400).json({ error: "A month can only appear once in a payment allocation." }); return; }
    if (cents(normalized.reduce((sum, item) => sum + item.amount, 0)) !== cents(amount)) { response.status(400).json({ error: "Allocated amounts must exactly match the amount received." }); return; }
    const existing = await FeePayment.findOne({ idempotencyKey }).lean() as any;
    if (existing) {
      const sameAllocations = JSON.stringify(existing.allocations.map((item: any) => `${item.year}-${item.month}-${cents(item.amount)}`).sort()) === JSON.stringify(normalized.map((item) => `${item.year}-${item.month}-${cents(item.amount)}`).sort());
      if (String(existing.studentId) !== studentId || cents(existing.amount) !== cents(amount) || existing.paymentDate !== paymentDate || existing.method !== method || existing.referenceNumber !== referenceNumber || !sameAllocations) { response.status(409).json({ error: "This payment request key was already used for different payment details." }); return; }
      const student = await Student.findById(existing.studentId).select("studentId name phone").lean(); response.json({ payment: paymentPublic(existing, student), duplicate: true }); return;
    }
    const today = currentPeriod(); const todaySerial = monthSerial(today.year, today.month);
    const todayDate = new Date().toISOString().slice(0, 10);
    if (paymentDate > todayDate) { response.status(400).json({ error: "Payment date cannot be in the future." }); return; }
    if (normalized.some((item) => monthSerial(item.year, item.month) > todaySerial)) { response.status(400).json({ error: "Future month fees cannot be collected yet." }); return; }
    const student = await Student.findById(studentId).lean() as any;
    if (!student) { response.status(404).json({ error: "Student not found." }); return; }
    if (student.active) await ensureLedgersThrough(today.year, today.month);
    const ledgers = await FeeLedger.find({ studentId, $or: normalized.map(({ year, month }) => ({ year, month })) }).lean() as any[];
    if (ledgers.length !== normalized.length) { response.status(409).json({ error: "One or more selected months do not have a payable fee ledger." }); return; }
    const ledgerByPeriod = new Map(ledgers.map((ledger) => [`${ledger.year}-${ledger.month}`, ledger]));
    for (const allocation of normalized) {
      const ledger = ledgerByPeriod.get(`${allocation.year}-${allocation.month}`)!;
      if (cents(allocation.amount) > cents(ledger.feeAmount - ledger.paidAmount)) { response.status(400).json({ error: `Allocation for ${allocation.month}/${allocation.year} exceeds its remaining balance.` }); return; }
    }
    const auth = (request as AuthRequest).auth!;
    const receiptNumber = `UD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const paymentData = { receiptNumber, idempotencyKey, studentId: new Types.ObjectId(studentId), amount: roundMoney(amount), paymentDate, method, referenceNumber, allocations: normalized, receivedBy: new Types.ObjectId(auth.userId) };
    const applyAllocations = async (session?: mongoose.ClientSession) => {
      for (const allocation of normalized) {
        const ledger = ledgerByPeriod.get(`${allocation.year}-${allocation.month}`)!;
        const updated = await FeeLedger.updateOne({ _id: ledger._id, paidAmount: ledger.paidAmount, feeAmount: ledger.feeAmount }, { $inc: { paidAmount: allocation.amount } }, session ? { session } : {});
        if (!updated.modifiedCount) throw new Error("A monthly balance changed while saving. Reload the fees and try again.");
      }
    };
    const compensate = async (completed: { ledgerId: Types.ObjectId; amount: number }[]) => {
      for (const item of completed.reverse()) await FeeLedger.updateOne({ _id: item.ledgerId, paidAmount: { $gte: item.amount } }, { $inc: { paidAmount: -item.amount } });
    };
    const session = await mongoose.startSession();
    let usedFallback = false;
    try {
      try {
        await session.withTransaction(async () => {
          await FeePayment.create([paymentData], { session });
          await applyAllocations(session);
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        const transactionUnavailable = (error as { code?: number }).code === 20 || /transaction numbers are only allowed|replica set|mongos|does not support transactions/i.test(message);
        if (!transactionUnavailable) throw error;
        usedFallback = true;
      }
    } finally { await session.endSession(); }
    if (usedFallback) {
      const payment = await FeePayment.create(paymentData);
      const completed: { ledgerId: Types.ObjectId; amount: number }[] = [];
      try {
        for (const allocation of normalized) {
          const ledger = ledgerByPeriod.get(`${allocation.year}-${allocation.month}`)!;
          const updated = await FeeLedger.updateOne({ _id: ledger._id, paidAmount: ledger.paidAmount, feeAmount: ledger.feeAmount }, { $inc: { paidAmount: allocation.amount } });
          if (!updated.modifiedCount) throw new Error("A monthly balance changed while saving. Reload the fees and try again.");
          completed.push({ ledgerId: ledger._id as Types.ObjectId, amount: allocation.amount });
        }
      } catch (error) { await compensate(completed); await payment.deleteOne(); throw error; }
    }
    const savedPayment = await FeePayment.findOne({ idempotencyKey }).lean();
    response.status(201).json({ payment: paymentPublic(savedPayment, student) });
  } catch (error) {
    if ((error as { code?: number }).code === 11000 && typeof request.body?.idempotencyKey === "string") {
      const existing = await FeePayment.findOne({ idempotencyKey: request.body.idempotencyKey }).lean() as any;
      if (existing) { const student = await Student.findById(existing.studentId).select("studentId name phone").lean(); response.json({ payment: paymentPublic(existing, student), duplicate: true }); return; }
    }
    next(error);
  }
});

export default router;
