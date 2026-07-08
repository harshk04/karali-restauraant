"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Search } from "lucide-react";
import { Button, Drawer, Sidebar } from "@karali/ui";
import { api } from "../../lib/api";

const items = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <span>◫</span> },
  { label: "Bookings", href: "/admin/bookings", icon: <span>◧</span> },
  {
    label: "Add Booking",
    href: "/admin/manual-booking",
    icon: <span>＋</span>,
  },
  { label: "Availability", href: "/admin/availability", icon: <span>◩</span> },
  { label: "Coupons", href: "/admin/coupons", icon: <span>◪</span> },
  { label: "Staff Management", href: "/admin/staff-management", icon: <span>◫</span> },
  { label: "QR Scanner", href: "/admin/scanner", icon: <span>◎</span> },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const active =
    items.find((item) => pathname?.startsWith(item.href))?.label || "Dashboard";

  useEffect(() => {
    api
      .get("/admin/auth/me")
      .catch(() => router.replace("/login?redirect=/admin/dashboard"));
  }, [router]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  async function logout() {
    await api.post("/admin/auth/logout");
    window.localStorage.removeItem("karali_admin_token");
    document.cookie = "admin_session_hint=; path=/; max-age=0; samesite=lax";
    router.replace("/login");
  }

  return (
    <main className="lux-page-shell min-h-screen bg-transparent">
      <div className="flex min-h-screen flex-col lg:flex-row lg:items-start">
        <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:shrink-0">
          <Sidebar
            active={active}
            items={
              items as unknown as Array<{
                label: string;
                href: string;
                icon?: any;
              }>
            }
            footer={
              <Button
                variant="secondary"
                type="button"
                onClick={logout}
                className="w-full"
              >
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
            items={
              items as unknown as Array<{
                label: string;
                href: string;
                icon?: any;
              }>
            }
            footer={
              <Button
                variant="secondary"
                type="button"
                onClick={logout}
                className="w-full"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            }
            onNavigate={() => setMobileNavOpen(false)}
            className="w-full rounded-none border-0 shadow-none"
          />
        </Drawer>
        <div className="min-h-screen flex-1 lg:h-screen lg:overflow-y-auto">
          <header className="sticky top-0 z-30 border-b border-white/30 bg-white/72 px-4 py-4 backdrop-blur-xl sm:px-6 md:px-10 xl:px-16">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="lux-heading truncate text-2xl font-bold text-[#231a13] sm:text-3xl">
                  Admin Panel
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-full border border-white/30 bg-white/70 px-4 py-3 text-sm text-[#554336] shadow-[0_10px_25px_-18px_rgba(30,41,59,0.32)] backdrop-blur-md md:flex">
                  <Search className="h-4 w-4 text-[#8f4a00]" />
                  <span>Search reservations, guests, or codes</span>
                </div>
                <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-[#8f4a00] shadow-[0_12px_25px_-18px_rgba(30,41,59,0.32)] transition-transform duration-300 hover:-translate-y-0.5">
                  <Bell className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e8d9cd] bg-white/80 text-[#8f4a00] shadow-[0_10px_25px_-18px_rgba(30,41,59,0.32)] transition-transform duration-300 hover:-translate-y-0.5 lg:hidden"
                  onClick={() => setMobileNavOpen(true)}
                  aria-label="Open admin navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>
          <div className="px-4 py-6 sm:px-6 md:px-10 xl:px-16">{children}</div>
        </div>
      </div>
    </main>
  );
}
