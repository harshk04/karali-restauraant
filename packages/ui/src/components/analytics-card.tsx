"use client";
import { Card } from "./card";

export function AnalyticsCard({
  title,
  value,
  delta,
  subtitle,
}: {
  title: string;
  value: string;
  delta?: string;
  subtitle?: string;
}) {
  return (
    <Card className="border-l-4 border-l-[#8f4a00]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#554336]/60">{title}</p>
          <p className="mt-3 text-3xl font-bold text-[#231a13]">{value}</p>
          {subtitle ? <p className="mt-2 text-sm text-[#554336]/70">{subtitle}</p> : null}
        </div>
        {delta ? <span className="rounded-full bg-[#ffdcc4] px-3 py-1 text-xs font-semibold text-[#2f1400]">{delta}</span> : null}
      </div>
    </Card>
  );
}
