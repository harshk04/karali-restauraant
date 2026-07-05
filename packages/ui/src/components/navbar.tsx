"use client";

import { Button } from "./button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/30 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4 lg:px-16">
        <div className="flex items-center gap-10">
          <a href="/" className="lux-heading text-2xl font-bold text-[#8f4a00]">
            Karali Restaurant
          </a>
          <nav className="hidden items-center gap-8 md:flex">
            {[
              { label: "Home", href: "/" },
              { label: "About", href: "/about" },
              { label: "Contact", href: "/contact" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-[16px] font-medium text-[#231a13] transition-colors duration-300 hover:text-[#8f4a00]"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button href="/book">Make Reservation</Button>
        </div>
      </div>
    </header>
  );
}
