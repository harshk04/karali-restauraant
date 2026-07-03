"use client";

export function Sidebar({
  items,
  active,
}: {
  items: Array<{ label: string; href: string; icon?: any }>;
  active: string;
}) {
  return (
    <aside className="hidden h-screen w-64 flex-col border-r border-white/20 bg-[#fdeadf] p-5 lg:flex">
      <div className="mb-8">
        <div className="text-2xl font-bold text-[#8f4a00]">Karali</div>
        <div className="text-xs uppercase tracking-[0.3em] text-[#554336]/60">Portal</div>
      </div>
      <nav className="space-y-2">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={[
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
              active === item.label ? "bg-[#ffdcc4] text-[#2f1400]" : "text-[#554336] hover:bg-white/50",
            ].join(" ")}
          >
            {item.icon}
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
