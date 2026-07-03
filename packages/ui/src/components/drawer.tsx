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
          "absolute top-0 h-full w-[90vw] max-w-md bg-white p-6 shadow-2xl",
          side === "right" ? "right-0 rounded-l-[32px]" : "left-0 rounded-r-[32px]",
        )}
      >
        {children}
      </aside>
    </div>
  );
}
