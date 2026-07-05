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
        "lux-panel rounded-[32px] p-6 transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_rgba(30,41,59,0.22)]",
        className,
      )}
      {...props}
    />
  );
}
