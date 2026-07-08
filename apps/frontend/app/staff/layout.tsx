"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { StaffShell } from "../../features/staff/staff-shell";

export default function StaffLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/staff/login") {
    return <>{children}</>;
  }

  return <StaffShell>{children}</StaffShell>;
}
