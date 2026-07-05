import "../(theme)/theme.css";
import type { ReactNode } from "react";
import { ThemeShell } from "../../components/theme1/theme-shell";

export default function GuestDetailsPaymentLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ThemeShell>{children}</ThemeShell>;
}
