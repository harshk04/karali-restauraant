"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../lib";

type PasswordInputProps = {
  className?: string;
  value?: string;
  placeholder?: string;
  onChange?: (event: { target: { value: string } }) => void;
  [key: string]: unknown;
};

export function PasswordInput({ className, onChange, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <input
        type={visible ? "text" : "password"}
        className={cn(
          "h-12 w-full rounded-2xl border border-transparent bg-[#f4f0ec] px-4 pr-12 text-[16px] text-[#231a13] outline-none transition-all duration-300 placeholder:text-[#8e7f74] focus:border-[#c96a00]/30 focus:bg-white focus:shadow-[0_0_0_1.5px_#c96a00,0_0_18px_rgba(201,106,0,0.12)] sm:text-sm",
          className,
        )}
        onChange={onChange}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-2xl text-[#8f4a00] transition-colors hover:text-[#a55600] focus:outline-none focus:ring-2 focus:ring-[#c96a00]/30"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
