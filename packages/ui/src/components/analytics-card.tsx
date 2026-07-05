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
    <Card className="lux-reveal border border-white/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#554336]/60">
            {title}
          </p>
          <p className="lux-heading mt-3 text-4xl font-bold text-[#231a13]">
            {value}
          </p>
          {subtitle ? (
            <p className="mt-2 text-sm text-[#554336]/70">{subtitle}</p>
          ) : null}
        </div>
        {delta ? <span className="lux-chip">{delta}</span> : null}
      </div>
    </Card>
  );
}
