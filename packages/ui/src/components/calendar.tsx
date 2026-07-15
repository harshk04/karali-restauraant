"use client";

export function Calendar({ monthLabel }: { monthLabel: string }) {
  return (
    <div className="rounded-[28px] border border-white/20 bg-white/70 p-4 shadow-[0_10px_30px_-5px_rgba(30,41,59,0.08)] backdrop-blur-md sm:rounded-[32px] sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-[#231a13]">{monthLabel}</h3>
        <span className="text-sm text-[#554336]/70">Live availability</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-[0.14em] text-[#554336]/50 sm:gap-2 sm:text-xs sm:tracking-[0.18em]">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 sm:gap-2">
        {Array.from({ length: 35 }).map((_, index) => {
          const active = index === 14;
          return (
            <div
              key={index}
              className={[
                "flex min-h-10 items-center justify-center rounded-2xl text-sm font-medium",
                active ? "bg-[#8f4a00] text-white shadow-lg shadow-[#8f4a00]/15" : "bg-[#fff8f5] text-[#231a13]",
              ].join(" ")}
            >
              {index + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
}
