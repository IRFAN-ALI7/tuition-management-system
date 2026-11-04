
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/authenticate";

import { getStudentByUserId } from "../../services/student/studentData.service";

import Batch from "../../models/Batch.model";
import Attendance from "../../models/Attendance.model";
import FeeLedger from "../../models/FeeLedger.model";
import ExamResult from "../../models/ExamResult.model";
import Notice from "../../models/Notice.model";

// GET /api/student/dashboard
export async function getStudentDashboard(
  request: AuthRequest,
  response: Response,
  next: NextFunction
) {
  try {
    const student = await getStudentByUserId(request.auth!.userId);

    if (!student) {
      response.status(404).json({
        error: "Student account or linked student record not found.",
      });
      return;
    }

    const studentId = student._id;
    const batchId = student.batchId;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const noticeFilter = [
      { recipientType: "ALL_STUDENTS" },
      ...(batchId ? [{ recipientType: "BATCH_WISE", batchId }] : []),
      { recipientType: "SINGLE_STUDENT", studentId },
    ];

    const [
      batch,
      attendanceSummary,
      currentFee,
      latestResults,
      notices,
    ] = await Promise.all([
      batchId
        ? Batch.findById(batchId)
            .select("name startTime endTime active")
            .lean<any>()
        : null,

      Attendance.aggregate([
        { $match: { "records.studentId": studentId } },
        { $unwind: "$records" },
        { $match: { "records.studentId": studentId } },
        {
          $group: {
            _id: "$records.status",
            count: { $sum: 1 },
          },
        },
      ]),

      FeeLedger.findOne({
        studentId,
        year,
        month,
      }).lean<any>(),

      ExamResult.find({ studentId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("examId", "name subject examDate totalMarks")
        .lean(),

      Notice.find({ $or: noticeFilter })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const present =
      attendanceSummary.find((item) => item._id === "present")?.count ?? 0;

    const absent =
      attendanceSummary.find((item) => item._id === "absent")?.count ?? 0;

    const totalAttendance = present + absent;

    const attendancePercentage = totalAttendance
      ? Number(((present / totalAttendance) * 100).toFixed(2))
      : null;

    const feeStatus = !currentFee
      ? "Not due"
      : currentFee.paidAmount >= currentFee.feeAmount
        ? "Paid"
        : "Due";

    response.json({
      student: {
        _id: student._id,
        studentId: student.studentId,
        name: student.name,
        phone: student.phone,
        fatherName: student.fatherName,
        profilePhoto: student.profilePhoto,
        address: student.address,
        className: student.className,
        admissionDate: student.admissionDate,
      },

      batch: batch
        ? {
            _id: batch._id,
            name: batch.name,
            startTime: batch.startTime,
            endTime: batch.endTime,
            active: batch.active,
          }
        : null,

      attendance: {
        total: totalAttendance,
        present,
        absent,
        percentage: attendancePercentage,
      },

      currentFee: {
        year,
        month,
        feeAmount: currentFee?.feeAmount ?? 0,
        paidAmount: currentFee?.paidAmount ?? 0,
        remainingAmount: currentFee
          ? Math.max(0, currentFee.feeAmount - currentFee.paidAmount)
          : 0,
        status: feeStatus,
      },

      latestResults: latestResults.map((result: any) => ({
        _id: result._id,
        obtainedMarks: result.obtainedMarks,
        exam: result.examId
          ? {
              _id: result.examId._id,
              name: result.examId.name,
              subject: result.examId.subject,
              examDate: result.examId.examDate,
              totalMarks: result.examId.totalMarks,
              percentage: result.examId.totalMarks
                ? Number(
                    (
                      (result.obtainedMarks / result.examId.totalMarks) *
                      100
                    ).toFixed(2)
                  )
                : 0,
            }
          : null,
      })),

      notices: notices.map((notice) => ({
        _id: notice._id,
        title: notice.title,
        message: notice.message,
        recipientType: notice.recipientType,
        createdAt: notice.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
}
