"use client";

const steps = ["Date", "Time", "Guests", "Details", "Review"];

export function BookingStepper({ current }: { current: number }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[32px] border border-white/20 bg-white/70 px-5 py-4 shadow-[0_10px_30px_-5px_rgba(30,41,59,0.08)] backdrop-blur-md">
      {steps.map((step, index) => (
        <div key={step} className="contents">
          <div className="flex items-center gap-3">
            <div
              className={[
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                index <= current ? "bg-[#8f4a00] text-white" : "bg-[#dcc2b1] text-[#231a13]/60",
              ].join(" ")}
            >
              {index + 1}
            </div>
            <span className={index <= current ? "font-semibold text-[#8f4a00]" : "text-[#554336]/60"}>{step}</span>
          </div>
          {index < steps.length - 1 ? <div className="h-[2px] min-w-8 flex-1 rounded-full bg-[#dcc2b1]" /> : null}
        </div>
      ))}
    </div>
  );
}
