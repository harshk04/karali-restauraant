"use client";

const steps = ["Date", "Time", "Guests", "Details", "Review"];

export function BookingStepper({ current }: { current: number }) {
  return (
    <div className="lux-panel flex flex-wrap items-center gap-3 rounded-[32px] px-5 py-4">
      {steps.map((step, index) => (
        <div key={step} className="contents">
          <div className="flex items-center gap-3">
            <div
              className={[
                "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                index <= current
                  ? "bg-[#8f4a00] text-white shadow-[0_10px_24px_-12px_rgba(143,74,0,0.9)]"
                  : "bg-[#dcc2b1] text-[#231a13]/60",
              ].join(" ")}
            >
              {index + 1}
            </div>
            <span
              className={
                index <= current
                  ? "font-semibold text-[#8f4a00]"
                  : "text-[#554336]/60"
              }
            >
              {step}
            </span>
          </div>
          {index < steps.length - 1 ? (
            <div
              className={[
                "h-[2px] min-w-8 flex-1 rounded-full",
                index < current ? "bg-[#8f4a00]" : "bg-[#dcc2b1]",
              ].join(" ")}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}
