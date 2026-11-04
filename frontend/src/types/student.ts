
export interface Student {
  _id: string;
  name: string;
  fatherName?: string;
  phone: string;
  address?: string;
  profilePhoto?: string;
  className?: string;
  gender?: string;
  admissionDate?: string;
  studentId?: string;
  active?: boolean;
}

export interface StudentBatch {
  _id: string;
  name: string;
  startTime?: string;
  endTime?: string;
  active?: boolean;
}

export interface StudentAttendance {
  present: number;
  absent: number;
  total: number;
  percentage: number;
}

export interface StudentApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
  student?: Student;
  batch?: StudentBatch | null;
  attendance?: StudentAttendance;
}
