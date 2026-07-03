import { Footer, Navbar } from "@karali/ui";
import { MarketingSections } from "../features/home/marketing-sections";

export default function HomePage() {
  const mobileNav = [
    { label: "Home", href: "/" as const },
    { label: "Book", href: "/book" as const },
    { label: "My Trips", href: "/reservation-confirmed" as const },
    { label: "Profile", href: "/login" as const },
  ] as const;

  return (
    <main>
      <Navbar />
      <div className="mx-auto max-w-[1280px] px-5 py-10 lg:px-16 lg:py-16">
        <MarketingSections />
      </div>
      <Footer />
      <nav className="fixed bottom-0 z-50 flex h-20 w-full items-center justify-around border-t border-white/20 bg-white/80 px-5 backdrop-blur-lg md:hidden">
        {mobileNav.map((item, index) => (
          <a
            key={item.label}
            href={item.href}
            className={index === 0 ? "flex flex-col items-center text-[#8f4a00]" : "flex flex-col items-center text-[#554336]/60"}
          >
            <span className="text-2xl">{index === 0 ? "⌂" : index === 1 ? "+" : index === 2 ? "◫" : "◉"}</span>
            <span className="text-xs">{item.label}</span>
          </a>
        ))}
      </nav>
    </main>
  );
}
