"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import { useTheme } from "@/components/ThemeProvider";
import StudentSidebar from "./StudentSidebar";
import StudentTopbar from "./StudentTopbar";

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

interface StudentShellProps {
  children: ReactNode;
}

interface SessionResult {
  role: "admin" | "student" | null;
}

let sessionPromise: Promise<SessionResult> | null = null;
let dashboardPromise: Promise<unknown> | null = null;

function getStudentSession(): Promise<SessionResult> {
  if (!sessionPromise) {
    sessionPromise = fetch(`${API}/auth/session`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          return { role: null };
        }

        const data = await response.json();
        const role = data?.user?.role;

        return {
          role:
            role === "student" || role === "admin"
              ? role
              : null,
        };
      })
      .catch(() => ({ role: null }));
  }

  return sessionPromise;
}

function loadStudentDashboard() {
  if (!dashboardPromise) {
    dashboardPromise = fetch(`${API}/student/dashboard`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load student profile.");
        }

        return response.json();
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

export default function StudentShell({
  children,
}: StudentShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { activateRole, clearRole } = useTheme();

  const [checking, setChecking] = useState(
    pathname !== "/student/login",
  );
  const [authorized, setAuthorized] = useState(false);

  const [studentName, setStudentName] = useState("Student");
  const [studentPhoto, setStudentPhoto] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/student/login") {
      setChecking(false);
      return;
    }

    let mounted = true;

    async function verifySession() {
      try {
        const session = await getStudentSession();

        if (!mounted) return;

        if (session.role !== "student") {
          setAuthorized(false);
          clearRole();

          router.replace(
            session.role === "admin"
              ? "/admin"
              : "/student/login",
          );

          return;
        }

        activateRole("student");
        setAuthorized(true);
        setChecking(false);

        // Profile information is fetched only once per app session.
        try {
          const dashboard = (await loadStudentDashboard()) as {
            student?: {
              name?: string;
              profilePhoto?: string;
            };
            data?: {
              student?: {
                name?: string;
                profilePhoto?: string;
              };
            };
          };

          if (!mounted) return;

          const student =
            dashboard.student ?? dashboard.data?.student;

          setStudentName(student?.name ?? "Student");
          setStudentPhoto(student?.profilePhoto ?? "");
        } catch {
          // Dashboard pages handle their own API errors.
        }
      } catch {
        if (!mounted) return;

        setAuthorized(false);
        setChecking(false);
        clearStudentSessionCache();
        clearRole();
        router.replace("/student/login");
      }
    }

    void verifySession();

    return () => {
      mounted = false;
    };
  }, [pathname, activateRole, clearRole, router]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      // Continue local logout if the request fails.
    } finally {
      clearStudentSessionCache();
      clearRole();
      setAuthorized(false);
      setStudentName("Student");
      setStudentPhoto("");

      router.replace("/student/login");
      router.refresh();
    }
  }, [clearRole, router]);

  if (pathname === "/student/login") {
    return <>{children}</>;
  }

  if (checking || !authorized) {
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