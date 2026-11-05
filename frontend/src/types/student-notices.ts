
export type NoticeAudience =
  | "all"
  | "all_students"
  | "batch"
  | "personal";

export interface NoticeBatch {
  _id: string;
  name: string;
}

export interface StudentNotice {
  _id: string;
  title: string;
  message: string;
  recipientType:
    | "ALL_STUDENTS"
    | "BATCH_WISE"
    | "SINGLE_STUDENT";
  batch: NoticeBatch | null;
  createdAt?: string;
}

export interface NoticeSummary {
  total: number;
  allStudents: number;
  batch: number;
  personal: number;
}

export interface NoticePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StudentNoticeResponse {
  notices: StudentNotice[];
  summary: NoticeSummary;
  pagination: NoticePagination;
}

export const DEFAULT_NOTICE_SUMMARY: NoticeSummary = {
  total: 0,
  allStudents: 0,
  batch: 0,
  personal: 0,
};

export const DEFAULT_NOTICE_PAGINATION: NoticePagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

export function formatNoticeDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getNoticeAudienceLabel(
  recipientType: StudentNotice["recipientType"]
) {
  switch (recipientType) {
    case "ALL_STUDENTS":
      return "All Students";

    case "BATCH_WISE":
      return "Your Batch";

    case "SINGLE_STUDENT":
      return "Personal Notice";

    default:
      return "Announcement";
  }
}
