"use client";

const steps = ["Date", "Time", "Guests", "Details", "Review"];

export function BookingStepper({ current }: { current: number }) {
  return (
    <div className="hidden lux-panel flex-col gap-3 rounded-[28px] p-4 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:rounded-[32px] sm:px-5 sm:py-4">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-3 sm:flex-1">
          <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/55 px-3 py-3 sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0">
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
                [
                  "hidden sm:block",
                  index <= current
                    ? "font-semibold text-[#8f4a00]"
                    : "text-[#554336]/60",
                ].join(" ")
              }
              >
              {step}
            </span>
          </div>
          {index < steps.length - 1 ? (
            <div
              className={[
                "hidden h-[2px] min-w-8 flex-1 rounded-full sm:block",
                index < current ? "bg-[#8f4a00]" : "bg-[#dcc2b1]",
              ].join(" ")}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}
