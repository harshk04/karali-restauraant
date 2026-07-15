"use client";

import { cn } from "../lib";

export function Drawer({
  open,
  children,
  side = "right",
}: {
  open: boolean;
  children: any;
  side?: "left" | "right";
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/35">
      <aside
        className={cn(
          "absolute top-0 flex h-full w-[min(100vw-1rem,24rem)] max-w-none flex-col overflow-y-auto bg-white p-4 shadow-2xl sm:p-6",
          side === "right"
            ? "right-0 rounded-l-[28px] sm:rounded-l-[32px]"
            : "left-0 rounded-r-[28px] sm:rounded-r-[32px]",
        )}
      >
        {children}
      </aside>
    </div>
  );
}
