"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import { FeesManagement } from "@/components/admin/FeesManagement";
import { ExamsManagement } from "@/components/admin/ExamsManagement";
import { NoticesManagement } from "@/components/admin/NoticesManagement";
import { DashboardOverview } from "@/components/admin/DashboardOverview";
import { StudentsList } from "@/components/admin/StudentsList";
import { BatchesList } from "@/components/admin/BatchesList";

type Student = {
  _id: string;
  studentId?: string;
  name: string;
  phone: string;
  fatherName: string;
  address?: string;
  gender?: string;
  className?: string;
  admissionDate?: string;
  monthlyFees?: number | null;
  profilePhoto?: string;
  batchId?:
    | string
    | {
        _id: string;
        name: string;
        startTime: string;
        endTime: string;
        active: boolean;
      }
    | null;
  active: boolean;
  createdAt?: string;
  status?: "present" | "absent";
};

type Batch = {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  active: boolean;
  createdAt?: string;
  students: Student[];
};

type StudentSummary = {
  total: number;
  active: number;
  inactive: number;
  totalBatches: number;
  growth: Record<string, number>;
};

type BatchSummary = {
  totalBatches: number;
  activeBatches: number;
  totalStudents: number;
};

type DashboardFeeSummary = {
  totalExpected: number;
  feesCollected: number;
  totalDue: number;
  studentsPaid: number;
  studentsDue: number;
};

type StudentPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type StudentFilters = {
  q: string;
  className: string;
  batchId: string;
  status: string;
  page: number;
  limit: number;
};

type AdminProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
  emailVerified: boolean;
  pendingEmail: string;
  image: string;
};

type Section =
  | "Dashboard"
  | "Students"
  | "Classes & Batches"
  | "Attendance"
  | "Fees"
  | "Tests & Results"
  | "Notices"
  | "Reports"
  | "Audit Logs"
  | "Settings"
  | "Profile";

type BatchDraft = {
  name: string;
  startTime: string;
  endTime: string;
  studentIds: string[];
};

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const rupees = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

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

const timeParts = (time: string) => {
  const [rawHour, minute] = time.split(":").map(Number);

  return {
    hour: rawHour % 12 || 12,
    minute,
    period: rawHour >= 12 ? "PM" : "AM",
  };
};

const joinTime = (hour: number, minute: number, period: string) =>
  `${String((hour % 12) + (period === "PM" ? 12 : 0)).padStart(
    2,
    "0",
  )}:${String(minute).padStart(2, "0")}`;

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

function Icon({ children }: { children: string }) {
  const paths: Record<string, string> = {
    home: "M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-5v-6h-5v6h-5A1.5 1.5 0 0 1 3 19.5z",
    students:
      "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m8-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0m3 2a4 4 0 0 1 0 7m2 4v-2a4 4 0 0 0-3-3.87",
    batches:
      "M4 4h16v16H4zM8 2v4m8-4v4M4 9h16m-11 4h2m3 0h2m-7 4h2",
    attendance:
      "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
    fees: "M12 2v20m6-16H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
    exams: "M7 3h10l4 4v14H3V3zm10 0v5h4M7 13h10m-10 4h7",
    notices:
      "M4 11V8a2 2 0 0 1 2-2h10l5-3v18l-5-3H6a2 2 0 0 1-2-2v-3m4 5 2 5h4l-2-5",
    reports:
      "M4 20V12h4v8m4 0V5h4v15m4 0V9h4v11M2 21h21",
    audit:
      "M12 8v5l3 2m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
    settings:
      "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8m0-6v3m0 14v3m10-10h-3M5 12H2m17.07-7.07-2.12 2.12M7.05 16.95l-2.12 2.12m14.14 0-2.12-2.12M7.05 7.05 4.93 4.93",
  };

  return (
    <span className="icon" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={paths[children] ?? paths.home} />
      </svg>
    </span>
  );
}

function TimePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const parts = timeParts(value);

  const update = (hour: number, minute: number, period: string) =>
    onChange(joinTime(hour, minute, period));

  return (
    <label className="time-picker">
      <span>{label}</span>

      <div className="time-picker-controls">
        <select
          aria-label={`${label} hour`}
          value={parts.hour}
          onChange={(e) =>
            update(Number(e.target.value), parts.minute, parts.period)
          }
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
            <option key={hour}>{String(hour).padStart(2, "0")}</option>
          ))}
        </select>

        <b>:</b>

        <select
          aria-label={`${label} minute`}
          value={parts.minute}
          onChange={(e) =>
            update(parts.hour, Number(e.target.value), parts.period)
          }
        >
          {Array.from({ length: 60 }, (_, minute) => (
            <option key={minute} value={minute}>
              {String(minute).padStart(2, "0")}
            </option>
          ))}
        </select>

        <select
          aria-label={`${label} AM or PM`}
          value={parts.period}
          onChange={(e) =>
            update(parts.hour, parts.minute, e.target.value)
          }
        >
          <option>AM</option>
          <option>PM</option>
        </select>
      </div>
    </label>
  );
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
      className="modal-backdrop student-dialog-backdrop"
      onClick={onClose}
    >
      <section
        className="editor-modal student-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-edit-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="section-kicker">STUDENT MANAGEMENT</div>
        <h2 id="student-edit-title">Edit student</h2>
        <p>
          Update profile details or move this student to another active batch.
        </p>

        {error && (
          <div className="students-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="student-edit-grid">
            <label className="form-field">
              Student Name
              <input
                required
                maxLength={100}
                value={draft.name}
                onChange={(event) => set("name", event.target.value)}
              />
            </label>

            <label className="form-field">
              Father&apos;s Name
              <input
                value={draft.fatherName}
                onChange={(event) => set("fatherName", event.target.value)}
              />
            </label>

            <label className="form-field">
              Phone
              <input
                required
                type="tel"
                value={draft.phone}
                onChange={(event) => set("phone", event.target.value)}
              />
            </label>

            <label className="form-field">
              Gender
              <select
                value={draft.gender}
                onChange={(event) => set("gender", event.target.value)}
              >
                <option value="">Not specified</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </label>

            <label className="form-field">
              Class
              <select
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

            <label className="form-field">
              Batch
              <select
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

            <label className="form-field">
              Monthly Fees (₹)
              <input
                required
                min="0"
                step="0.01"
                type="number"
                value={draft.monthlyFees}
                onChange={(event) => set("monthlyFees", event.target.value)}
              />
            </label>

            <label className="form-field">
              Admission Date
              <input
                required
                type="date"
                value={draft.admissionDate}
                onChange={(event) => set("admissionDate", event.target.value)}
              />
            </label>

            <label className="form-field student-edit-wide">
              Address
              <textarea
                required
                rows={3}
                value={draft.address}
                onChange={(event) => set("address", event.target.value)}
              />
            </label>
          </div>

          <div className="editor-actions">
            <button
              type="button"
              className="outline-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="save-button">
              Save changes <b>→</b>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DashboardRail({
  batches,
  setSection,
  todayLabel,
}: {
  batches: Batch[];
  setSection: (section: Section) => void;
  todayLabel: string;
}) {
  const activeBatches = batches
    .filter((batch) => batch.active)
    .slice()
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="dashboard-rail-content">
      <div className="rail-date-card">
        <span className="rail-calendar-icon">▦</span>
        <div>
          <strong>{todayLabel}</strong>
          <small>Local date</small>
        </div>
      </div>

      <section className="rail-card dashboard-today-card">
        <div className="rail-card-heading">
          <h2>Today&apos;s Batches</h2>
          <button onClick={() => setSection("Classes & Batches")}>
            View all
          </button>
        </div>

        {activeBatches.length ? (
          activeBatches.map((batch) => (
            <div className="dashboard-batch-row" key={batch._id}>
              <i />
              <div>
                <strong>{batch.name}</strong>
                <small>
                  {prettyTime(batch.startTime)} – {prettyTime(batch.endTime)}
                </small>
              </div>
              <span>{batch.students.length} students</span>
            </div>
          ))
        ) : (
          <div className="dashboard-rail-empty">
            No active batches are scheduled.
          </div>
        )}
      </section>

      <section className="rail-card dashboard-notice-card">
        <div className="rail-card-heading">
          <h2>Recent Notices</h2>
          <button onClick={() => setSection("Notices")}>View all</button>
        </div>
        <div className="dashboard-rail-empty">
          Notice records are not connected yet.
        </div>
      </section>

      <section className="rail-card dashboard-exam-card">
        <div className="rail-card-heading">
          <h2>Upcoming Exams</h2>
          <button onClick={() => setSection("Tests & Results")}>
            View all
          </button>
        </div>
        <div className="dashboard-rail-empty">
          Exam schedules are not connected yet.
        </div>
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
  const [studentDraft, setStudentDraft] = useState({
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

    if (requestedSection && menu.some((item) => item.label === requestedSection)) {
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
          setPageError("An admin account is required to open this workspace.");
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

    if (!window.confirm(`${active ? "Activate" : "Deactivate"} ${student.name}?`)) {
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
      className={`app-shell ${dark ? "dark" : ""} ${
        section === "Students"
          ? "students-workspace"
          : section === "Classes & Batches"
            ? "batches-workspace"
            : ""
      }`}
    >
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <a
          className="brand"
          href="#home"
          onClick={() => setSection("Dashboard")}
        >
          <span className="brand-mark">✳</span>
          <span>
            <strong>Udaan</strong>
            <small>LEARNING CENTRE</small>
          </span>
        </a>

        <div className="workspace-label">
          WORKSPACE <span>⌘</span>
        </div>

        <nav className="nav-list" aria-label="Admin navigation">
          {menu.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${
                section === item.label ? "active" : ""
              }`}
              onClick={() => {
                setSection(item.label);
                setMobileMenu(false);
              }}
            >
              <Icon>{item.icon}</Icon>
              {item.label === "Classes & Batches"
                ? "Batches"
                : item.label === "Tests & Results"
                  ? "Exams"
                  : item.label}
              {item.label === "Notices" && <i className="nav-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon">?</span>
            <strong>Need a hand?</strong>
            <p>We&apos;re here to help you out.</p>
            <button
              onClick={() =>
                alert("Contact your tuition administrator for help.")
              }
            >
              Get support <span>↗</span>
            </button>
          </div>

          <button
            className="profile-row"
            onClick={() => {
              setSection("Profile");
              setMobileMenu(false);
            }}
          >
            <span className="avatar admin-avatar">
              {adminProfile?.image ? (
                <NextImage
                  src={adminProfile.image}
                  alt=""
                  width={48}
                  height={48}
                  unoptimized
                />
              ) : (
                adminProfile?.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() ?? "AD"
              )}
            </span>

            <span className="profile-copy">
              <strong>{adminProfile?.name ?? "Admin"}</strong>
              <small>Administrator · Profile</small>
            </span>

            <span className="more">···</span>
          </button>
        </div>
      </aside>

      {mobileMenu && (
        <button
          className="scrim"
          aria-label="Close menu"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <section className="main-column">
        <header className="topbar dashboard-topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Open navigation"
            onClick={() => setMobileMenu(true)}
          >
            <span className="hamburger-glyph" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </button>

          <div className="breadcrumbs">
            <span>Admin</span>
            <b>/</b>
            <strong>{section}</strong>
          </div>

          <label className="global-search">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <circle
                cx="8.5"
                cy="8.5"
                r="5.8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="m13 13 4.5 4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              />
            </svg>

            <input
              ref={globalSearchRef}
              aria-label="Search students"
              placeholder="Search students..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;

                const query = search.trim().toLowerCase();
                if (!query) return;

                void api(
                  `/students?q=${encodeURIComponent(
                    query,
                  )}&page=1&limit=20`,
                )
                  .then((result) => {
                    if (result.pagination.total) {
                      setStudentFilters((current) => ({
                        ...current,
                        q: query,
                        page: 1,
                      }));
                      setSection("Students");
                    } else if (
                      batches.some((batch) =>
                        batch.name.toLowerCase().includes(query),
                      )
                    ) {
                      setSection("Classes & Batches");
                    }
                  })
                  .catch(() => {
                    if (
                      batches.some((batch) =>
                        batch.name.toLowerCase().includes(query),
                      )
                    ) {
                      setSection("Classes & Batches");
                    }
                  });
              }}
            />

            <kbd>Ctrl K</kbd>
          </label>

          <div className="top-actions">
            <ThemeToggle />

            <button
              className="notification icon-button"
              aria-label="Notifications and notices"
              onClick={() => setSection("Notices")}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 13h4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <i />
            </button>

            <button
              className="top-profile"
              onClick={() => setSection("Profile")}
            >
              <span className="top-profile-avatar">
                {adminProfile?.image ? (
                  <NextImage
                    src={adminProfile.image}
                    alt=""
                    width={48}
                    height={48}
                    unoptimized
                  />
                ) : (
                  adminProfile?.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() ?? "AD"
                )}
              </span>

              <span>
                <strong>{adminProfile?.name ?? "Admin"}</strong>
                <small>Administrator</small>
              </span>

              <b aria-hidden="true">&#8964;</b>
            </button>
          </div>
        </header>

        <div className="content">
          <div
            className={`welcome-row ${
              section === "Dashboard" ||
              section === "Fees" ||
              section === "Notices"
                ? "dashboard-welcome-hidden"
                : ""
            }`}
          >
            <div>
              <div className="eyebrow">
                UDAAN LEARNING CENTRE <span>·</span> ADMIN WORKSPACE
              </div>

              <h1>
                {section === "Attendance" ? "Take attendance" : section}
              </h1>

              <p>
                {section === "Attendance"
                  ? "A little progress each day adds up to big results."
                  : `Welcome back. Manage your ${section.toLowerCase()} here.`}
              </p>
            </div>

            {section === "Attendance" && (
              <button
                className="outline-button date-button"
                onClick={() =>
                  document.getElementById("attendance-date")?.focus()
                }
              >
                <span>▦</span> Today <b>⌄</b>
              </button>
            )}
          </div>

          {pageError && (
            <div className="notice-banner error-banner">
              <span>!</span>
              <p>{pageError}</p>
              {!authenticated && <Link href="/admin/login">Sign in</Link>}
            </div>
          )}

          {notice && (
            <div className="notice-banner success-banner">
              <span>✓</span>
              <p>{notice}</p>
              <button
                aria-label="Dismiss message"
                onClick={() => setNotice("")}
              >
                ×
              </button>
            </div>
          )}

          {!authenticated ? (
            <div className="placeholder-panel signed-out-panel">
              <div className="placeholder-icon">♙</div>
              <h2>Sign in to your admin workspace</h2>
              <p>
                Batch schedules, students and attendance records are protected.
                Sign in with the initial admin account to load your centre data.
              </p>

              <Link className="save-button" href="/admin/login">
                Admin sign in <b>→</b>
              </Link>

              <small className="api-hint">
                Your public home page is available at{" "}
                <Link href="/">Udaan Learning Centre</Link>.
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
            <section className="attendance-page">
              <div className="attendance-summary-grid">
                <article className="attendance-summary-card attendance-total">
                  <span>♟</span>
                  <div>
                    <small>Total Students</small>
                    <strong>{students.length.toLocaleString("en-IN")}</strong>
                  </div>
                </article>

                <article className="attendance-summary-card attendance-present">
                  <span>✓</span>
                  <div>
                    <small>Present</small>
                    <strong>{present.toLocaleString("en-IN")}</strong>
                  </div>
                </article>

                <article className="attendance-summary-card attendance-absent">
                  <span>×</span>
                  <div>
                    <small>Absent</small>
                    <strong>{absent.toLocaleString("en-IN")}</strong>
                  </div>
                </article>

                <article className="attendance-summary-card attendance-percent">
                  <span>%</span>
                  <div>
                    <small>Attendance</small>
                    <strong>{attendancePercentage}%</strong>
                  </div>
                </article>
              </div>

              <section className="attendance-card attendance-management-card">
                <div className="attendance-page-heading">
                  <div>
                    <div className="section-kicker">DAILY RECORD</div>
                    <h2>Attendance Management</h2>
                    <p>
                      Choose a date and batch, then mark each active student.
                    </p>
                  </div>
                </div>

                <div className="attendance-controls">
                  <label className="attendance-date-control">
                    <span>Date</span>
                    <input
                      id="attendance-date"
                      type="date"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                    />
                  </label>

                  <label className="attendance-batch-control">
                    <span>Batch</span>
                    <select
                      value={batchId}
                      onChange={(event) => setBatchId(event.target.value)}
                    >
                      <option value="">Select a batch</option>
                      {batches.map((batch) => (
                        <option key={batch._id} value={batch._id}>
                          {batch.name} — {prettyTime(batch.startTime)}–
                          {prettyTime(batch.endTime)}
                          {batch.active ? "" : " (Inactive — history only)"}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="attendance-selected-schedule">
                    {selectedBatch ? (
                      <>
                        <strong>{selectedBatch.name}</strong>
                        <span>
                          {prettyTime(selectedBatch.startTime)} –{" "}
                          {prettyTime(selectedBatch.endTime)}
                        </span>
                      </>
                    ) : (
                      <span>Select a batch to continue</span>
                    )}
                  </div>
                </div>

                {!selectedBatch && (
                  <div className="attendance-empty-state">
                    Select a batch and date to load attendance.
                  </div>
                )}

                {selectedBatch && !selectedBatch.active && (
                  <div className="attendance-readonly-note" role="status">
                    Inactive batch — saved attendance can be viewed, but new
                    attendance cannot be saved.
                  </div>
                )}

                {selectedBatch && (
                  <div className="attendance-record-table-wrap">
                    <table className="attendance-record-table">
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Name</th>
                          <th>Class</th>
                          <th>Attendance Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {attendanceLoading ? (
                          <tr>
                            <td
                              className="attendance-table-message"
                              colSpan={4}
                            >
                              Loading attendance records…
                            </td>
                          </tr>
                        ) : (
                          students.map((student) => (
                            <tr key={student._id}>
                              <td className="students-id">
                                {student.studentId ??
                                  `STU${student._id.slice(-6).toUpperCase()}`}
                              </td>

                              <td>
                                <span className="attendance-student-name">
                                  <span className="students-avatar">
                                    {student.name.slice(0, 1).toUpperCase()}
                                  </span>
                                  <strong>{student.name}</strong>
                                </span>
                              </td>

                              <td>{student.className || "—"}</td>

                              <td>
                                <button
                                  className={`attendance-status-button ${
                                    student.status === "present"
                                      ? "is-present"
                                      : "is-absent"
                                  }`}
                                  disabled={
                                    !selectedBatch.active || attendanceLoading
                                  }
                                  aria-label={`Mark ${student.name} ${
                                    student.status === "present"
                                      ? "absent"
                                      : "present"
                                  }`}
                                  onClick={() => {
                                    setStudents((current) =>
                                      current.map((item) =>
                                        item._id === student._id
                                          ? {
                                              ...item,
                                              status:
                                                item.status === "present"
                                                  ? "absent"
                                                  : "present",
                                            }
                                          : item,
                                      ),
                                    );
                                    setSaved(false);
                                  }}
                                >
                                  <span>
                                    {student.status === "present" ? "✓" : "×"}
                                  </span>
                                  {student.status === "present"
                                    ? "Present"
                                    : "Absent"}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}

                        {!attendanceLoading && students.length === 0 && (
                          <tr>
                            <td
                              className="attendance-table-message"
                              colSpan={4}
                            >
                              {saved
                                ? "No active students are currently assigned to this batch."
                                : "No active students are assigned to this batch yet."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <footer className="attendance-page-footer">
                  <span>
                    {saved
                      ? "Saved attendance — changes can be edited and saved again."
                      : "New attendance starts with all active students marked present."}
                  </span>

                  <button
                    className="save-button"
                    disabled={
                      !selectedBatch?.active ||
                      !students.length ||
                      attendanceLoading ||
                      attendanceSaving
                    }
                    onClick={() => void saveAttendance()}
                  >
                    {attendanceSaving
                      ? "Saving…"
                      : saved
                        ? "Update Attendance"
                        : "Save Attendance"}
                    <b>→</b>
                  </button>
                </footer>
              </section>
            </section>
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
              onEdit={openStudentEditor}
              onStatus={(student) => void changeStudentStatus(student)}
            />
          ) : section === "Tests & Results" ? (
            <ExamsManagement batches={batches} />
          ) : section === "Notices" ? (
            <NoticesManagement batches={batches} />
          ) : section === "Profile" ? (
            <section className="settings-panel admin-profile-panel">
              <div className="section-kicker">ACCOUNT</div>
              <h2>Admin profile</h2>
              <p>
                Manage your contact details and verify any new email address.
              </p>

              <div className="admin-profile-form">
                <div className="profile-image-editor">
                  <span className="profile-image-preview">
                    {profileDraft.image ? (
                      <NextImage
                        src={profileDraft.image}
                        alt="Admin profile preview"
                        width={72}
                        height={72}
                        unoptimized
                      />
                    ) : (
                      adminProfile?.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() ?? "AD"
                    )}
                  </span>

                  <label className="outline-button profile-image-label">
                    Choose photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) =>
                        void chooseProfileImage(event.target.files?.[0])
                      }
                    />
                  </label>

                  <small>Optional · resized before saving</small>
                </div>

                <label className="form-field">
                  Full name
                  <input
                    required
                    maxLength={100}
                    value={profileDraft.name}
                    onChange={(event) =>
                      setProfileDraft({
                        ...profileDraft,
                        name: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="form-field">
                  Phone number
                  <input
                    type="tel"
                    maxLength={30}
                    value={profileDraft.phone}
                    onChange={(event) =>
                      setProfileDraft({
                        ...profileDraft,
                        phone: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="form-field">
                  Email address
                  <input
                    required
                    type="email"
                    value={profileDraft.email}
                    onChange={(event) =>
                      setProfileDraft({
                        ...profileDraft,
                        email: event.target.value,
                      })
                    }
                  />
                </label>

                <div className="email-verification-status">
                  {adminProfile?.emailVerified ? (
                    <span className="verified-state">Verified email</span>
                  ) : (
                    <span className="unverified-state">
                      Email not verified
                    </span>
                  )}
                </div>

                {adminProfile?.pendingEmail && (
                  <div className="email-verify-box">
                    <p>
                      Enter the verification code sent to{" "}
                      <strong>{adminProfile.pendingEmail}</strong>. Your current
                      email stays active until verification is complete.
                    </p>

                    <form onSubmit={(event) => void verifyProfileEmail(event)}>
                      <label className="form-field">
                        Six-digit code
                        <input
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={emailOtp}
                          onChange={(event) =>
                            setEmailOtp(
                              event.target.value.replace(/\D/g, ""),
                            )
                          }
                        />
                      </label>

                      <div className="profile-actions">
                        <button
                          type="button"
                          className="outline-button"
                          onClick={() => void resendProfileEmailOtp()}
                        >
                          Resend code
                        </button>

                        <button type="submit" className="save-button">
                          Verify email
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <button
                  className="save-button profile-save-button"
                  type="button"
                  onClick={() => void saveProfile()}
                >
                  Save profile <b>→</b>
                </button>
              </div>
            </section>
          ) : section === "Settings" ? (
            <section className="settings-panel">
              <div className="section-kicker">PREFERENCES</div>
              <h2>Settings</h2>
              <p>
                Personalize the Admin Dashboard appearance. This preference is
                saved for your admin account on this device.
              </p>

              <article className="appearance-setting">
                <div>
                  <strong>Dark mode</strong>
                  <small>
                    Use the dark Udaan theme across admin pages.
                  </small>
                </div>
                <ThemeToggle />
              </article>
            </section>
          ) : (
            <div className="placeholder-panel">
              <div className="placeholder-icon">
                {menu.find((item) => item.label === section)?.icon}
              </div>
              <h2>{section} workspace</h2>
              <p>
                This module is part of the tuition management workspace.
              </p>
              <button
                className="save-button"
                onClick={() => setSection("Attendance")}
              >
                Open attendance <b>→</b>
              </button>
            </div>
          )}
        </div>

        <footer className="page-footer">
          <span>© 2026 Udaan Learning Centre</span>
          <span>
            <i /> {authenticated ? "Connected to Udaan API" : "Sign in required"}{" "}
            <b>·</b> v1.0.0
          </span>
        </footer>
      </section>

      <aside
        className={`right-rail ${
          section === "Dashboard" ? "dashboard-rail" : ""
        }`}
      >
        {section === "Dashboard" && authenticated ? (
          <DashboardRail
            batches={batches}
            setSection={setSection}
            todayLabel={todayLabel}
          />
        ) : (
          <>
            <div className="rail-top">
              <span className="rail-date">YOUR BATCHES</span>
              <div className="calendar-icon">▦</div>
            </div>

            <div className="rail-section">
              <div className="rail-section-head">
                <div>
                  <span className="section-kicker">SCHEDULE</span>
                  <h3>Class times</h3>
                </div>
                <button onClick={() => setSection("Classes & Batches")}>
                  ···
                </button>
              </div>

              <div className="glance-card">
                {batches
                  .filter((item) => item.active)
                  .slice()
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((batch, index) => (
                    <div className="glance-row" key={batch._id}>
                      <span
                        className={`glance-dot ${
                          index % 3 === 0
                            ? "violet"
                            : index % 3 === 1
                              ? "green"
                              : "orange"
                        }`}
                      />

                      <span>
                        <strong>{batch.name}</strong>
                        <small>
                          {batch.students.length} students ·{" "}
                          {Math.floor(batch.durationMinutes / 60) || ""}
                          {batch.durationMinutes % 60
                            ? `${batch.durationMinutes % 60} min`
                            : " hr"}
                        </small>
                      </span>

                      <b>{prettyTime(batch.startTime)}</b>
                    </div>
                  ))}

                {!batches.some((item) => item.active) && (
                  <div className="empty-rail">
                    Sign in to load batch schedules.
                  </div>
                )}

                <button
                  className="timetable-link"
                  onClick={() => setSection("Classes & Batches")}
                >
                  Manage schedule <b>→</b>
                </button>
              </div>
            </div>

            <div className="quote-card">
              <span>✳</span>
              <p>
                “Education is the most powerful weapon which you can use to
                change the world.”
              </p>
              <small>— Nelson Mandela</small>
              <div className="quote-decoration">✳</div>
            </div>

            <button
              className="student-login"
              onClick={() => router.push("/student/login")}
            >
              <span>♙</span>
              <span>
                <strong>Student portal</strong>
                <small>View student sign in</small>
              </span>
              <b>↗</b>
            </button>
          </>
        )}
      </aside>

      {batchModal && (
        <div
          className="modal-backdrop"
          onClick={() => setBatchModal(false)}
        >
          <div
            className="editor-modal batch-editor"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setBatchModal(false)}
            >
              ×
            </button>

            <div className="section-kicker">CLASSES &amp; BATCHES</div>
            <h2>{editingBatch ? "Edit batch" : "Create a batch"}</h2>
            <p>
              Choose a unique name, schedule and student assignments.
            </p>

            <form onSubmit={(event) => void saveBatch(event)}>
              <label className="form-field">
                Batch name
                <input
                  required
                  maxLength={60}
                  value={batchForm.name}
                  onChange={(event) =>
                    setBatchForm({
                      ...batchForm,
                      name: event.target.value,
                    })
                  }
                  placeholder="For example, Batch-C"
                />
              </label>

              <div className="time-picker-row">
                <TimePicker
                  label="START TIME"
                  value={batchForm.startTime}
                  onChange={(startTime) =>
                    setBatchForm({ ...batchForm, startTime })
                  }
                />

                <TimePicker
                  label="END TIME"
                  value={batchForm.endTime}
                  onChange={(endTime) =>
                    setBatchForm({ ...batchForm, endTime })
                  }
                />
              </div>

              <div className="assignment-heading">
                <div>
                  <strong>Assign students</strong>
                  <small>
                    Each student can be in one active batch.
                  </small>
                </div>
                <span>{batchForm.studentIds.length} selected</span>
              </div>

              <input
                className="student-search"
                value={batchSearch}
                onChange={(event) => setBatchSearch(event.target.value)}
                placeholder="Search name, phone or father's name"
              />

              <div className="assignment-list">
                {batchStudentOptions
                  .filter(
                    (student) =>
                      (student.active ||
                        batchForm.studentIds.includes(student._id)) &&
                      `${student.name} ${student.phone} ${student.fatherName}`
                        .toLowerCase()
                        .includes(batchSearch.toLowerCase()),
                  )
                  .map((student) => {
                    const otherBatch = batches.find(
                      (batch) =>
                        batch.active &&
                        batch._id !== editingBatch?._id &&
                        batch.students.some(
                          (item) => item._id === student._id,
                        ),
                    );

                    const checked = batchForm.studentIds.includes(student._id);

                    return (
                      <label
                        className={`assignment-row ${
                          otherBatch ? "assignment-conflict" : ""
                        }`}
                        key={student._id}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={
                            Boolean(otherBatch) ||
                            (!student.active && checked) ||
                            (Boolean(editingBatch && !editingBatch.active) &&
                              !checked)
                          }
                          onChange={(event) =>
                            setBatchForm({
                              ...batchForm,
                              studentIds: event.target.checked
                                ? [...batchForm.studentIds, student._id]
                                : batchForm.studentIds.filter(
                                    (id) => id !== student._id,
                                  ),
                            })
                          }
                        />

                        <span>
                          <strong>{student.name}</strong>
                          <small>
                            {student.phone} · Father: {student.fatherName}
                            {!student.active ? " · Inactive student" : ""}
                          </small>
                        </span>

                        {otherBatch && <em>{otherBatch.name}</em>}
                      </label>
                    );
                  })}

                {batchStudentOptions.length === 0 && (
                  <div className="empty-state">
                    Add students in Student Management first.
                  </div>
                )}
              </div>

              <div className="editor-actions">
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setBatchModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="save-button">
                  {editingBatch ? "Save changes" : "Create batch"} <b>→</b>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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