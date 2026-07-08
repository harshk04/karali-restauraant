"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, QrCode, User, ListChecks } from "lucide-react";
import { Button, Drawer, Sidebar } from "@karali/ui";
import { staffApi } from "../../lib/staff-api";

const items = [
  { label: "Dashboard", href: "/staff/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "QR Scanner", href: "/staff/scanner", icon: <QrCode className="h-4 w-4" /> },
  { label: "Today's Check-ins", href: "/staff/checkins", icon: <ListChecks className="h-4 w-4" /> },
  { label: "Profile", href: "/staff/profile", icon: <User className="h-4 w-4" /> },
] as const;

export function StaffShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    staffApi.get("/staff/auth/me").catch(() => router.replace("/staff/login"));
  }, [router]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  async function logout() {
    await staffApi.post("/staff/auth/logout");
    document.cookie = "staff_session_hint=; path=/; max-age=0; samesite=lax";
    router.replace("/staff/login");
  }

  const active = items.find((item) => pathname?.startsWith(item.href))?.label || "Dashboard";

  return (
    <main className="lux-page-shell min-h-screen bg-transparent">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <div className="hidden lg:block">
          <Sidebar
            active={active}
            items={items as unknown as Array<{ label: string; href: string; icon?: any }>}
            footer={
              <Button variant="secondary" type="button" onClick={logout} className="w-full">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            }
            className="w-72"
          />
        </div>
        <Drawer open={mobileNavOpen} side="left">
          <Sidebar
            active={active}
            items={items as unknown as Array<{ label: string; href: string; icon?: any }>}
            footer={
              <Button variant="secondary" type="button" onClick={logout} className="w-full">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            }
            onNavigate={() => setMobileNavOpen(false)}
            className="w-full rounded-none border-0 shadow-none"
          />
        </Drawer>
        <div className="min-h-screen flex-1">
          <header className="sticky top-0 z-30 border-b border-white/30 bg-white/72 px-4 py-4 backdrop-blur-xl sm:px-6 md:px-10 xl:px-16">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="lux-heading truncate text-2xl font-bold text-[#231a13] sm:text-3xl">
                  Staff Portal
                </h1>
              </div>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e8d9cd] bg-white/80 text-[#8f4a00] shadow-[0_10px_25px_-18px_rgba(30,41,59,0.32)] transition-transform duration-300 hover:-translate-y-0.5 lg:hidden"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open staff navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </header>
          <div className="px-4 py-6 sm:px-6 md:px-10 xl:px-16">{children}</div>
        </div>
      </div>
    </main>
  );
}
