import "./theme.css";
import type { ReactNode } from "react";
import { ThemeShell } from "../../components/theme1/theme-shell";

export default function ThemeLayout({ children }: { children: ReactNode }) {
  return <ThemeShell>{children}</ThemeShell>;
}
