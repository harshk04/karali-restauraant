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
        "h-12 w-full rounded-2xl border border-transparent bg-[#f4f0ec] px-4 text-sm text-[#231a13] outline-none transition-all duration-300 placeholder:text-[#8e7f74] focus:border-[#c96a00]/30 focus:bg-white focus:shadow-[0_0_0_1.5px_#c96a00,0_0_18px_rgba(201,106,0,0.12)]",
        className,
      )}
      {...props}
    />
  );
}
