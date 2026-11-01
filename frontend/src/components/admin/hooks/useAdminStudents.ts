import { useEffect, useState } from "react";

import { api } from "@/lib/api";

import type {
  Student,
  StudentSummary,
  StudentPagination,
  StudentFilters,
} from "@/components/admin/shared/types";

type Props = {
  authenticated: boolean;
  section: string;
};

export default function useAdminStudents({
  authenticated,
  section,
}: Props) {
  const [directory, setDirectory] = useState<Student[]>([]);

  const [studentSummary, setStudentSummary] = useState<StudentSummary>({
    total: 0,
    active: 0,
    inactive: 0,
    totalBatches: 0,
    growth: {},
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

  const refreshStudents = async () => {
    const result = await api("/students?page=1&limit=20");

    setDirectory(result.students as Student[]);
    setStudentSummary(result.summary as StudentSummary);
    setStudentPagination(result.pagination as StudentPagination);
    setStudentClasses(result.classes as string[]);

    return result;
  };

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

 return {
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
};
}