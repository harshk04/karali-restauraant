"use client";

import { cn } from "../lib";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "glass";

type ButtonProps = {
  variant?: ButtonVariant;
  className?: string;
  type?: "button" | "submit" | "reset";
  href?: string;
  [key: string]: unknown;
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  href,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-3 text-[16px] font-semibold transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-[#c96a00]/30 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] sm:px-5 sm:text-sm";
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-[#8f4a00] text-white shadow-[0_18px_40px_-18px_rgba(143,74,0,0.8)] hover:-translate-y-1 hover:bg-[#a55600] hover:shadow-[0_24px_45px_-18px_rgba(143,74,0,0.65)]",
    secondary:
      "border border-[#8f4a00]/30 bg-white/70 text-[#8f4a00] backdrop-blur-md hover:-translate-y-1 hover:bg-[#fff1e9]",
    ghost:
      "bg-transparent text-[#231a13] hover:bg-black/5 hover:-translate-y-0.5",
    glass:
      "border border-white/30 bg-white/20 text-white backdrop-blur-md hover:-translate-y-1 hover:bg-white/25",
  };

  if (href) {
    return (
      <a
        href={href}
        className={cn(base, variants[variant], className)}
        {...props}
      />
    );
  }

  return (
    <button
      type={type}
      className={cn(base, variants[variant], className)}
      {...props}
    />
  );
}
