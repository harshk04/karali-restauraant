"use client";

import { cn } from "../lib";

type InputProps = {
  className?: string;
  type?: string;
  value?: string;
  placeholder?: string;
  readOnly?: boolean;
  onChange?: (event: { target: { value: string } }) => void;
  [key: string]: unknown;
};

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "h-12 w-full rounded-xl border-0 bg-slate-100 px-4 text-sm text-[#231a13] outline-none transition-shadow placeholder:text-slate-400 focus:bg-white focus:shadow-[0_0_0_1.5px_#c96a00,0_0_8px_rgba(201,106,0,0.15)]",
        className,
      )}
      {...props}
    />
  );
}
