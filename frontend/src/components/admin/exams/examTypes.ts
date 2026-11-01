
export type BatchOption = {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  active: boolean;
};

export type Student = {
  _id: string;
  studentId?: string;
  name: string;
  className?: string;
  active?: boolean;
};

export type Exam = {
  _id: string;
  examDate: string;
  name: string;
  subject: string;
  totalMarks: number;
  batch: BatchOption;
  studentsCount: number;
  averagePercentage: number | null;
  resultsEntered: number;
};

export type ExamResultRow = {
  student: Student;
  obtainedMarks: number | null;
  percentage: number | null;
  saveStatus: string;
};

export type ExamDetail = {
  exam: Exam;
  results: ExamResultRow[];
  summary: {
    studentsCount: number;
    entered: number;
    pending: number;
    averagePercentage: number | null;
    highestMarks: number | null;
    lowestMarks: number | null;
  };
};

export type HistoryResult = {
  examId: string;
  examDate: string;
  name: string;
  subject: string;
  batch: BatchOption;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
};

export type ExamDraft = {
  examDate: string;
  name: string;
  batchId: string;
  subject: string;
  totalMarks: string;
};

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
