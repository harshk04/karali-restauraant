"use client";

import { Card } from "./card";

export function DatePicker({
  dates,
  selected,
  onSelect,
}: {
  dates: string[];
  selected?: string;
  onSelect: (value: string) => void;
}) {
  return (
    <Card className="p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {dates.map((date) => (
          <button
            key={date}
            type="button"
            onClick={() => onSelect(date)}
            className={[
              "rounded-2xl border px-4 py-3 text-left transition-all",
              selected === date
                ? "border-[#8f4a00] bg-[#ffdcc4] text-[#2f1400]"
                : "border-white/20 bg-white/60 text-[#231a13] hover:border-[#8f4a00]/30",
            ].join(" ")}
          >
            <div className="text-xs uppercase tracking-[0.2em] text-[#554336]/60">{new Date(date).toLocaleDateString("en-US", { weekday: "short" })}</div>
            <div className="mt-1 text-lg font-semibold">{new Date(date).getDate()}</div>
          </button>
        ))}
      </div>
    </Card>
  );
}
