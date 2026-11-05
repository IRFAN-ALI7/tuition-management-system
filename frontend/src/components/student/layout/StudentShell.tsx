
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

export default function StudentShell({ children }: StudentShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { activateRole, clearRole } = useTheme();

  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [studentName, setStudentName] = useState("Student");
  const [studentPhoto, setStudentPhoto] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/student/login") {
      return;
    }

    let mounted = true;

    async function verifySession() {
      setChecking(true);

      try {
        const response = await fetch(`${API}/auth/session`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          throw new Error("Session expired");
        }

        const data = await response.json();

        if (data.user?.role !== "student") {
          if (mounted) {
            setAuthorized(false);
            clearRole();

            router.replace(
              data.user?.role === "admin"
                ? "/admin"
                : "/student/login"
            );
          }
          return;
        }

        if (!mounted) return;

        activateRole("student");
        setAuthorized(true);

        const dashboardResponse = await fetch(
          `${API}/student/dashboard`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
            },
          }
        );

        if (dashboardResponse.status === 401) {
          throw new Error("Session expired");
        }

        if (dashboardResponse.ok) {
          const dashboard = await dashboardResponse.json();

          if (mounted) {
            const student =
              dashboard.student ?? dashboard.data?.student;

            setStudentName(student?.name ?? "Student");
            setStudentPhoto(student?.profilePhoto ?? "");
          }
        }
      } catch {
        if (mounted) {
          setAuthorized(false);
          clearRole();
          router.replace("/student/login");
        }
      } finally {
        if (mounted) {
          setChecking(false);
        }
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
      // Continue local logout even if API request fails.
    } finally {
      clearRole();
      setAuthorized(false);
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
