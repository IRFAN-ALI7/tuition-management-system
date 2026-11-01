import { useState } from "react";

import { api } from "@/lib/api";

import type {
  Batch,
  BatchSummary,
} from "@/components/admin/shared/types";

export default function useAdminBatches() {
  const [batches, setBatches] = useState<Batch[]>([]);

  const [batchSummary, setBatchSummary] = useState<BatchSummary>({
    totalBatches: 0,
    activeBatches: 0,
    totalStudents: 0,
  });

  const refreshBatches = async () => {
    const result = await api("/batches?includeInactive=true");

    setBatches(result.batches as Batch[]);

    if (result.summary) {
      setBatchSummary(result.summary as BatchSummary);
    }

    return result.batches as Batch[];
  };

  return {
    batches,
    setBatches,
    batchSummary,
    refreshBatches,
  };
}