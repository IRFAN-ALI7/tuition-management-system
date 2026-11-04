
import type { ReactNode } from "react";
import StudentShell from "@/components/student/layout/StudentShell";

// Disable instant-navigation validation for Student Portal.
export const instant = false;

export default function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <StudentShell>{children}</StudentShell>;
}
