import type { ReactNode } from "react";
import { StaffShell } from "../../features/staff/staff-shell";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return <StaffShell>{children}</StaffShell>;
}
