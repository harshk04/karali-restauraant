"use client";
import { Button } from "./button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#efe2d8] bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4 lg:px-16">
        <div className="flex items-center gap-10">
          <a href="/" className="text-2xl font-bold text-[#8f4a00]">
            Karali
          </a>
          <nav className="hidden items-center gap-8 md:flex">
            {["Reservations", "Menu", "Lounge", "Support"].map((item) => (
              <a key={item} href="#" className="text-[16px] font-medium text-[#231a13] transition-colors hover:text-[#8f4a00]">
                {item}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center rounded-full border border-[#efd9c8] bg-[#fff1e9] px-4 py-2 text-[#554336]/50 lg:flex">
            <span className="mr-2">⌕</span>
            <span className="text-sm">Search tables...</span>
          </div>
          <button className="text-xl text-[#8f4a00]">🔔</button>
          <button className="text-xl text-[#8f4a00]">◉</button>
        </div>
      </div>
    </header>
  );
}
