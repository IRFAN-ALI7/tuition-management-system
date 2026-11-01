import { useState } from "react";

import { api } from "@/lib/api";
import type { DashboardFeeSummary } from "@/components/admin/shared/types";

export default function useAdminDashboard() {
  const [dashboardFeeSummary, setDashboardFeeSummary] =
    useState<DashboardFeeSummary>({
      totalExpected: 0,
      feesCollected: 0,
      totalDue: 0,
      studentsPaid: 0,
      studentsDue: 0,
    });

  const loadDashboardFees = async (selectedDate = new Date().toISOString().slice(0, 10)) => {
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

  return {
    dashboardFeeSummary,
    loadDashboardFees,
  };
}