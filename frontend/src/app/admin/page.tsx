
"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { api } from "@/lib/api";

import useAdminAttendance from "@/components/admin/hooks/useAdminAttendance";
import useAdminDashboard from "@/components/admin/hooks/useAdminDashboard";
import useAdminStudents from "@/components/admin/hooks/useAdminStudents";
import useAdminBatches from "@/components/admin/hooks/useAdminBatches";
import useAdminProfile from "@/components/admin/hooks/useAdminProfile";
import useAdminWorkspace from "@/components/admin/hooks/useAdminWorkspace";

import { FeesManagement } from "@/components/admin/fees/FeesManagement";
import { ExamsManagement } from "@/components/admin/exams/ExamsManagement";
import { NoticesManagement } from "@/components/admin/notices/NoticesManagement";

import DashboardOverview from "@/components/admin/dashboard/DashboardOverview";
import StudentsList from "@/components/admin/students/StudentsList";
import StudentEditorModal from "@/components/admin/students/StudentEditorModal";
import BatchesList from "@/components/admin/batches/BatchesList";
import AttendanceManagement from "@/components/admin/attendance/AttendanceManagement";

import BatchEditorModal from "@/components/admin/batches/BatchEditorModal";
import AdminProfileSection from "@/components/admin/profile/AdminProfileSection";
import AdminSettingsSection from "@/components/admin/settings/AdminSettingsSection";

import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import AdminTopbar from "@/components/admin/layout/AdminTopbar";
import AdminPageFooter from "@/components/admin/layout/AdminPageFooter";

import type {
  Student,
  Batch,
  StudentFilters,
  Section,
  BatchDraft,
  StudentEditDraft,
} from "@/components/admin/shared/types";

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

export default function Home() {
  const router = useRouter();
  const globalSearchRef = useRef<HTMLInputElement>(null);

  const { batches, batchSummary, refreshBatches } = useAdminBatches();

  const [batchStudentOptions, setBatchStudentOptions] = useState<Student[]>([]);

  const { dashboardFeeSummary, loadDashboardFees } = useAdminDashboard();

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

  const { dark, activateRole, clearRole } = useTheme();

  const [mobileMenu, setMobileMenu] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(false);

  const {
    directory,
    studentSummary,
    studentPagination,
    studentClasses,
    studentListLoading,
    studentListError,
    setStudentListError,
    studentFilters,
    setStudentFilters,
    refreshStudents,
  } = useAdminStudents({
    authenticated,
    section,
  });

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

  const {
    adminProfile,
    setAdminProfile,
    profileDraft,
    setProfileDraft,
    emailOtp,
    setEmailOtp,
    emailVerificationSentFor,
    verifiedEmailForDraft,
    requestProfileEmailVerification,
    saveProfile,
    verifyProfileEmail,
    resendProfileEmailOtp,
    chooseProfileImage,
    changeAdminPassword,
  } = useAdminProfile({
    setPageError,
    setNotice,
  });

  const [batchSearch, setBatchSearch] = useState("");

  const selectedBatch =
    batches.find((item) => item._id === batchId) ?? null;

  const {
    students,
    saved,
    attendanceLoading,
    attendanceSaving,
    present,
    absent,
    attendancePercentage,
    loadAttendance,
    saveAttendance,
    setStudents,
  } = useAdminAttendance({
    batchId,
    date,
    selectedBatch,
    setPageError,
    setNotice,
  });

  useAdminWorkspace({
    batchId,
    refreshBatches,
    refreshStudents,
    loadDashboardFees,
    loadAttendance,

    setBatchId,
    setDate,
    setTodayLabel,
    setGreeting,

    setAdminProfile,
    setProfileDraft,

    setAuthenticated,
    setAuthChecking,
    setLoading,
    setPageError,

    activateRole,
    clearRole,
  });

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

  useEffect(() => {
    if (!authenticated || !batchId || !date) return;

    const timer = window.setTimeout(() => {
      void loadAttendance(batchId, date).catch((error: Error) =>
        setPageError(error.message),
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, [date, batchId, authenticated, loadAttendance]);

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

  const openStudentCreation = () => router.push("/admin/students/new");

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

  const handleLogout = async () => {
  setPageError("");
  setNotice("");

  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/auth/logout`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    // Continue local logout even if the API request fails.
  } finally {
    // Keep the loading screen visible until login navigation completes.
    setAuthChecking(true);
    clearRole();

    router.replace("/admin/login");
    router.refresh();
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
            onLogout={() => void handleLogout()}
          />

          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
              {![
  "Dashboard",
  "Fees",
  "Notices",
  "Students",
  "Classes & Batches",
  "Tests & Results",
  "Settings",
].includes(section) && (
  <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    {section === "Attendance" && (
      <>
        <div className="flex w-full items-center justify-center">
          <h1 className="text-center text-xl font-bold text-gray-900 dark:text-white">
            Take attendance
          </h1>
        </div>

        <button
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700"
          onClick={() =>
            document.getElementById("attendance-date")?.focus()
          }
        >
          ▦ Today ⌄
        </button>
      </>
    )}
  </div>
)}

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

            {authChecking ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                  Checking admin session...
                </p>
              </div>
            ) : !authenticated ? (
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
                setStudents={setStudents}
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
                emailVerificationSentFor={emailVerificationSentFor}
                verifiedEmailForDraft={verifiedEmailForDraft}
                onRequestEmailVerification={requestProfileEmailVerification}
                onChooseImage={(file) => void chooseProfileImage(file)}
                onSave={saveProfile}
                onVerifyEmail={(event) => void verifyProfileEmail(event)}
                onResendOtp={() => void resendProfileEmailOtp()}
                onChangePassword={changeAdminPassword}
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
      </div>

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
