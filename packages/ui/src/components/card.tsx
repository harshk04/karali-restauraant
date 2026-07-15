"use client";

import { cn } from "../lib";

export function Card({
  className,
  ...props
}: {
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <div
      className={cn(
        "lux-panel rounded-[28px] p-4 transition-transform duration-300 sm:rounded-[32px] sm:p-6 hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_rgba(30,41,59,0.22)]",
        className,
      )}
      {...props}
    />
  );
}
