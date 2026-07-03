"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, Sidebar } from "@karali/ui";
import { api } from "../../lib/api";

const items = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <span>▦</span> },
  { label: "Bookings", href: "/admin/bookings", icon: <span>▤</span> },
  { label: "Manual Booking", href: "/admin/manual-booking", icon: <span>＋</span> },
  { label: "Availability", href: "/admin/availability", icon: <span>▥</span> },
  { label: "Coupons", href: "/admin/coupons", icon: <span>◫</span> },
  { label: "QR Scanner", href: "/admin/scanner", icon: <span>▣</span> },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const active = items.find((item) => pathname?.startsWith(item.href))?.label || "Dashboard";

  useEffect(() => {
    api.get("/admin/auth/me").catch(() => router.replace("/login?redirect=/admin/dashboard"));
  }, [router]);

  async function logout() {
    await api.post("/admin/auth/logout");
    window.localStorage.removeItem("karali_admin_token");
    document.cookie = "admin_session_hint=; path=/; max-age=0; samesite=lax";
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-[#fff8f5]">
      <div className="flex">
        <Sidebar active={active} items={items as unknown as Array<{ label: string; href: string; icon?: any }>} />
        <div className="min-h-screen flex-1">
          <header className="sticky top-0 z-30 flex h-[84px] items-center justify-between border-b border-[#efe2d8] bg-white/75 px-6 backdrop-blur-xl md:px-16">
            <div>
              <h1 className="text-3xl font-bold text-[#231a13]">Admin Panel</h1>
              <div className="text-sm text-[#554336]">Bookings, availability, coupons, and operations</div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" type="button" onClick={logout}>
                Logout
              </Button>
            </div>
          </header>
          {children}
        </div>
      </div>
    </main>
  );
}
