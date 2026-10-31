export type Student = {
  _id: string;
  studentId?: string;
  name: string;
  phone: string;
  fatherName: string;
  address?: string;
  gender?: string;
  className?: string;
  admissionDate?: string;
  monthlyFees?: number | null;
  profilePhoto?: string;
  batchId?:
    | string
    | {
        _id: string;
        name: string;
        startTime: string;
        endTime: string;
        active: boolean;
      }
    | null;
  active: boolean;
  createdAt?: string;
  status?: "present" | "absent";
};

export type Batch = {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  active: boolean;
  createdAt?: string;
  students: Student[];
};

export type StudentSummary = {
  total: number;
  active: number;
  inactive: number;
  totalBatches: number;
  growth: Record<string, number>;
};

export type BatchSummary = {
  totalBatches: number;
  activeBatches: number;
  totalStudents: number;
};

export type DashboardFeeSummary = {
  totalExpected: number;
  feesCollected: number;
  totalDue: number;
  studentsPaid: number;
  studentsDue: number;
};

export type StudentPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type StudentFilters = {
  q: string;
  className: string;
  batchId: string;
  status: string;
  page: number;
  limit: number;
};

export type AdminProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
  emailVerified: boolean;
  pendingEmail: string;
  image: string;
};

export type Section =
  | "Dashboard"
  | "Students"
  | "Classes & Batches"
  | "Attendance"
  | "Fees"
  | "Tests & Results"
  | "Notices"
  | "Reports"
  | "Audit Logs"
  | "Settings"
  | "Profile";

export type BatchDraft = {
  name: string;
  startTime: string;
  endTime: string;
  studentIds: string[];
};

export type StudentEditDraft = {
  name: string;
  fatherName: string;
  phone: string;
  address: string;
  gender: string;
  className: string;
  batchId: string;
  admissionDate: string;
  monthlyFees: string;
};