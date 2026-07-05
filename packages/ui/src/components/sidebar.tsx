"use client";

export function Sidebar({
  items,
  active,
}: {
  items: Array<{ label: string; href: string; icon?: any }>;
  active: string;
}) {
  return (
    <aside className="lux-panel lux-panel-strong sticky top-0 hidden h-screen w-72 flex-col rounded-none border-r border-white/30 p-6 lg:flex">
      <div className="mb-10">
        <div className="lux-heading text-3xl font-bold text-[#8f4a00]">
          Karali
        </div>
        <div className="mt-1 text-xs uppercase tracking-[0.32em] text-[#554336]/60">
          Admin Portal
        </div>
      </div>
      <nav className="space-y-2">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={[
              "flex items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-medium transition-all duration-300",
              active === item.label
                ? "bg-[#ffdcc4] text-[#2f1400] shadow-[0_16px_30px_-20px_rgba(143,74,0,0.6)]"
                : "text-[#554336] hover:bg-white/60 hover:text-[#231a13]",
            ].join(" ")}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/60 text-base text-[#8f4a00]">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
      <div className="lux-panel mt-auto rounded-[28px] p-5">
        <div className="text-[11px] uppercase tracking-[0.3em] text-[#554336]/65">
          Service mode
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <div className="lux-heading text-lg font-semibold text-[#231a13]">
              Terminal 5
            </div>
            <div className="text-sm text-[#554336]">
              Luxury dining operations
            </div>
          </div>
          <span className="lux-chip">Live</span>
        </div>
      </div>
    </aside>
  );
}
