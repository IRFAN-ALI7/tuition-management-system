import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";

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
  // Attendance is now loaded by the Attendance section, not at start-up.
  loadAttendance?: (id: string, date: string) => Promise<void>;

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

type Outcome = "ready" | "signed-out" | "failed";

const todayISO = () => {
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

const messageOf = (reason: unknown) =>
  reason instanceof Error && reason.message
    ? reason.message
    : "Could not load the workspace.";

const statusOf = (result: PromiseSettledResult<unknown>) =>
  result.status === "rejected"
    ? (result.reason as { status?: number } | null)?.status
    : undefined;

/**
 * Starts every request the dashboard needs AT THE SAME TIME.
 * One round trip instead of a long chain, so the screen opens much faster.
 * The profile request is admin-only, so it also proves the session is valid.
 */
function requestWorkspaceData(p: Props, selectedDate: string) {
  return Promise.allSettled([
    p.refreshBatches(),
    p.refreshStudents(),
    api("/auth/admin/profile"),
    p.loadDashboardFees(selectedDate),
  ]);
}

function applyWorkspaceData(
  results: PromiseSettledResult<unknown>[],
  p: Props,
): Outcome {
  // Not signed in, session expired, or not an admin.
  if (
    results.some((result) => {
      const status = statusOf(result);
      return status === 401 || status === 403;
    })
  ) {
    return "signed-out";
  }

  const [batchesResult, , profileResult] = results;

  const firstFailure = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );

  if (firstFailure) {
    p.setPageError(messageOf(firstFailure.reason));
  }

  // Without the profile we cannot confirm the admin session.
  if (profileResult.status !== "fulfilled") {
    return "failed";
  }

  const profile = (profileResult.value as { profile: AdminProfile }).profile;

  p.setAdminProfile(profile);

  p.setProfileDraft({
    name: profile.name,
    phone: profile.phone,
    email: profile.email,
    image: profile.image,
  });

  if (batchesResult.status === "fulfilled") {
    const nextBatches = batchesResult.value as Batch[];
    const activeBatches = nextBatches.filter((item) => item.active);

    const chosen =
      activeBatches.find((item) => item._id === p.batchId) ??
      activeBatches[0] ??
      nextBatches[0];

    p.setBatchId(chosen?._id ?? "");
  }

  return "ready";
}

export default function useAdminWorkspace(props: Props) {
  const router = useRouter();

  // Always holds the latest props, so the start-up effect runs only once
  // and never needs a lint-disable comment.
  const latest = useRef(props);

  useEffect(() => {
    latest.current = props;
  });

  // Manual reload of the dashboard data (not used at start-up).
  const loadWorkspace = useCallback(
    async (selectedDate = todayISO()) => {
      const p = latest.current;

      p.setLoading(true);
      p.setPageError("");

      try {
        const results = await requestWorkspaceData(p, selectedDate);
        const outcome = applyWorkspaceData(results, latest.current);

        if (outcome === "signed-out") {
          p.setAuthenticated(false);
          p.clearRole();
          router.replace("/admin/login");
        }
      } finally {
        p.setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    let active = true;

    const initialDate = todayISO();

    const dateTimer = window.setTimeout(() => {
      if (!active) return;

      const p = latest.current;

      p.setDate(initialDate);

      p.setTodayLabel(
        new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      );

      const currentHour = new Date().getHours();

      p.setGreeting(
        currentHour < 12
          ? "Good Morning"
          : currentHour < 18
            ? "Good Afternoon"
            : "Good Evening",
      );
    }, 0);

    const start = async () => {
      const results = await requestWorkspaceData(latest.current, initialDate);

      if (!active) return;

      const p = latest.current;
      const outcome = applyWorkspaceData(results, p);

      if (outcome === "signed-out") {
        p.setAuthenticated(false);
        p.clearRole();
        router.replace("/admin/login");
        return;
      }

      if (outcome === "ready") {
        p.activateRole("admin");
        p.setAuthenticated(true);
      }

      // "failed": the error message is already shown on the page.
      p.setLoading(false);
      p.setAuthChecking(false);
    };

    void start();

    return () => {
      active = false;
      window.clearTimeout(dateTimer);
    };
  }, [router]);

  return {
    loadWorkspace,
  };
}