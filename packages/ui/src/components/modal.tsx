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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 sm:items-center">
      <div className={cn("w-full max-w-xl rounded-[32px] bg-white p-6 shadow-2xl", className)}>
        <h2 className="mb-4 text-2xl font-bold text-[#231a13]">{title}</h2>
        {children}
      </div>
    </div>
  );
}
