
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/authenticate";

import { getStudentByUserId } from "../../services/student/studentData.service";
import ExamResult from "../../models/ExamResult.model";

interface ExamHistoryItem {
  _id: string;
  examId: string;
  examDate: string;
  name: string;
  subject: string;
  batch: unknown;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
}

// GET /api/student/exams
export async function getStudentExamHistory(
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

    const page = Math.max(1, Number(request.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(request.query.limit) || 20)
    );

    const [allRecords, records, total] = await Promise.all([
      ExamResult.find({ studentId: student._id })
        .sort({ createdAt: -1 })
        .populate({
          path: "examId",
          select: "name subject examDate totalMarks batchId",
          populate: {
            path: "batchId",
            select: "name startTime endTime",
          },
        })
        .lean<any[]>(),

      ExamResult.find({ studentId: student._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
          path: "examId",
          select: "name subject examDate totalMarks batchId",
          populate: {
            path: "batchId",
            select: "name startTime endTime",
          },
        })
        .lean<any[]>(),

      ExamResult.countDocuments({
        studentId: student._id,
      }),
    ]);

    const results: ExamHistoryItem[] = allRecords.flatMap(
      (record: any): ExamHistoryItem[] => {
        const exam = record.examId;

        if (!exam) return [];

        const percentage = exam.totalMarks
          ? Number(
              (
                (record.obtainedMarks / exam.totalMarks) *
                100
              ).toFixed(2)
            )
          : 0;

        return [
          {
            _id: String(record._id),
            examId: String(exam._id),
            examDate: exam.examDate,
            name: exam.name,
            subject: exam.subject,
            batch: exam.batchId,
            totalMarks: exam.totalMarks,
            obtainedMarks: record.obtainedMarks,
            percentage,
          },
        ];
      }
    );

    const subjectGroups = new Map<
      string,
      {
        obtained: number;
        total: number;
        count: number;
      }
    >();

    for (const result of results) {
      const group = subjectGroups.get(result.subject) ?? {
        obtained: 0,
        total: 0,
        count: 0,
      };

      group.obtained += result.obtainedMarks;
      group.total += result.totalMarks;
      group.count += 1;

      subjectGroups.set(result.subject, group);
    }

    const totalObtained = results.reduce(
      (sum: number, result: ExamHistoryItem) =>
        sum + result.obtainedMarks,
      0
    );

    const totalPossible = results.reduce(
      (sum: number, result: ExamHistoryItem) =>
        sum + result.totalMarks,
      0
    );

    const paginatedResults: ExamHistoryItem[] = records.flatMap(
      (record: any): ExamHistoryItem[] => {
        const exam = record.examId;

        if (!exam) return [];

        return [
          {
            _id: String(record._id),
            examId: String(exam._id),
            examDate: exam.examDate,
            name: exam.name,
            subject: exam.subject,
            batch: exam.batchId,
            totalMarks: exam.totalMarks,
            obtainedMarks: record.obtainedMarks,
            percentage: exam.totalMarks
              ? Number(
                  (
                    (record.obtainedMarks / exam.totalMarks) *
                    100
                  ).toFixed(2)
                )
              : 0,
          },
        ];
      }
    );

    response.json({
      results: paginatedResults,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },

      summary: {
        examsTaken: results.length,
        totalObtained,
        totalPossible,

        overallAverage: totalPossible
          ? Number(
              ((totalObtained / totalPossible) * 100).toFixed(2)
            )
          : null,

        subjectAverages: Array.from(
          subjectGroups,
          ([subject, values]) => ({
            subject,
            average: values.total
              ? Number(
                  (
                    (values.obtained / values.total) *
                    100
                  ).toFixed(2)
                )
              : 0,
            count: values.count,
          })
        ),
      },
    });
  } catch (error) {
    next(error);
  }
}
