"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

import StudentProfileHeader, {
  type StudentProfile,
} from "@/components/admin/students/details/StudentProfileHeader";

import StudentOverview from "@/components/admin/students/details/StudentOverview";
import StudentFeesHistory from "@/components/admin/students/details/StudentFeesHistory";
import StudentExamHistory from "@/components/admin/students/details/StudentExamHistory";
import StudentAttendanceHistory from "@/components/admin/students/details/StudentAttendanceHistory";
import StudentResetPasswordModal from "@/components/admin/students/details/StudentResetPasswordModal";
import StudentReceiptModal, {
  type ReceiptPayment,
} from "@/components/admin/students/details/StudentReceiptModal";

type Batch = {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  active?: boolean;
};

type Student = StudentProfile;

type Month = {
  year: number;
  month: number;
  feeAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
};

type Payment = ReceiptPayment & {
  student?: {
    studentId?: string;
    name: string;
  };
};

type FeeData = {
  student: Student;
  year: number;
  months: Month[];
  unpaidMonths: Month[];
  totals: {
    paidAmount: number;
    dueAmount: number;
  };
  ledgerCount: number;
  payments: Payment[];
  paymentPagination: {
    page: number;
    total: number;
    totalPages: number;
  };
};

type ExamRecord = {
  examId: string;
  examDate: string;
  name: string;
  subject: string;
  batch?: Batch;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
};

type ExamData = {
  results: ExamRecord[];
  pagination: {
    page: number;
    total: number;
    totalPages: number;
  };
  summary: {
    examsTaken: number;
    totalObtained: number;
    totalPossible: number;
    overallAverage: number | null;
    subjectAverages: {
      subject: string;
      average: number;
      count: number;
    }[];
  };
};

type AttendanceRow = {
  _id: string;
  date: string;
  status: "present" | "absent";
  batch?: {
    name: string;
  };
};

type AttendanceData = {
  summary: {
    total: number;
    present: number;
    absent: number;
    percentage: number | null;
  };
  filteredSummary: {
    total: number;
    present: number;
    absent: number;
    percentage: number | null;
  };
  monthlySummary: {
    year: number;
    month: number;
    status: "present" | "absent";
    count: number;
  }[];
  records: AttendanceRow[];
  pagination: {
    page: number;
    total: number;
    totalPages: number;
  };
};

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const MONTHS = [
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

const money = (value: number) =>
  "₹" +
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const date = (value?: string) =>
  value
    ? new Date(value.slice(0, 10) + "T12:00:00").toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const prettyTime = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);

  return (
    (hour % 12 || 12) +
    ":" +
    String(minute).padStart(2, "0") +
    " " +
    (hour >= 12 ? "PM" : "AM")
  );
};

async function detailsApi(path: string) {
  const response = await fetch(API + path, {
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error ?? "Could not load this student record.");
  }

  return data;
}

function StudentDetailsContent() {
  const params = useParams<{ studentId: string }>();
  const router = useRouter();
  const studentId = params.studentId;

  const { activateRole, clearRole } = useTheme();

  const now = new Date();

  // Tabs and filters
  const [tab, setTab] = useState("Overview");
  const [year, setYear] = useState(now.getFullYear());
  const [feeMonth, setFeeMonth] = useState("all");
  const [paymentPage, setPaymentPage] = useState(1);
  const [examPage, setExamPage] = useState(1);
  const [attendanceYear, setAttendanceYear] = useState("all");
  const [attendanceMonth, setAttendanceMonth] = useState("all");
  const [attendancePage, setAttendancePage] = useState(1);

  // Main data
  const [student, setStudent] = useState<Student | null>(null);
  const [fees, setFees] = useState<FeeData | null>(null);
  const [exams, setExams] = useState<ExamData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);

  // Loading and errors
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [sectionErrors, setSectionErrors] = useState<
    Record<string, string>
  >({});

  // Modals
  const [receipt, setReceipt] = useState<Payment | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetPasswordMessage, setResetPasswordMessage] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState("");

  // Load student and history data
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setSectionErrors({});

    try {
      const sessionResponse = await fetch(API + "/auth/session", {
        credentials: "include",
      });

      const session = sessionResponse.ok
        ? await sessionResponse.json()
        : null;

      if (session?.user?.role !== "admin") {
        clearRole();
        setError(
          "Administrator access is required to view student records."
        );
        setLoading(false);
        router.replace("/admin/login");
        return;
      }

      activateRole("admin");
    } catch {
      clearRole();
      setError("Could not verify administrator access.");
      setLoading(false);
      router.replace("/admin/login");
      return;
    }

    const attendanceParams = new URLSearchParams({
      year: attendanceYear,
      month: attendanceMonth,
      page: String(attendancePage),
      limit: "20",
    });

    const tasks = [
      detailsApi("/students/" + encodeURIComponent(studentId)),

      detailsApi(
        "/fees/students/" +
          encodeURIComponent(studentId) +
          "?year=" +
          year +
          "&paymentPage=" +
          paymentPage +
          "&paymentLimit=20"
      ),

      detailsApi(
        "/exams/students/" +
          encodeURIComponent(studentId) +
          "/history?page=" +
          examPage +
          "&limit=20"
      ),

      detailsApi(
        "/attendance/history/" +
          encodeURIComponent(studentId) +
          "?" +
          attendanceParams.toString()
      ),
    ];

    const [
      studentResult,
      feeResult,
      examResult,
      attendanceResult,
    ] = await Promise.allSettled(tasks);

    if (studentResult.status === "fulfilled") {
      setStudent(studentResult.value.student as Student);
    } else {
      setError(
        studentResult.reason instanceof Error
          ? studentResult.reason.message
          : "Student could not be found."
      );
    }

    const nextErrors: Record<string, string> = {};

    if (feeResult.status === "fulfilled") {
      setFees(feeResult.value as FeeData);
    } else {
      nextErrors.fees =
        feeResult.reason instanceof Error
          ? feeResult.reason.message
          : "Could not load fee history.";
    }

    if (examResult.status === "fulfilled") {
      setExams(examResult.value as ExamData);
    } else {
      nextErrors.exams =
        examResult.reason instanceof Error
          ? examResult.reason.message
          : "Could not load exam history.";
    }

    if (attendanceResult.status === "fulfilled") {
      setAttendance(attendanceResult.value as AttendanceData);
    } else {
      nextErrors.attendance =
        attendanceResult.reason instanceof Error
          ? attendanceResult.reason.message
          : "Could not load attendance history.";
    }

    setSectionErrors(nextErrors);
    setLoading(false);
  }, [
    studentId,
    year,
    paymentPage,
    examPage,
    attendanceYear,
    attendanceMonth,
    attendancePage,
    activateRole,
    clearRole,
    router,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  // Student actions
  const editStudent = () =>
    router.push(
      "/admin?section=Students&edit=" + encodeURIComponent(studentId)
    );

  const toggleStudentStatus = async () => {
    if (!student || statusUpdating) return;

    const active = !student.active;

    const confirmed = window.confirm(
      `${active ? "Activate" : "Deactivate"} ${student.name}?`
    );

    if (!confirmed) return;

    setStatusUpdating(true);
    setError("");

    try {
      const response = await fetch(
        API + "/students/" + encodeURIComponent(studentId) + "/active",
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ active }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Could not update student status.");
      }

      setStudent((current) =>
        current ? { ...current, active } : current
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not update student status."
      );
    } finally {
      setStatusUpdating(false);
    }
  };

  const deleteStudent = async () => {
    if (!student || deleting) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${student.name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      const response = await fetch(
        API + "/students/" + encodeURIComponent(student._id),
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Could not delete student.");
      }

      alert("Student deleted successfully.");
      router.push("/admin?section=Students");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not delete student."
      );
    } finally {
      setDeleting(false);
    }
  };

  // Reset student password
  const openResetPassword = () => {
    setNewPassword("");
    setResetPasswordMessage("");
    setResetPasswordError("");
    setShowResetPassword(true);
  };

  const resetStudentPassword = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!student || resettingPassword) return;

    const password = newPassword;

    if (password.length < 8 || password.length > 128) {
      setResetPasswordError(
        "Password must be between 8 and 128 characters."
      );
      return;
    }

    if (new TextEncoder().encode(password).length > 72) {
      setResetPasswordError(
        "Password must not exceed 72 UTF-8 bytes."
      );
      return;
    }

    setResettingPassword(true);
    setResetPasswordError("");
    setResetPasswordMessage("");

    try {
      const response = await fetch(
        API +
          "/students/" +
          encodeURIComponent(student._id) +
          "/reset-password",
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Could not reset student password.");
      }

      setResetPasswordMessage("Student password reset successfully.");
      setNewPassword("");
    } catch (error) {
      setResetPasswordError(
        error instanceof Error
          ? error.message
          : "Could not reset student password."
      );
    } finally {
      setResettingPassword(false);
    }
  };

  // Options and derived data
  const yearOptions = Array.from(
    { length: Math.max(1, now.getFullYear() - 1999) },
    (_, index) => now.getFullYear() - index
  );

  const filteredMonths = useMemo(
    () =>
      (fees?.months ?? []).filter(
        (item) =>
          feeMonth === "all" || item.month === Number(feeMonth)
      ),
    [fees, feeMonth]
  );

  const monthlyAttendance = useMemo(() => {
    const counts = new Map<
      number,
      { present: number; absent: number }
    >();

    for (const row of attendance?.monthlySummary ?? []) {
      if (
        attendanceYear !== "all" &&
        row.year !== Number(attendanceYear)
      ) {
        continue;
      }

      const monthCounts = counts.get(row.month) ?? {
        present: 0,
        absent: 0,
      };

      monthCounts[row.status] += row.count;
      counts.set(row.month, monthCounts);
    }

    return Array.from(counts, ([month, value]) => ({
      month,
      ...value,
      total: value.present + value.absent,
      percentage:
        value.present + value.absent
          ? Number(
              (
                (value.present / (value.present + value.absent)) *
                100
              ).toFixed(2)
            )
          : 0,
    })).sort((a, b) => a.month - b.month);
  }, [attendance, attendanceYear]);

  const recentPayments = fees?.payments.slice(0, 5) ?? [];
  const recentExams = exams?.results.slice(0, 5) ?? [];
  const recentAttendance = attendance?.records.slice(0, 5) ?? [];

  // Shared Tailwind classes
  const buttonClass =
    "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

  const primaryButtonClass =
    "inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50";

  const tableClass =
    "w-full min-w-[680px] border-collapse text-left text-sm";

  const tableWrapperClass =
    "w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800";

  const emptyClass =
    "p-6 text-center text-sm text-slate-500 dark:text-slate-400";

  const statusClass = (active: boolean) =>
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold " +
    (active
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
      : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:px-6 lg:px-8">
        <button
          className={buttonClass}
          onClick={() => router.push("/admin?section=Students")}
        >
          ← Back to Students
        </button>

        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white shadow-sm">
            ✳
          </span>

          <span className="hidden sm:block">
            <strong className="block text-sm font-bold text-slate-900 dark:text-white">
              Udaan Learning Centre
            </strong>

            <small className="text-xs text-slate-500 dark:text-slate-400">
              Tuition Management System
            </small>
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {loading && !student && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Loading student details…
          </div>
        )}

        {error && (
          <section
            className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
            role="alert"
          >
            <h1 className="text-lg font-bold">
              Student details unavailable
            </h1>

            <p className="mt-2 text-sm">{error}</p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className={buttonClass}
                onClick={() => router.push("/admin?section=Students")}
              >
                Back to Students
              </button>

              <button
                className={primaryButtonClass}
                onClick={() => void load()}
              >
                Retry
              </button>
            </div>
          </section>
        )}

        {student && (
          <>
            <StudentProfileHeader
              student={student}
              statusUpdating={statusUpdating}
              deleting={deleting}
              buttonClass={buttonClass}
              onToggleStatus={toggleStudentStatus}
              onEdit={editStudent}
              onDelete={deleteStudent}
              onResetPassword={openResetPassword}
              money={money}
              date={date}
              prettyTime={prettyTime}
            />

            {/* Summary cards */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {[
                {
                  label: "Total fees due",
                  value: fees?.ledgerCount
                    ? money(fees.totals.dueAmount)
                    : "—",
                  description: "Across recorded unpaid months",
                  color: "text-rose-600 dark:text-rose-400",
                },
                {
                  label: "Total fees paid",
                  value: fees?.ledgerCount
                    ? money(fees.totals.paidAmount)
                    : "—",
                  description: "All recorded history",
                  color: "text-emerald-600 dark:text-emerald-400",
                },
                {
                  label: "Exam average",
                  value:
                    exams?.summary.overallAverage === null ||
                    exams?.summary.overallAverage === undefined
                      ? "—"
                      : exams.summary.overallAverage + "%",
                  description: exams?.summary.examsTaken
                    ? "Weighted by total marks"
                    : "No exam results recorded",
                  color: "text-indigo-600 dark:text-indigo-400",
                },
                {
                  label: "Attendance",
                  value:
                    attendance?.summary.percentage === null ||
                    attendance?.summary.percentage === undefined
                      ? "—"
                      : attendance.summary.percentage + "%",
                  description: attendance?.summary.total
                    ? attendance.summary.total + " marked classes"
                    : "No attendance records",
                  color: "text-sky-600 dark:text-sky-400",
                },
                {
                  label: "Total tests given",
                  value: exams?.summary.examsTaken ?? "—",
                  description: "Tests with marks recorded",
                  color: "text-violet-600 dark:text-violet-400",
                },
              ].map((metric) => (
                <article
                  key={metric.label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {metric.label}
                  </p>

                  <strong
                    className={`mt-3 block break-words text-2xl font-bold ${metric.color}`}
                  >
                    {metric.value}
                  </strong>

                  <span className="mt-2 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {metric.description}
                  </span>
                </article>
              ))}
            </section>

            {/* Tabs */}
            <nav
              className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              aria-label="Student details tabs"
            >
              {[
                "Overview",
                "Fees History",
                "Exam History",
                "Attendance History",
              ].map((item) => (
                <button
                  key={item}
                  className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    tab === item
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                  onClick={() => setTab(item)}
                >
                  {item}
                </button>
              ))}
            </nav>

            {loading && (
              <div
                className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
                role="status"
              >
                Updating selected history…
              </div>
            )}

            {/* Overview */}
            {tab === "Overview" && (
              <StudentOverview
                dueAmount={fees?.totals.dueAmount ?? 0}
                hasFeeLedger={Boolean(fees?.ledgerCount)}
                unpaidMonths={fees?.unpaidMonths ?? []}
                recentPayments={recentPayments}
                recentExams={recentExams}
                recentAttendance={recentAttendance}
                feeError={sectionErrors.fees}
                examError={sectionErrors.exams}
                attendanceError={sectionErrors.attendance}
                money={money}
                date={date}
                months={MONTHS}
                emptyClass={emptyClass}
                statusClass={statusClass}
                onViewFees={() => setTab("Fees History")}
                onViewExams={() => setTab("Exam History")}
                onViewAttendance={() => setTab("Attendance History")}
                onOpenReceipt={(payment) => setReceipt(payment)}
              />
            )}

            {/* Fees History */}
            {tab === "Fees History" && (
              <StudentFeesHistory
                fees={fees}
                filteredMonths={filteredMonths}
                year={year}
                yearOptions={yearOptions}
                feeMonth={feeMonth}
                paymentPage={paymentPage}
                sectionError={sectionErrors.fees || ""}
                buttonClass={buttonClass}
                tableClass={tableClass}
                tableWrapperClass={tableWrapperClass}
                emptyClass={emptyClass}
                months={MONTHS}
                money={money}
                date={date}
                onYearChange={(value) => {
                  setYear(value);
                  setPaymentPage(1);
                }}
                onMonthChange={setFeeMonth}
                onPaymentPageChange={setPaymentPage}
                onRetry={() => void load()}
                onOpenReceipt={(payment) => setReceipt(payment)}
              />
            )}

            {/* Exam History */}
            {tab === "Exam History" && (
              <StudentExamHistory
                exams={exams}
                sectionError={sectionErrors.exams || ""}
                buttonClass={buttonClass}
                tableClass={tableClass}
                tableWrapperClass={tableWrapperClass}
                emptyClass={emptyClass}
                onRetry={() => void load()}
                onPageChange={setExamPage}
                date={date}
              />
            )}

            {/* Attendance History */}
            {tab === "Attendance History" && (
              <StudentAttendanceHistory
                attendance={attendance}
                monthlyAttendance={monthlyAttendance}
                attendanceYear={attendanceYear}
                attendanceMonth={attendanceMonth}
                yearOptions={yearOptions}
                months={MONTHS}
                sectionError={sectionErrors.attendance || ""}
                buttonClass={buttonClass}
                tableClass={tableClass}
                tableWrapperClass={tableWrapperClass}
                emptyClass={emptyClass}
                statusClass={statusClass}
                onYearChange={(value) => {
                  setAttendanceYear(value);
                  setAttendancePage(1);
                }}
                onMonthChange={(value) => {
                  setAttendanceMonth(value);
                  setAttendancePage(1);
                }}
                onPageChange={setAttendancePage}
                onRetry={() => void load()}
                date={date}
              />
            )}
          </>
        )}
      </div>

      {/* Reset password modal */}
      {showResetPassword && student && (
        <StudentResetPasswordModal
          studentName={student.name}
          newPassword={newPassword}
          resettingPassword={resettingPassword}
          resetPasswordMessage={resetPasswordMessage}
          resetPasswordError={resetPasswordError}
          buttonClass={buttonClass}
          onPasswordChange={setNewPassword}
          onSubmit={resetStudentPassword}
          onClose={() => setShowResetPassword(false)}
        />
      )}

      {/* Payment receipt modal */}
      {receipt && (
        <StudentReceiptModal
          receipt={receipt}
          studentName={student?.name || "—"}
          studentId={student?.studentId}
          months={MONTHS}
          money={money}
          date={date}
          buttonClass={buttonClass}
          primaryButtonClass={primaryButtonClass}
          onClose={() => setReceipt(null)}
        />
      )}
    </main>
  );
}

export default function StudentDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
          <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Loading student details…
          </div>
        </main>
      }
    >
      <StudentDetailsContent />
    </Suspense>
  );
}