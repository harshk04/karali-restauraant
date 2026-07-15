"use client";

import { Button } from "./button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/30 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-4 sm:px-5 lg:px-16">
        <div className="flex min-w-0 items-center gap-4 sm:gap-10">
          <a href="/" className="lux-heading text-xl font-bold text-[#8f4a00] sm:text-2xl">
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
        <div className="flex items-center gap-3">
          <Button href="/book" className="hidden sm:inline-flex">
            Make Reservation
          </Button>
          <details className="group relative md:hidden">
            <summary
              className="flex h-11 w-11 list-none items-center justify-center rounded-full border border-[#e8d9cd] bg-white/80 text-[#8f4a00] shadow-[0_10px_25px_-18px_rgba(30,41,59,0.32)] transition-transform duration-300 hover:-translate-y-0.5"
              aria-label="Toggle navigation menu"
            >
              <span className="text-lg leading-none group-open:hidden">☰</span>
              <span className="hidden text-lg leading-none group-open:block">×</span>
            </summary>
            <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(90vw,18rem)] rounded-[24px] border border-[#e8d9cd] bg-white p-4 shadow-[0_24px_60px_-24px_rgba(30,41,59,0.32)]">
              <nav className="flex flex-col gap-2">
                {[
                  { label: "Home", href: "/" },
                  { label: "About", href: "/about" },
                  { label: "Contact", href: "/contact" },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="rounded-2xl px-4 py-3 text-[16px] font-medium text-[#231a13] transition-colors duration-300 hover:bg-[#fff1e9] hover:text-[#8f4a00]"
                  >
                    {item.label}
                  </a>
                ))}
                <Button href="/book" className="mt-2 w-full">
                  Make Reservation
                </Button>
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
