"use client";

import { cn } from "../lib";

export function Modal({
  open,
  title,
  children,
  className,
}: {
  open: boolean;
  title: string;
  children: any;
  className?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-3 sm:items-center sm:p-4">
      <div
        className={cn(
          "flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-[28px] bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-[32px] sm:p-6",
          className,
        )}
      >
        <h2 className="mb-4 shrink-0 text-2xl font-bold text-[#231a13]">
          {title}
        </h2>
        <div className="min-h-0 overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
}
