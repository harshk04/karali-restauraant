"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Search, Sparkles } from "lucide-react";
import { Button, Sidebar } from "@karali/ui";
import { api } from "../../lib/api";

const items = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <span>◫</span> },
  { label: "Bookings", href: "/admin/bookings", icon: <span>◧</span> },
  {
    label: "Manual Booking",
    href: "/admin/manual-booking",
    icon: <span>＋</span>,
  },
  { label: "Availability", href: "/admin/availability", icon: <span>◩</span> },
  { label: "Coupons", href: "/admin/coupons", icon: <span>◪</span> },
  { label: "QR Scanner", href: "/admin/scanner", icon: <span>◎</span> },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const active =
    items.find((item) => pathname?.startsWith(item.href))?.label || "Dashboard";

  useEffect(() => {
    api
      .get("/admin/auth/me")
      .catch(() => router.replace("/login?redirect=/admin/dashboard"));
  }, [router]);

  async function logout() {
    await api.post("/admin/auth/logout");
    window.localStorage.removeItem("karali_admin_token");
    document.cookie = "admin_session_hint=; path=/; max-age=0; samesite=lax";
    router.replace("/login");
  }

  return (
    <main className="lux-page-shell min-h-screen bg-transparent">
      <div className="flex">
        <Sidebar
          active={active}
          items={
            items as unknown as Array<{
              label: string;
              href: string;
              icon?: any;
            }>
          }
        />
        <div className="min-h-screen flex-1">
          <header className="sticky top-0 z-30 border-b border-white/30 bg-white/72 px-6 py-5 backdrop-blur-xl md:px-10 xl:px-16">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="lux-eyebrow">Operations Console</p>
                <h1 className="lux-heading mt-2 text-3xl font-bold text-[#231a13]">
                  Admin Panel
                </h1>
                <div className="text-sm text-[#554336]">
                  Bookings, availability, coupons, and real-time floor control
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="hidden items-center gap-2 rounded-full border border-white/30 bg-white/70 px-4 py-3 text-sm text-[#554336] shadow-[0_10px_25px_-18px_rgba(30,41,59,0.32)] backdrop-blur-md md:flex">
                  <Search className="h-4 w-4 text-[#8f4a00]" />
                  <span>Search reservations, guests, or codes</span>
                </div>
                <div className="lux-chip">
                  <Sparkles className="h-3.5 w-3.5" />
                  Live ops
                </div>
                <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-[#8f4a00] shadow-[0_12px_25px_-18px_rgba(30,41,59,0.32)] transition-transform duration-300 hover:-translate-y-0.5">
                  <Bell className="h-5 w-5" />
                </button>
                <Button variant="secondary" type="button" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </header>
          <div className="px-6 py-8 md:px-10 xl:px-16">{children}</div>
        </div>
      </div>
    </main>
  );
}
