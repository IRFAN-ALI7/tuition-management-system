"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import { useTheme } from "@/components/ThemeProvider";
import { API } from "@/lib/api";
import StudentSidebar from "./StudentSidebar";
import StudentTopbar from "./StudentTopbar";

const LOGIN_PATH = "/student/login";
const REQUEST_TIMEOUT_MS = 20_000;

interface StudentShellProps {
  children: ReactNode;
}

type Role = "admin" | "student" | null;

type SessionResult = {
  role: Role;
  failed: boolean;
};

type StudentProfile = {
  name?: string;
  profilePhoto?: string;
};

type DashboardResponse = {
  student?: StudentProfile;
  data?: { student?: StudentProfile };
};

let sessionPromise: Promise<SessionResult> | null = null;
let dashboardPromise: Promise<DashboardResponse> | null = null;

function getStudentSession(): Promise<SessionResult> {
  if (!sessionPromise) {
    const request: Promise<SessionResult> = fetch(`${API}/auth/session`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
      .then(async (response): Promise<SessionResult> => {
        if (!response.ok) {
          return { role: null, failed: response.status >= 500 };
        }

        const data = await response.json().catch(() => ({}));
        const role = data?.user?.role;

        return {
          role: role === "student" || role === "admin" ? role : null,
          failed: false,
        };
      })
      .catch((): SessionResult => ({ role: null, failed: true }))
      .then((result) => {
        // Only a confirmed student session is cached. Anything else is
        // checked again next time, so a login right after a failed check works.
        if (result.role !== "student" && sessionPromise === request) {
          sessionPromise = null;
        }

        return result;
      });

    sessionPromise = request;
  }

  return sessionPromise;
}

function loadStudentDashboard(): Promise<DashboardResponse> {
  if (!dashboardPromise) {
    dashboardPromise = fetch(`${API}/student/dashboard`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load student profile.");
        }

        return (await response.json()) as DashboardResponse;
      })
      .catch((error) => {
        dashboardPromise = null;
        throw error;
      });
  }

  return dashboardPromise;
}

export function clearStudentSessionCache() {
  sessionPromise = null;
  dashboardPromise = null;
}

export default function StudentShell({ children }: StudentShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { activateRole, clearRole } = useTheme();

  const isLoginPage = pathname === LOGIN_PATH;

  const [authorized, setAuthorized] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [studentName, setStudentName] = useState("Student");
  const [studentPhoto, setStudentPhoto] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoginPage) return;

    let mounted = true;

    async function verifySession() {
      const session = await getStudentSession();

      if (!mounted) return;

      if (session.failed) {
        setAuthorized(false);
        setFailed(true);
        return;
      }

      if (session.role !== "student") {
        setAuthorized(false);
        clearRole();
        router.replace(session.role === "admin" ? "/admin" : LOGIN_PATH);
        return;
      }

      activateRole("student");
      setFailed(false);
      setAuthorized(true);

      try {
        const dashboard = await loadStudentDashboard();

        if (!mounted) return;

        const student = dashboard.student ?? dashboard.data?.student;

        setStudentName(student?.name ?? "Student");
        setStudentPhoto(student?.profilePhoto ?? "");
      } catch {
        // Each page shows its own error if its data cannot be loaded.
      }
    }

    void verifySession();

    return () => {
      mounted = false;
    };
  }, [isLoginPage, attempt, activateRole, clearRole, router]);

  const retry = () => {
    clearStudentSessionCache();
    setFailed(false);
    setAttempt((current) => current + 1);
  };

  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      window.alert(
        "Could not log out. Please check your internet connection and try again.",
      );
      return;
    }

    clearStudentSessionCache();
    clearRole();

    window.location.replace(LOGIN_PATH);
  }, [clearRole]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (failed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600 text-3xl text-white shadow-lg shadow-violet-600/20">
            ✳
          </div>

          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Unable to connect to the server. Please check your internet
            connection and try again.
          </p>

          <button
            type="button"
            onClick={retry}
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600 text-3xl text-white shadow-lg shadow-violet-600/20">
            ✳
          </div>

          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-violet-200 border-t-violet-600" />

          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Verifying your student account...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <StudentSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:pl-72">
        <StudentTopbar
          name={studentName}
          image={studentPhoto}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />

        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}