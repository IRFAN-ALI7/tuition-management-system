
import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";

import { api, API } from "@/lib/api";

import type { Batch, AdminProfile } from "@/components/admin/shared/types";

type ProfileDraft = {
  name: string;
  phone: string;
  email: string;
  image: string;
};

type Props = {
  batchId: string;
  refreshBatches: () => Promise<Batch[]>;
  refreshStudents: () => Promise<unknown>;
  loadDashboardFees: (date?: string) => Promise<void>;
  loadAttendance: (id: string, date: string) => Promise<void>;

  setBatchId: Dispatch<SetStateAction<string>>;
  setDate: Dispatch<SetStateAction<string>>;
  setTodayLabel: Dispatch<SetStateAction<string>>;
  setGreeting: Dispatch<SetStateAction<string>>;

  setAdminProfile: Dispatch<SetStateAction<AdminProfile | null>>;
  setProfileDraft: Dispatch<SetStateAction<ProfileDraft>>;

  setAuthenticated: Dispatch<SetStateAction<boolean>>;
  setAuthChecking: Dispatch<SetStateAction<boolean>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setPageError: Dispatch<SetStateAction<string>>;

  activateRole: (role: "admin") => void;
  clearRole: () => void;
};

const todayISO = () => {
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function useAdminWorkspace({
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
}: Props) {
  const router = useRouter();

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
    let active = true;

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

    const redirectToLogin = () => {
      if (!active) return;

      setAuthenticated(false);
      clearRole();
      setAuthChecking(false);
      router.replace("/admin/login");
    };

    const checkSession = async () => {
      try {
        const response = await fetch(`${API}/auth/session`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!active) return;

        if (!response.ok) {
          redirectToLogin();
          return;
        }

        const session = await response.json();

        if (!active) return;

        if (session?.user?.role !== "admin") {
          redirectToLogin();
          return;
        }

        activateRole("admin");
        setAuthenticated(true);
        setAuthChecking(false);

        void loadWorkspace(initialDate);
      } catch {
        redirectToLogin();
      }
    };

    void checkSession();

    return () => {
      active = false;
      window.clearTimeout(dateTimer);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activateRole, clearRole, router]);

  return {
    loadWorkspace,
  };
}
