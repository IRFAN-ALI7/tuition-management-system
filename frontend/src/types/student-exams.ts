export interface ExamBatch {
  _id?: string;
  name?: string;
  startTime?: string;
  endTime?: string;
}

export interface ExamResult {
  _id: string;
  examId: string;
  examDate?: string;
  name?: string;
  subject?: string;
  batch?: ExamBatch | string | null;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
}

export interface ExamScoreBand {
  label: string;
  range: string;
  count: number;
}

export interface ExamSummary {
  totalExams: number;
  examsTaken: number;
  examsCompleted: number;
  totalObtained: number;
  totalPossible: number;
  overallAverage: number;
  bestScore: number;
  scoreBands: ExamScoreBand[];
  subjects: string[];
}

export interface ExamPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ExamApiResponse {
  results: ExamResult[];
  summary: ExamSummary;
  pagination: ExamPagination;
}

export const DEFAULT_EXAM_SUMMARY: ExamSummary = {
  totalExams: 0,
  examsTaken: 0,
  examsCompleted: 0,
  totalObtained: 0,
  totalPossible: 0,
  overallAverage: 0,
  bestScore: 0,
  scoreBands: [],
  subjects: [],
};

export function formatExamDate(value?: string) {
  if (!value) return "—";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatMarks(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2);
}