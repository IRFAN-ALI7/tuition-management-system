import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { api } from "@/lib/api";
import type { Student, Batch } from "@/components/admin/shared/types";

type Props = {
  batchId: string;
  date: string;
  selectedBatch: Batch | null;
  setPageError: Dispatch<SetStateAction<string>>;
  setNotice: Dispatch<SetStateAction<string>>;
};

export default function useAdminAttendance({
  batchId,
  date,
  selectedBatch,
  setPageError,
  setNotice,
}: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [saved, setSaved] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);

  const present = useMemo(
    () => students.filter((student) => student.status === "present").length,
    [students],
  );

  const absent = students.length - present;

  const attendancePercentage = students.length
    ? Math.round((present / students.length) * 100)
    : 0;

  const loadAttendance = async (
    id: string,
    selectedDate: string,
  ) => {
    if (!id) {
      setStudents([]);
      setSaved(false);
      setAttendanceLoading(false);
      return;
    }

    setAttendanceLoading(true);

    try {
      const result = await api(
        `/attendance/${id}?date=${selectedDate}`,
      );

      setStudents(
        result.attendance.records.map(
          (entry: {
            student: Student;
            status: "present" | "absent";
          }) => ({
            ...entry.student,
            status: entry.status,
          }),
        ),
      );

      setSaved(result.attendance.saved);

      setPageError(
        !result.batch.active && !result.attendance.saved
          ? "This batch is inactive. Historical records are available, but new attendance cannot be started."
          : "",
      );
    } finally {
      setAttendanceLoading(false);
    }
  };

  const saveAttendance = async () => {
    if (!selectedBatch?.active || !students.length || attendanceSaving) {
      return;
    }

    setAttendanceSaving(true);
    setPageError("");

    try {
      await api("/attendance", {
        method: "POST",
        body: JSON.stringify({
          batchId,
          date,
          records: students.map((student) => ({
            studentId: student._id,
            status: student.status,
          })),
        }),
      });

      setSaved(true);
      setNotice("Attendance saved successfully.");
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Could not save attendance.",
      );
    } finally {
      setAttendanceSaving(false);
    }
  };

  const updateStudents: Dispatch<SetStateAction<Student[]>> = (update) => {
    setStudents(update);
    setSaved(false);
  };

  return {
    students,
    saved,
    attendanceLoading,
    attendanceSaving,
    present,
    absent,
    attendancePercentage,
    loadAttendance,
    saveAttendance,
    setStudents: updateStudents,
  };
}