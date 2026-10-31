"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import NextImage from "next/image";
import { useTheme } from "@/components/ThemeProvider";

type Batch = {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  active?: boolean;
};

type Student = {
  _id: string;
  studentId?: string;
  name: string;
  fatherName?: string;
  phone: string;
  address?: string;
  gender?: string;
  className?: string;
  batchId?: Batch | null;
  admissionDate?: string;
  monthlyFees?: number | null;
  profilePhoto?: string;
  active: boolean;
  createdAt?: string;
};

type Month = {
  year: number;
  month: number;
  feeAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
};

type Payment = {
  _id: string;
  receiptNumber: string;
  amount: number;
  paymentDate: string;
  method: string;
  referenceNumber: string;
  allocations: { year: number; month: number; amount: number }[];
  student?: { studentId?: string; name: string };
};

type FeeData = {
  student: Student;
  year: number;
  months: Month[];
  unpaidMonths: Month[];
  totals: { paidAmount: number; dueAmount: number };
  ledgerCount: number;
  payments: Payment[];
  paymentPagination: { page: number; total: number; totalPages: number };
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
  pagination: { page: number; total: number; totalPages: number };
  summary: {
    examsTaken: number;
    totalObtained: number;
    totalPossible: number;
    overallAverage: number | null;
    subjectAverages: { subject: string; average: number; count: number }[];
  };
};

type AttendanceRow = {
  _id: string;
  date: string;
  status: "present" | "absent";
  batch?: { name: string };
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
  pagination: { page: number; total: number; totalPages: number };
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
    throw new Error(
      data.error ?? "Could not load this student record."
    );
  }

  return data;
}

function StudentDetailsContent() {
  const params = useParams<{ studentId: string }>();
  const router = useRouter();
  const studentId = params.studentId;

  const { activateRole, clearRole } = useTheme();

  const now = new Date();

  const [tab, setTab] = useState("Overview");
  const [year, setYear] = useState(now.getFullYear());
  const [feeMonth, setFeeMonth] = useState("all");
  const [paymentPage, setPaymentPage] = useState(1);
  const [examPage, setExamPage] = useState(1);
  const [attendanceYear, setAttendanceYear] = useState("all");
  const [attendanceMonth, setAttendanceMonth] = useState("all");
  const [attendancePage, setAttendancePage] = useState(1);

  const [student, setStudent] = useState<Student | null>(null);
  const [fees, setFees] = useState<FeeData | null>(null);
  const [exams, setExams] = useState<ExamData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);

  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>(
    {}
  );
  const [receipt, setReceipt] = useState<Payment | null>(null);

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

  const yearOptions = Array.from(
    { length: Math.max(1, now.getFullYear() - 1999) },
    (_, index) => now.getFullYear() - index
  );

  const filteredMonths = useMemo(
    () =>
      (fees?.months ?? []).filter(
        (item) => feeMonth === "all" || item.month === Number(feeMonth)
      ),
    [fees, feeMonth]
  );

  const monthlyAttendance = useMemo(() => {
    const counts = new Map<number, { present: number; absent: number }>();

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

  const buttonClass =
    "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

  const primaryButtonClass =
    "inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50";

  const panelClass =
    "min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6";

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
            <h1 className="text-lg font-bold">Student details unavailable</h1>
            <p className="mt-2 text-sm">{error}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className={buttonClass}
                onClick={() => router.push("/admin?section=Students")}
              >
                Back to Students
              </button>
              <button className={primaryButtonClass} onClick={() => void load()}>
                Retry
              </button>
            </div>
          </section>
        )}

        {student && (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
                  
<div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
  {/* Left: Student Photo and Details */}
  <div className="flex min-w-0 items-center gap-4">
    {student.profilePhoto ? (
      <NextImage
        className="h-[88px] w-[88px] shrink-0 rounded-2xl object-cover ring-4 ring-indigo-50 dark:ring-indigo-950"
        src={student.profilePhoto}
        alt={student.name}
        width={88}
        height={88}
        unoptimized
      />
    ) : (
      <span className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-3xl font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
        {student.name.slice(0, 1).toUpperCase()}
      </span>
    )}

    <div className="min-w-0">
      <div className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
        Student Profile
      </div>

      <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        {student.name}
      </h1>

      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {student.studentId || "Student ID unavailable"}
      </p>

      <span
        className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
          student.active
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
        }`}
      >
        {student.active ? "Active" : "Inactive"}
      </span>
    </div>
  </div>

  {/* Right: Toggle, Edit and Delete */}
  <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
    <button
      type="button"
      role="switch"
      aria-checked={student.active}
      aria-label="Toggle student account status"
      disabled={statusUpdating}
      onClick={toggleStudentStatus}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
        student.active
          ? "bg-green-500"
          : "bg-slate-300 dark:bg-slate-600"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          student.active ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>

    <button
      className={primaryButtonClass}
      onClick={editStudent}
    >
      Edit Student
    </button>

    <button
      className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
      onClick={deleteStudent}
      disabled={deleting}
    >
      {deleting ? "Deleting..." : "Delete Student"}
    </button>
  </div>
</div>

              <dl className="mt-7 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 dark:border-slate-800 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Father's name", value: student.fatherName || "—" },
                  { label: "Phone number", value: student.phone || "—" },
                  { label: "Address", value: student.address || "—" },
                  { label: "Gender", value: student.gender || "—" },
                  { label: "Class", value: student.className || "—" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60"
                  >
                    <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {item.label}
                    </dt>
                    <dd className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {item.value}
                    </dd>
                  </div>
                ))}

                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Batch
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {student.batchId ? (
                      <>
                        {student.batchId.name}
                        <small className="mt-1 block font-normal text-slate-500 dark:text-slate-400">
                          {prettyTime(student.batchId.startTime)} –{" "}
                          {prettyTime(student.batchId.endTime)}
                        </small>
                      </>
                    ) : (
                      "Unassigned"
                    )}
                  </dd>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Admission date
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {date(student.admissionDate || student.createdAt)}
                  </dd>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Monthly fees
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {typeof student.monthlyFees === "number"
                      ? money(student.monthlyFees)
                      : "—"}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {[
                {
                  label: "Total fees due",
                  value: fees?.ledgerCount ? money(fees.totals.dueAmount) : "—",
                  description: "Across recorded unpaid months",
                  color: "text-rose-600 dark:text-rose-400",
                },
                {
                  label: "Total fees paid",
                  value: fees?.ledgerCount ? money(fees.totals.paidAmount) : "—",
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
                  <strong className={`mt-3 block break-words text-2xl font-bold ${metric.color}`}>
                    {metric.value}
                  </strong>
                  <span className="mt-2 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {metric.description}
                  </span>
                </article>
              ))}
            </section>

            <nav
              className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              aria-label="Student details tabs"
            >
              {["Overview", "Fees History", "Exam History", "Attendance History"].map(
                (item) => (
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
                )
              )}
            </nav>

            {loading && (
              <div
                className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
                role="status"
              >
                Updating selected history…
              </div>
            )}

            {tab === "Overview" && (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <section className={`${panelClass} lg:col-span-2`}>
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Current dues
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Outstanding monthly fee balance
                      </p>
                    </div>
                    <strong className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                      {fees?.ledgerCount ? money(fees.totals.dueAmount) : "—"}
                    </strong>
                  </div>

                  {fees?.unpaidMonths?.length ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {fees.unpaidMonths
                        .slice(-5)
                        .reverse()
                        .map((item) => (
                          <div
                            key={item.year + "-" + item.month}
                            className="flex items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20"
                          >
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              {MONTHS[item.month - 1]} {item.year}
                            </span>
                            <b className="text-sm font-bold text-rose-600 dark:text-rose-400">
                              {money(item.remainingAmount)}
                            </b>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className={emptyClass}>
                      {fees?.ledgerCount
                        ? "No outstanding fee balance."
                        : "No fee ledger records are available."}
                    </div>
                  )}
                </section>

                <section className={panelClass}>
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Recent fee payments
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Latest recorded transactions
                      </p>
                    </div>
                    <button
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                      onClick={() => setTab("Fees History")}
                    >
                      View history →
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentPayments.map((item) => (
                      <div
                        key={item._id}
                        className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
                      >
                        <div className="min-w-0">
                          <strong className="block break-all text-sm text-slate-800 dark:text-slate-100">
                            {item.receiptNumber}
                          </strong>
                          <small className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                            {date(item.paymentDate)} · {item.method}
                          </small>
                        </div>
                        <div className="flex items-center gap-3">
                          <b className="text-sm">{money(item.amount)}</b>
                          <button
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                            onClick={() => setReceipt(item)}
                          >
                            Receipt
                          </button>
                        </div>
                      </div>
                    ))}
                    {!recentPayments.length && (
                      <div className={emptyClass}>
                        {sectionErrors.fees || "No payment transactions recorded."}
                      </div>
                    )}
                  </div>
                </section>

                <section className={panelClass}>
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Recent exam results
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Marks and percentages
                      </p>
                    </div>
                    <button
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                      onClick={() => setTab("Exam History")}
                    >
                      View history →
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentExams.map((item) => (
                      <div
                        key={item.examId}
                        className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
                      >
                        <div>
                          <strong className="block text-sm text-slate-800 dark:text-slate-100">
                            {item.name || item.subject}
                          </strong>
                          <small className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                            {date(item.examDate)} · {item.subject}
                          </small>
                        </div>
                        <b className="text-sm">
                          {item.obtainedMarks} / {item.totalMarks} · {item.percentage}%
                        </b>
                      </div>
                    ))}
                    {!recentExams.length && (
                      <div className={emptyClass}>
                        {sectionErrors.exams || "No exam results recorded."}
                      </div>
                    )}
                  </div>
                </section>

                <section className={`${panelClass} lg:col-span-2`}>
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Recent attendance
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Latest marked classes
                      </p>
                    </div>
                    <button
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                      onClick={() => setTab("Attendance History")}
                    >
                      View history →
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentAttendance.map((item) => (
                      <div
                        key={item._id}
                        className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
                      >
                        <div>
                          <strong className="block text-sm text-slate-800 dark:text-slate-100">
                            {date(item.date)}
                          </strong>
                          <small className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                            {item.batch?.name || "Batch unavailable"}
                          </small>
                        </div>
                        <span className={statusClass(item.status === "present")}>
                          {item.status === "present" ? "Present" : "Absent"}
                        </span>
                      </div>
                    ))}
                    {!recentAttendance.length && (
                      <div className={emptyClass}>
                        {sectionErrors.attendance || "No attendance records found."}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {tab === "Fees History" && (
              <section className={`${panelClass} space-y-6`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Fees History
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Monthly fee balances and transaction receipts
                    </p>
                  </div>

                  <label className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                    Year
                    <select
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      value={year}
                      onChange={(event) => {
                        setYear(Number(event.target.value));
                        setPaymentPage(1);
                      }}
                    >
                      {yearOptions.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                      feeMonth === "all"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                    onClick={() => setFeeMonth("all")}
                  >
                    All months
                  </button>

                  {MONTHS.map((item, index) => (
                    <button
                      key={item}
                      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                        feeMonth === String(index + 1)
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                      onClick={() => setFeeMonth(String(index + 1))}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                {sectionErrors.fees && (
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
                    role="alert"
                  >
                    {sectionErrors.fees}
                    <button className={buttonClass} onClick={() => void load()}>
                      Retry
                    </button>
                  </div>
                )}

                <div className={tableWrapperClass}>
                  <table className={tableClass}>
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      <tr>
                        {["Month", "Fee amount", "Paid amount", "Remaining", "Status"].map(
                          (heading) => (
                            <th className="px-4 py-3 font-semibold" key={heading}>
                              {heading}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredMonths.map((item) => (
                        <tr
                          className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          key={item.month}
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-medium">
                            {MONTHS[item.month - 1]} {item.year}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {money(item.feeAmount)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-emerald-600 dark:text-emerald-400">
                            {money(item.paidAmount)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-rose-600 dark:text-rose-400">
                            {money(item.remainingAmount)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold " +
                                (item.status === "Paid"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                  : item.status === "Due"
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300")
                              }
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!filteredMonths.length && (
                        <tr>
                          <td colSpan={5} className={emptyClass}>
                            {fees?.ledgerCount
                              ? "No ledger rows for this period."
                              : "No fee ledger records are available."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Payment transactions
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Receipt, date, method, reference and fee allocation
                    </p>
                  </div>
                  <strong className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {money(fees?.totals.paidAmount ?? 0)} total recorded
                  </strong>
                </div>

                <div className={tableWrapperClass}>
                  <table className={tableClass}>
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      <tr>
                        {[
                          "Payment date",
                          "Receipt",
                          "Method / Reference",
                          "Allocation",
                          "Amount",
                          "Receipt",
                        ].map((heading, index) => (
                          <th className="px-4 py-3 font-semibold" key={heading + index}>
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {fees?.payments.map((item) => (
                        <tr
                          className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          key={item._id}
                        >
                          <td className="whitespace-nowrap px-4 py-3">
                            {date(item.paymentDate)}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {item.receiptNumber}
                          </td>
                          <td className="px-4 py-3">
                            {item.method}
                            {item.referenceNumber ? " · " + item.referenceNumber : ""}
                          </td>
                          <td className="px-4 py-3">
                            {item.allocations
                              .map(
                                (allocation) =>
                                  MONTHS[allocation.month - 1].slice(0, 3) +
                                  " " +
                                  allocation.year
                              )
                              .join(", ")}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-semibold">
                            {money(item.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              className={`${buttonClass} whitespace-nowrap px-3 py-2 text-xs`}
                              onClick={() => setReceipt(item)}
                            >
                              View / Print
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!fees?.payments.length && (
                        <tr>
                          <td colSpan={6} className={emptyClass}>
                            No payment transactions recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {fees?.paymentPagination && (
                  <StudentPager
                    page={fees.paymentPagination.page}
                    totalPages={fees.paymentPagination.totalPages}
                    total={fees.paymentPagination.total}
                    onChange={setPaymentPage}
                  />
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Total amount paid
                    </span>
                    <strong className="mt-2 block text-xl font-bold text-emerald-700 dark:text-emerald-400">
                      {money(fees?.totals.paidAmount ?? 0)}
                    </strong>
                  </div>
                  <div className="rounded-xl bg-rose-50 p-4 dark:bg-rose-950/30">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Total outstanding
                    </span>
                    <strong className="mt-2 block text-xl font-bold text-rose-700 dark:text-rose-400">
                      {money(fees?.totals.dueAmount ?? 0)}
                    </strong>
                  </div>
                </div>
              </section>
            )}

            {tab === "Exam History" && (
              <section className={`${panelClass} space-y-6`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Exam History
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Individual test results, subject averages and overall weighted average
                    </p>
                  </div>
                  <div className="rounded-2xl bg-indigo-50 px-5 py-3 dark:bg-indigo-950/50">
                    <strong className="block text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                      {exams?.summary.overallAverage === null ||
                      exams?.summary.overallAverage === undefined
                        ? "—"
                        : exams.summary.overallAverage + "%"}
                    </strong>
                    <small className="text-xs text-slate-500 dark:text-slate-400">
                      Overall average
                    </small>
                  </div>
                </div>

                {sectionErrors.exams && (
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
                    role="alert"
                  >
                    {sectionErrors.exams}
                    <button className={buttonClass} onClick={() => void load()}>
                      Retry
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {exams?.summary.subjectAverages.map((item) => (
                    <div
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
                      key={item.subject}
                    >
                      <span className="block text-sm text-slate-600 dark:text-slate-300">
                        {item.subject}
                      </span>
                      <strong className="mt-1 block text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        {item.average}%
                      </strong>
                    </div>
                  ))}
                  {exams?.summary.subjectAverages.length === 0 && (
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      No subject averages yet.
                    </span>
                  )}
                </div>

                <div className={tableWrapperClass}>
                  <table className={tableClass}>
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      <tr>
                        {[
                          "Exam date",
                          "Exam / Test",
                          "Subject",
                          "Batch",
                          "Total marks",
                          "Obtained",
                          "Percentage",
                        ].map((heading) => (
                          <th className="px-4 py-3 font-semibold" key={heading}>
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {exams?.results.map((item) => (
                        <tr
                          className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          key={item.examId}
                        >
                          <td className="whitespace-nowrap px-4 py-3">
                            {date(item.examDate)}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {item.name || item.subject}
                          </td>
                          <td className="px-4 py-3">{item.subject}</td>
                          <td className="px-4 py-3">{item.batch?.name ?? "—"}</td>
                          <td className="px-4 py-3">{item.totalMarks}</td>
                          <td className="px-4 py-3 font-semibold">
                            {item.obtainedMarks}
                          </td>
                          <td className="px-4 py-3 font-semibold text-indigo-600 dark:text-indigo-400">
                            {item.percentage}%
                          </td>
                        </tr>
                      ))}
                      {!exams?.results.length && (
                        <tr>
                          <td colSpan={7} className={emptyClass}>
                            {sectionErrors.exams || "No exam results recorded."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {exams?.pagination && (
                  <StudentPager
                    page={exams.pagination.page}
                    totalPages={exams.pagination.totalPages}
                    total={exams.pagination.total}
                    onChange={setExamPage}
                  />
                )}

                <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                  Weighted average = total obtained marks ÷ total possible marks × 100.
                  Tests with missing marks are not counted.
                </div>
              </section>
            )}

            {tab === "Attendance History" && (
              <section className={`${panelClass} space-y-6`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Attendance History
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {attendance?.summary.total
                        ? attendance.summary.present +
                          " present · " +
                          attendance.summary.absent +
                          " absent · " +
                          attendance.summary.total +
                          " marked classes overall"
                        : "No attendance records have been marked."}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-indigo-50 px-5 py-3 dark:bg-indigo-950/50">
                    <strong className="block text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                      {attendance?.summary.percentage === null ||
                      attendance?.summary.percentage === undefined
                        ? "—"
                        : attendance.summary.percentage + "%"}
                    </strong>
                    <small className="text-xs text-slate-500 dark:text-slate-400">
                      Overall attendance
                    </small>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    Year
                    <select
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      value={attendanceYear}
                      onChange={(event) => {
                        setAttendanceYear(event.target.value);
                        setAttendancePage(1);
                      }}
                    >
                      <option value="all">All years</option>
                      {yearOptions.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    Month
                    <select
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      value={attendanceMonth}
                      onChange={(event) => {
                        setAttendanceMonth(event.target.value);
                        setAttendancePage(1);
                      }}
                    >
                      <option value="all">All months</option>
                      {MONTHS.map((item, index) => (
                        <option key={item} value={String(index + 1)}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {sectionErrors.attendance && (
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
                    role="alert"
                  >
                    {sectionErrors.attendance}
                    <button className={buttonClass} onClick={() => void load()}>
                      Retry
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {monthlyAttendance.map((item) => (
                    <article
                      key={item.month}
                      className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {MONTHS[item.month - 1]}
                        </span>
                        <strong className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                          {item.total ? item.percentage + "%" : "—"}
                        </strong>
                      </div>
                      <small className="mt-2 block text-xs text-slate-500 dark:text-slate-400">
                        {item.present} present · {item.absent} absent
                      </small>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{
                            width: item.total ? item.percentage + "%" : "0%",
                          }}
                        />
                      </div>
                    </article>
                  ))}
                  {!monthlyAttendance.length && (
                    <div className={emptyClass}>
                      No monthly attendance summary is available.
                    </div>
                  )}
                </div>

                <div className={tableWrapperClass}>
                  <table className={tableClass}>
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      <tr>
                        {["Date", "Batch", "Status"].map((heading) => (
                          <th className="px-4 py-3 font-semibold" key={heading}>
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {attendance?.records.map((item) => (
                        <tr
                          className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          key={item._id}
                        >
                          <td className="whitespace-nowrap px-4 py-3">
                            {date(item.date)}
                          </td>
                          <td className="px-4 py-3">
                            {item.batch?.name ?? "Batch unavailable"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={statusClass(item.status === "present")}>
                              {item.status === "present" ? "Present" : "Absent"}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!attendance?.records.length && (
                        <tr>
                          <td colSpan={3} className={emptyClass}>
                            {sectionErrors.attendance ||
                              "No marked attendance found for this filter."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {attendance?.pagination && (
                  <StudentPager
                    page={attendance.pagination.page}
                    totalPages={attendance.pagination.totalPages}
                    total={attendance.pagination.total}
                    onChange={setAttendancePage}
                  />
                )}
              </section>
            )}
          </>
        )}
      </div>

      {receipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setReceipt(null);
          }}
        >
          <section
            className="relative my-auto w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:p-8 print:bg-white print:text-black"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-receipt-title"
          >
            <button
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 print:hidden"
              onClick={() => setReceipt(null)}
              aria-label="Close receipt"
            >
              ×
            </button>

            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white">
                ✳
              </span>
              <div>
                <strong className="block text-base font-bold text-slate-900 dark:text-white">
                  Udaan Learning Centre
                </strong>
                <small className="text-xs text-slate-500 dark:text-slate-400">
                  Fee payment receipt
                </small>
              </div>
            </div>

            <h2
              id="student-receipt-title"
              className="text-xl font-bold text-slate-900 dark:text-white"
            >
              Payment receipt
            </h2>

            <div className="mb-6 mt-3 rounded-xl bg-slate-50 p-3 text-center font-mono font-bold tracking-wider text-slate-800 dark:bg-slate-800 dark:text-white">
              {receipt.receiptNumber}
            </div>

            <dl className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { label: "Student", value: student?.name || "—" },
                { label: "Student ID", value: student?.studentId || "—" },
                { label: "Payment date", value: date(receipt.paymentDate) },
                { label: "Payment method", value: receipt.method },
                { label: "Reference", value: receipt.referenceNumber || "—" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start justify-between gap-4 py-3"
                >
                  <dt className="text-sm text-slate-500 dark:text-slate-400">
                    {item.label}
                  </dt>
                  <dd className="break-words text-right text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {item.value}
                  </dd>
                </div>
              ))}

              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Amount received
                </dt>
                <dd className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {money(receipt.amount)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
              <strong className="block text-sm text-slate-800 dark:text-slate-100">
                Allocated months
              </strong>
              {receipt.allocations.map((item) => (
                <div
                  className="flex items-center justify-between gap-3 text-sm"
                  key={item.year + "-" + item.month}
                >
                  <span className="text-slate-600 dark:text-slate-300">
                    {MONTHS[item.month - 1]} {item.year}
                  </span>
                  <b className="text-slate-900 dark:text-white">
                    {money(item.amount)}
                  </b>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3 print:hidden">
              <button className={buttonClass} onClick={() => setReceipt(null)}>
                Close
              </button>
              <button
                className={primaryButtonClass}
                onClick={() => window.print()}
              >
                Print receipt
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function StudentPager({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}) {
  return (
    <footer className="flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
      <span>
        {total} records · Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          className="rounded-lg border border-slate-200 px-3 py-2 font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </button>
        <button
          className="rounded-lg border border-slate-200 px-3 py-2 font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
      </div>
    </footer>
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