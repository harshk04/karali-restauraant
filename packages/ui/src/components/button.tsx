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

export function Button({ className, variant = "primary", type = "button", href, ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c96a00]/30 disabled:pointer-events-none disabled:opacity-50";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-[#8f4a00] text-white shadow-lg shadow-[#8f4a00]/15 hover:bg-[#a55600] hover:-translate-y-0.5",
    secondary:
      "border border-[#8f4a00] bg-transparent text-[#8f4a00] hover:bg-[#fff1e9] hover:-translate-y-0.5",
    ghost: "bg-transparent text-[#231a13] hover:bg-black/5",
    glass: "bg-white/20 text-white backdrop-blur-md border border-white/20 hover:bg-white/25",
  };

  if (href) {
    return <a href={href} className={cn(base, variants[variant], className)} {...props} />;
  }

  return <button type={type} className={cn(base, variants[variant], className)} {...props} />;
}
