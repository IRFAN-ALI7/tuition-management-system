"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

import { FeesManagement } from "@/components/admin/FeesManagement";
import { ExamsManagement } from "@/components/admin/ExamsManagement";
import { NoticesManagement } from "@/components/admin/NoticesManagement";

import DashboardOverview from "@/components/admin/DashboardOverview";
import StudentsList from "@/components/admin/StudentsList";
import BatchesList from "@/components/admin/BatchesList";
import AttendanceManagement from "@/components/admin/AttendanceManagement";
import BatchEditorModal from "@/components/admin/BatchEditorModal";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import AdminRightRail from "@/components/admin/AdminRightRail";
import AdminProfileSection from "@/components/admin/AdminProfileSection";
import AdminSettingsSection from "@/components/admin/AdminSettingsSection";
import AdminPageFooter from "@/components/admin/AdminPageFooter";

import type {
  Student,
  Batch,
  StudentSummary,
  BatchSummary,
  DashboardFeeSummary,
  StudentPagination,
  StudentFilters,
  AdminProfile,
  Section,
  BatchDraft,
} from "@/components/admin/types";

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const todayISO = () => {
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

const prettyTime = (time: string) => {
  const [h, m] = time.split(":").map(Number);

  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${
    h >= 12 ? "PM" : "AM"
  }`;
};

async function api(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw Object.assign(
      new Error(data.error ?? "Request failed. Please try again."),
      { details: data },
    );
  }

  return data;
}

type StudentEditDraft = {
  name: string;
  fatherName: string;
  phone: string;
  address: string;
  gender: string;
  className: string;
  batchId: string;
  admissionDate: string;
  monthlyFees: string;
};

const menu: { label: Section; icon: string }[] = [
  { label: "Dashboard", icon: "home" },
  { label: "Students", icon: "students" },
  { label: "Classes & Batches", icon: "batches" },
  { label: "Attendance", icon: "attendance" },
  { label: "Fees", icon: "fees" },
  { label: "Tests & Results", icon: "exams" },
  { label: "Notices", icon: "notices" },
  { label: "Reports", icon: "reports" },
  { label: "Audit Logs", icon: "audit" },
  { label: "Settings", icon: "settings" },
];

function StudentEditorModal({
  student,
  draft,
  setDraft,
  batches,
  error,
  onClose,
  onSubmit,
}: {
  student: Student;
  draft: StudentEditDraft;
  setDraft: (draft: StudentEditDraft) => void;
  batches: Batch[];
  error: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const currentBatch =
    typeof student.batchId === "object" && student.batchId
      ? student.batchId
      : null;

  const set = (key: keyof StudentEditDraft, value: string) =>
    setDraft({ ...draft, [key]: value });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
      onClick={onClose}
    >
      <section
        className="relative my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-edit-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 text-2xl text-gray-500"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="mb-2 text-xs font-semibold tracking-wider text-blue-600">
          STUDENT MANAGEMENT
        </div>

        <h2 id="student-edit-title" className="text-xl font-bold">
          Edit student
        </h2>

        <p className="mb-5 mt-1 text-sm text-gray-500">
          Update profile details or move this student to another active batch.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Student Name
              <input
                required
                maxLength={100}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950"
                value={draft.name}
                onChange={(event) => set("name", event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Father's Name
              <input
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950"
                value={draft.fatherName}
                onChange={(event) => set("fatherName", event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Phone
              <input
                required
                type="tel"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950"
                value={draft.phone}
                onChange={(event) => set("phone", event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Gender
              <select
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950"
                value={draft.gender}
                onChange={(event) => set("gender", event.target.value)}
              >
                <option value="">Not specified</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Class
              <select
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950"
                value={draft.className}
                onChange={(event) => set("className", event.target.value)}
              >
                <option value="">Not specified</option>
                {Array.from({ length: 12 }, (_, index) => `Class ${index + 1}`).map(
                  (value) => (
                    <option key={value}>{value}</option>
                  ),
                )}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Batch
              <select
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950"
                value={draft.batchId}
                onChange={(event) => set("batchId", event.target.value)}
              >
                <option value="">Unassigned</option>

                {currentBatch && !currentBatch.active && (
                  <option value={currentBatch._id}>
                    {currentBatch.name} (Inactive batch)
                  </option>
                )}

                {batches
                  .filter((batch) => batch.active)
                  .map((batch) => (
                    <option value={batch._id} key={batch._id}>
                      {batch.name} — {prettyTime(batch.startTime)}–
                      {prettyTime(batch.endTime)}
                    </option>
                  ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Monthly Fees (₹)
              <input
                required
                min="0"
                step="0.01"
                type="number"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950"
                value={draft.monthlyFees}
                onChange={(event) => set("monthlyFees", event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Admission Date
              <input
                required
                type="date"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950"
                value={draft.admissionDate}
                onChange={(event) => set("admissionDate", event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Address
              <textarea
                required
                rows={3}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950"
                value={draft.address}
                onChange={(event) => set("address", event.target.value)}
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Save changes →
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const globalSearchRef = useRef<HTMLInputElement>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  const [batchSummary, setBatchSummary] = useState<BatchSummary>({
    totalBatches: 0,
    activeBatches: 0,
    totalStudents: 0,
  });

  const [directory, setDirectory] = useState<Student[]>([]);
  const [batchStudentOptions, setBatchStudentOptions] = useState<Student[]>([]);

  const [studentSummary, setStudentSummary] = useState<StudentSummary>({
    total: 0,
    active: 0,
    inactive: 0,
    totalBatches: 0,
    growth: {},
  });

  const [dashboardFeeSummary, setDashboardFeeSummary] =
    useState<DashboardFeeSummary>({
      totalExpected: 0,
      feesCollected: 0,
      totalDue: 0,
      studentsPaid: 0,
      studentsDue: 0,
    });

  const [studentPagination, setStudentPagination] =
    useState<StudentPagination>({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
    });

  const [studentClasses, setStudentClasses] = useState<string[]>([]);
  const [studentListLoading, setStudentListLoading] = useState(false);
  const [studentListError, setStudentListError] = useState("");

  const [studentFilters, setStudentFilters] = useState<StudentFilters>({
    q: "",
    className: "all",
    batchId: "all",
    status: "all",
    page: 1,
    limit: 20,
  });

  const [studentEditing, setStudentEditing] = useState<Student | null>(null);

  const [studentDraft, setStudentDraft] = useState<StudentEditDraft>({
    name: "",
    fatherName: "",
    phone: "",
    address: "",
    gender: "",
    className: "",
    batchId: "",
    admissionDate: "",
    monthlyFees: "",
  });

  const [studentActionError, setStudentActionError] = useState("");

  const [batchId, setBatchId] = useState("");
  const [date, setDate] = useState("");
  const [todayLabel, setTodayLabel] = useState("");
  const [section, setSection] = useState<Section>("Dashboard");
  const [greeting, setGreeting] = useState("Good Morning");

  const [saved, setSaved] = useState(false);
  const { dark, activateRole, clearRole } = useTheme();
  const [mobileMenu, setMobileMenu] = useState(false);

  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);

  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  const [profileDraft, setProfileDraft] = useState({
    name: "",
    phone: "",
    email: "",
    image: "",
  });

  const [emailOtp, setEmailOtp] = useState("");

  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const [batchModal, setBatchModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  const [batchForm, setBatchForm] = useState<BatchDraft>({
    name: "",
    startTime: "09:00",
    endTime: "10:00",
    studentIds: [],
  });

  const [batchSearch, setBatchSearch] = useState("");

  const selectedBatch = batches.find((item) => item._id === batchId) ?? null;

  const present = useMemo(
    () => students.filter((student) => student.status === "present").length,
    [students],
  );

  const absent = students.length - present;

  const attendancePercentage = students.length
    ? Math.round((present / students.length) * 100)
    : 0;
      useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedSection = params.get("section");
    const editId = params.get("edit");

    if (
      requestedSection &&
      menu.some((item) => item.label === requestedSection)
    ) {
      const timer = window.setTimeout(() => {
        setSection(requestedSection as Section);

        if (editId && /^[a-f\d]{24}$/i.test(editId)) {
          void api("/students/" + editId)
            .then((result) => {
              const student = result.student as Student;

              const linkedBatchId =
                typeof student.batchId === "object" && student.batchId
                  ? student.batchId._id
                  : student.batchId ?? "";

              setStudentActionError("");
              setStudentEditing(student);

              setStudentDraft({
                name: student.name,
                fatherName: student.fatherName ?? "",
                phone: student.phone,
                address: student.address ?? "",
                gender: student.gender ?? "",
                className: student.className ?? "",
                batchId: linkedBatchId,
                admissionDate:
                  student.admissionDate ??
                  student.createdAt?.slice(0, 10) ??
                  "",
                monthlyFees:
                  student.monthlyFees == null
                    ? ""
                    : String(student.monthlyFees),
              });
            })
            .catch((error) =>
              setPageError(
                error instanceof Error
                  ? error.message
                  : "Could not load student details.",
              ),
            );
        }
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, []);

  const refreshBatches = async () => {
    const result = await api("/batches?includeInactive=true");

    setBatches(result.batches as Batch[]);

    if (result.summary) {
      setBatchSummary(result.summary as BatchSummary);
    }

    return result.batches as Batch[];
  };

  const refreshStudents = async () => {
    const result = await api("/students?page=1&limit=20");

    setDirectory(result.students as Student[]);
    setStudentSummary(result.summary as StudentSummary);
    setStudentPagination(result.pagination as StudentPagination);
    setStudentClasses(result.classes as string[]);

    return result;
  };

  const loadDashboardFees = async (selectedDate = todayISO()) => {
    const selected = new Date(`${selectedDate}T12:00:00`);

    try {
      const result = await api(
        `/fees?year=${selected.getFullYear()}&month=${
          selected.getMonth() + 1
        }&page=1&limit=1`,
      );

      setDashboardFeeSummary(result.summary as DashboardFeeSummary);
    } catch {
      // Fee API errors should not block the rest of the dashboard.
    }
  };

  const loadAttendance = async (id: string, selectedDate: string) => {
    if (!id) {
      setStudents([]);
      setSaved(false);
      setAttendanceLoading(false);
      return;
    }

    setAttendanceLoading(true);

    try {
      const result = await api(`/attendance/${id}?date=${selectedDate}`);

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

  const loadWorkspace = async (selectedDate = todayISO()) => {
    setLoading(true);
    setPageError("");

    try {
      const [, , profileResult] = await Promise.all([
        refreshBatches(),
        refreshStudents(),
        api("/auth/admin/profile"),
        loadDashboardFees(selectedDate),
      ]);

      const nextBatches = await refreshBatches();

      const active = nextBatches.filter((item) => item.active);

      const chosen =
        active.find((item) => item._id === batchId) ??
        active[0] ??
        nextBatches[0];

      setBatchId(chosen?._id ?? "");

      if (chosen) {
        await loadAttendance(chosen._id, selectedDate);
      }

      setAdminProfile(profileResult.profile as AdminProfile);

      setProfileDraft({
        name: profileResult.profile.name,
        phone: profileResult.profile.phone,
        email: profileResult.profile.email,
        image: profileResult.profile.image,
      });

      setAuthenticated(true);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Could not load the workspace.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialDate = todayISO();

    const dateTimer = window.setTimeout(() => {
      setDate(initialDate);

      setTodayLabel(
        new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      );

      const currentHour = new Date().getHours();

      setGreeting(
        currentHour < 12
          ? "Good Morning"
          : currentHour < 18
            ? "Good Afternoon"
            : "Good Evening",
      );
    }, 0);

    let active = true;

    void fetch(`${API}/auth/session`, {
      credentials: "include",
    })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((session) => {
        if (!active) return;

        if (!session) {
          clearRole();
          return;
        }

        if (session.user?.role !== "admin") {
          clearRole();
          setPageError(
            "An admin account is required to open this workspace.",
          );
          return;
        }

        activateRole("admin");
        void loadWorkspace(initialDate);
      })
      .catch(() => {
        if (active) clearRole();
      });

    return () => {
      active = false;
      window.clearTimeout(dateTimer);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activateRole, clearRole]);

  useEffect(() => {
    if (!authenticated || section !== "Students") return;

    let live = true;

    const timer = window.setTimeout(() => {
      setStudentListLoading(true);
      setStudentListError("");

      const params = new URLSearchParams({
        page: String(studentFilters.page),
        limit: String(studentFilters.limit),
        q: studentFilters.q,
        className: studentFilters.className,
        batchId: studentFilters.batchId,
        status: studentFilters.status,
      });

      void api(`/students?${params.toString()}`)
        .then((result) => {
          if (!live) return;

          setDirectory(result.students as Student[]);
          setStudentSummary(result.summary as StudentSummary);
          setStudentPagination(result.pagination as StudentPagination);
          setStudentClasses(result.classes as string[]);
        })
        .catch((error: Error) => {
          if (live) setStudentListError(error.message);
        })
        .finally(() => {
          if (live) setStudentListLoading(false);
        });
    }, studentFilters.q ? 250 : 0);

    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [authenticated, section, studentFilters]);

  useEffect(() => {
    if (!authenticated || !batchId || !date) return;

    const timer = window.setTimeout(() => {
      void loadAttendance(batchId, date).catch((error: Error) =>
        setPageError(error.message),
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, [date, batchId, authenticated]);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        globalSearchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", focusSearch);

    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const openNewBatch = () => router.push("/admin/batches/new");

  const openEditBatch = async (batch: Batch) => {
    setPageError("");
    setEditingBatch(batch);

    setBatchForm({
      name: batch.name,
      startTime: batch.startTime,
      endTime: batch.endTime,
      studentIds: batch.students.map((student) => student._id),
    });

    setBatchSearch("");

    try {
      const result = await api("/students?all=true");

      setBatchStudentOptions(result.students as Student[]);
      setBatchModal(true);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Could not load students for batch assignments.",
      );
    }
  };

  const saveBatch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPageError("");

    try {
      const path = editingBatch
        ? `/batches/${editingBatch._id}`
        : "/batches";

      const result = await api(path, {
        method: editingBatch ? "PATCH" : "POST",
        body: JSON.stringify(batchForm),
      });

      await Promise.all([refreshBatches(), refreshStudents()]);

      setBatchModal(false);
      setBatchId(result.batch._id);

      if (date) {
        await loadAttendance(result.batch._id, date);
      }

      setNotice(editingBatch ? "Batch updated." : "Batch created.");
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Could not save the batch.",
      );
    }
  };

  const toggleBatch = async (batch: Batch) => {
    const active = !batch.active;

    if (
      !active &&
      !window.confirm(
        `Deactivate ${batch.name}? Its students and attendance history will be kept. New attendance sessions will be disabled.`,
      )
    ) {
      return;
    }

    try {
      await api(`/batches/${batch._id}/active`, {
        method: "PATCH",
        body: JSON.stringify({ active }),
      });

      await refreshBatches();

      setNotice(`${batch.name} ${active ? "activated" : "deactivated"}.`);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Could not update batch status.",
      );
    }
  };

  const deleteBatch = async (batch: Batch) => {
    if (
      !window.confirm(
        `Delete ${batch.name}? This is allowed only when no students or attendance records are linked.`,
      )
    ) {
      return;
    }

    try {
      await api(`/batches/${batch._id}`, {
        method: "DELETE",
      });

      await refreshBatches();

      setNotice(`${batch.name} deleted.`);

      if (batchId === batch._id) {
        setBatchId("");
      }
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Could not delete batch.",
      );
    }
  };

  const saveAttendance = async () => {
    if (!selectedBatch?.active || !students.length || attendanceSaving) return;

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

  const openStudentCreation = () => router.push("/admin/students/new");

  const openStudentEditor = (student: Student) => {
    const linkedBatchId =
      typeof student.batchId === "object" && student.batchId
        ? student.batchId._id
        : student.batchId ?? "";

    setStudentActionError("");
    setStudentEditing(student);

    setStudentDraft({
      name: student.name,
      fatherName: student.fatherName ?? "",
      phone: student.phone,
      address: student.address ?? "",
      gender: student.gender ?? "",
      className: student.className ?? "",
      batchId: linkedBatchId,
      admissionDate:
        student.admissionDate ?? student.createdAt?.slice(0, 10) ?? "",
      monthlyFees:
        student.monthlyFees == null ? "" : String(student.monthlyFees),
    });
  };

  const saveStudentEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!studentEditing) return;

    setStudentActionError("");

    try {
      await api(`/students/${studentEditing._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...studentDraft,
          monthlyFees: Number(studentDraft.monthlyFees),
          batchId: studentDraft.batchId || null,
        }),
      });

      setStudentEditing(null);
      setNotice("Student details updated.");
      setStudentFilters((current) => ({ ...current }));
    } catch (error) {
      setStudentActionError(
        error instanceof Error ? error.message : "Could not update student.",
      );
    }
  };

  const changeStudentStatus = async (student: Student) => {
    const active = !student.active;

    if (
      !window.confirm(
        `${active ? "Activate" : "Deactivate"} ${student.name}?`,
      )
    ) {
      return;
    }

    try {
      await api(`/students/${student._id}/active`, {
        method: "PATCH",
        body: JSON.stringify({ active }),
      });

      setNotice(`${student.name} ${active ? "activated" : "deactivated"}.`);
      setStudentFilters((current) => ({ ...current }));
    } catch (error) {
      setStudentListError(
        error instanceof Error
          ? error.message
          : "Could not update student status.",
      );
    }
  };
    const saveProfile = async () => {
    setPageError("");
    setNotice("");

    try {
      const result = await api("/auth/admin/profile", {
        method: "PATCH",
        body: JSON.stringify(profileDraft),
      });

      const profileResult = result.profile
        ? result
        : await api("/auth/admin/profile");

      setAdminProfile(profileResult.profile as AdminProfile);

      setProfileDraft({
        name: profileResult.profile.name,
        phone: profileResult.profile.phone,
        email: profileResult.profile.email,
        image: profileResult.profile.image,
      });

      setNotice(
        result.message ??
          (profileResult.profile.pendingEmail
            ? "Verification code sent to the new email address."
            : "Profile updated."),
      );
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Could not update profile.",
      );
    }
  };

  const verifyProfileEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPageError("");

    try {
      const result = await api("/auth/admin/profile/email/verify", {
        method: "POST",
        body: JSON.stringify({ otp: emailOtp }),
      });

      setAdminProfile(result.profile as AdminProfile);

      setProfileDraft({
        name: result.profile.name,
        phone: result.profile.phone,
        email: result.profile.email,
        image: result.profile.image,
      });

      setEmailOtp("");
      setNotice("Email address verified.");
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Could not verify email.",
      );
    }
  };

  const resendProfileEmailOtp = async () => {
    setPageError("");

    try {
      const result = await api("/auth/admin/profile/email/resend", {
        method: "POST",
      });

      setNotice(result.message);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Could not send a new code.",
      );
    }
  };

  const chooseProfileImage = async (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPageError("Choose an image file.");
      return;
    }

    try {
      const imageUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        URL.revokeObjectURL(imageUrl);

        const canvas = document.createElement("canvas");

        const scale = Math.min(
          1,
          320 / Math.max(image.width, image.height),
        );

        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        canvas
          .getContext("2d")
          ?.drawImage(image, 0, 0, canvas.width, canvas.height);

        const data = canvas.toDataURL("image/jpeg", 0.76);

        if (data.length > 600_000) {
          setPageError(
            "This image is too large after compression. Choose a smaller image.",
          );
          return;
        }

        setProfileDraft((current) => ({ ...current, image: data }));
        setPageError("");
      };

      image.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        setPageError("Could not read that image.");
      };

      image.src = imageUrl;
    } catch {
      setPageError("Could not process that image.");
    }
  };

  return (
    <main
      className={`min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 ${
        dark ? "dark" : ""
      }`}
    >
      <div className="flex min-h-screen">
        <AdminSidebar
          section={section}
          mobileMenu={mobileMenu}
          adminProfile={adminProfile}
          setSection={setSection}
          setMobileMenu={setMobileMenu}
        />

        <div className="min-w-0 flex-1">
          <AdminTopbar
            section={section}
            adminProfile={adminProfile}
            search={search}
            setSearch={setSearch}
            globalSearchRef={globalSearchRef}
            setSection={setSection}
            setMobileMenu={setMobileMenu}
            batches={batches}
            api={api}
            setStudentFilters={setStudentFilters}
          />

          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
            <div
              className={`mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center ${
                section === "Dashboard" ||
                section === "Fees" ||
                section === "Notices"
                  ? "hidden"
                  : ""
              }`}
            >
              <div>
                <div className="text-xs font-semibold tracking-wider text-blue-600">
                  UDAAN LEARNING CENTRE · ADMIN WORKSPACE
                </div>

                <h1 className="mt-2 text-2xl font-bold">
                  {section === "Attendance" ? "Take attendance" : section}
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  {section === "Attendance"
                    ? "A little progress each day adds up to big results."
                    : `Welcome back. Manage your ${section.toLowerCase()} here.`}
                </p>
              </div>

              {section === "Attendance" && (
                <button
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700"
                  onClick={() =>
                    document.getElementById("attendance-date")?.focus()
                  }
                >
                  ▦ Today ⌄
                </button>
              )}
            </div>

            {pageError && (
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                <span>!</span>
                <p className="flex-1">{pageError}</p>

                {!authenticated && (
                  <Link
                    className="font-semibold underline"
                    href="/admin/login"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            )}

            {notice && (
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
                <span>✓</span>
                <p className="flex-1">{notice}</p>

                <button
                  aria-label="Dismiss message"
                  onClick={() => setNotice("")}
                >
                  ×
                </button>
              </div>
            )}

            {!authenticated ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-3 text-4xl">♙</div>

                <h2 className="text-xl font-bold">
                  Sign in to your admin workspace
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500">
                  Batch schedules, students and attendance records are
                  protected. Sign in with the initial admin account to load
                  your centre data.
                </p>

                <Link
                  className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
                  href="/admin/login"
                >
                  Admin sign in →
                </Link>

                <small className="mt-5 block text-gray-500">
                  Your public home page is available at{" "}
                  <Link className="text-blue-600 underline" href="/">
                    Udaan Learning Centre
                  </Link>.
                </small>
              </div>
            ) : section === "Dashboard" ? (
              <DashboardOverview
                students={directory}
                studentSummary={studentSummary}
                feeSummary={dashboardFeeSummary}
                batches={batches}
                profile={adminProfile}
                search={search}
                todayLabel={todayLabel}
                greeting={greeting}
                currentDate={date}
                onStudents={() => setSection("Students")}
                onBatches={() => setSection("Classes & Batches")}
                onAttendance={() => setSection("Attendance")}
                onFees={() => setSection("Fees")}
                onNotices={() => setSection("Notices")}
                onAddStudent={openStudentCreation}
                onCreateBatch={openNewBatch}
              />
            ) : section === "Fees" ? (
              <FeesManagement
                batches={batches}
                onPaymentSaved={() => void loadDashboardFees()}
              />
            ) : section === "Attendance" ? (
              <AttendanceManagement
                students={students}
                batches={batches}
                selectedBatch={selectedBatch}
                batchId={batchId}
                date={date}
                present={present}
                absent={absent}
                attendancePercentage={attendancePercentage}
                attendanceLoading={attendanceLoading}
                attendanceSaving={attendanceSaving}
                saved={saved}
                setBatchId={setBatchId}
                setDate={setDate}
                setStudents={(update) => {
                  setStudents(update);
                  setSaved(false);
                }}
                saveAttendance={() => void saveAttendance()}
              />
            ) : section === "Classes & Batches" ? (
              <BatchesList
                batches={batches}
                summary={batchSummary}
                loading={loading && batches.length === 0}
                error={pageError}
                onCreate={openNewBatch}
                onEdit={(batch) => void openEditBatch(batch)}
                onToggle={(batch) => void toggleBatch(batch)}
                onDelete={(batch) => void deleteBatch(batch)}
              />
            ) : section === "Students" ? (
              <StudentsList
                students={directory}
                batches={batches}
                summary={studentSummary}
                pagination={studentPagination}
                classes={studentClasses}
                filters={studentFilters}
                loading={studentListLoading}
                error={studentListError}
                onFilter={(key, value) =>
                  setStudentFilters((current) => {
                    const next = {
                      ...current,
                      [key]: value,
                    } as StudentFilters;

                    if (key !== "page") next.page = 1;

                    return next;
                  })
                }
                onReset={() =>
                  setStudentFilters({
                    q: "",
                    className: "all",
                    batchId: "all",
                    status: "all",
                    page: 1,
                    limit: 20,
                  })
                }
                onAdd={openStudentCreation}
                onView={(student) =>
                  router.push("/admin/students/" + student._id)
                }
                onStatus={(student) => void changeStudentStatus(student)}
              />
            ) : section === "Tests & Results" ? (
              <ExamsManagement batches={batches} />
            ) : section === "Notices" ? (
              <NoticesManagement batches={batches} />
            ) : section === "Profile" ? (
              <AdminProfileSection
                adminProfile={adminProfile}
                profileDraft={profileDraft}
                setProfileDraft={setProfileDraft}
                emailOtp={emailOtp}
                setEmailOtp={setEmailOtp}
                onChooseImage={(file) => void chooseProfileImage(file)}
                onSave={() => void saveProfile()}
                onVerifyEmail={(event) => void verifyProfileEmail(event)}
                onResendOtp={() => void resendProfileEmailOtp()}
              />
            ) : section === "Settings" ? (
              <AdminSettingsSection />
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
                <div className="text-3xl">
                  {menu.find((item) => item.label === section)?.icon}
                </div>

                <h2 className="mt-3 text-xl font-bold">
                  {section} workspace
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  This module is part of the tuition management workspace.
                </p>

                <button
                  className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => setSection("Attendance")}
                >
                  Open attendance →
                </button>
              </div>
            )}
                        <AdminPageFooter authenticated={authenticated} />
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="hidden w-80 shrink-0 border-l border-gray-200 bg-gray-50 p-5 xl:block dark:border-gray-800 dark:bg-gray-950">
          <AdminRightRail
            batches={batches}
            section={section}
            authenticated={authenticated}
            todayLabel={todayLabel}
            setSection={setSection}
            onStudentPortal={() => router.push("/student/login")}
          />
        </aside>
      </div>

      {/* Batch Create / Edit Modal */}
      {batchModal && (
        <BatchEditorModal
          editingBatch={editingBatch}
          batchForm={batchForm}
          setBatchForm={setBatchForm}
          batchSearch={batchSearch}
          setBatchSearch={setBatchSearch}
          batchStudentOptions={batchStudentOptions}
          batches={batches}
          onClose={() => setBatchModal(false)}
          onSubmit={(event) => void saveBatch(event)}
        />
      )}

      {/* Student Edit Modal */}
      {studentEditing && (
        <StudentEditorModal
          student={studentEditing}
          draft={studentDraft}
          setDraft={setStudentDraft}
          batches={batches}
          error={studentActionError}
          onClose={() => setStudentEditing(null)}
          onSubmit={(event) => void saveStudentEdit(event)}
        />
      )}
    </main>
  );
}