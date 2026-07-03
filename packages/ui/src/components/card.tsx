"use client";

import { cn } from "../lib";

export function Card({ className, ...props }: { className?: string; [key: string]: unknown }) {
  return (
    <div
      className={cn(
        "rounded-[32px] border border-white/20 bg-white/70 p-6 shadow-[0_10px_30px_-5px_rgba(30,41,59,0.08)] backdrop-blur-md",
        className,
      )}
      {...props}
    />
  );
}
