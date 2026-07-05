"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  footerContact,
  navItems,
  reservationHref,
  restaurantName,
  restaurantTagline,
} from "./theme-data";

export function ThemeShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 91);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const activeHref = useMemo(() => {
    if (pathname === "/") return "/";
    if (pathname?.startsWith("/about")) return "/about";
    if (pathname?.startsWith("/contact")) return "/contact";
    return "";
  }, [pathname]);

  const isBookingRoute = useMemo(
    () =>
      pathname?.startsWith("/book") ||
      pathname?.startsWith("/booking") ||
      pathname?.startsWith("/reservation-confirmed") ||
      pathname?.startsWith("/guest-details-payment"),
    [pathname],
  );

  return (
    <div className="theme1-site super_container">
      <header
        className={`header${scrolled ? " scrolled" : ""}${isBookingRoute ? " booking_header" : ""}`}
      >
        <div className="container">
          <div className="row">
            <div className="col">
              <div className="header_content d-flex flex-row align-items-center justify-content-start">
                <div className="logo">
                  <Link href="/">
                    <div>Karali</div>
                    <div>restaurant</div>
                  </Link>
                </div>
                <nav className="main_nav">
                  <ul className="d-flex flex-row align-items-center justify-content-start">
                    {navItems.map((item) => (
                      <li
                        key={item.label}
                        className={activeHref === item.href ? "active" : ""}
                      >
                        <Link href={item.href}>{item.label}</Link>
                      </li>
                    ))}
                  </ul>
                </nav>
                <Link
                  href={reservationHref}
                  className="reservations_phone ml-auto header_reservation_cta"
                >
                  Make Reservation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div
        className={`hamburger_bar trans_400 d-flex flex-row align-items-center justify-content-start${scrolled ? " scrolled" : ""}${isBookingRoute ? " booking_header" : ""}`}
      >
        <div
          className={`hamburger${menuOpen ? " active" : ""}`}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <div className="menu_toggle d-flex flex-row align-items-center justify-content-start">
            <span>menu</span>
            <div className="hamburger_container">
              <div className="menu_hamburger">
                <div className="line_1 hamburger_lines"></div>
                <div className="line_2 hamburger_lines"></div>
                <div className="line_3 hamburger_lines"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`menu trans_800${menuOpen ? " active" : ""}`}>
        <div className="menu_content d-flex flex-column align-items-center justify-content-center text-center">
          <ul>
            {navItems.map((item) => (
              <li key={item.label}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="menu_reservations_phone ml-auto">
          <Link href={reservationHref} className="menu_reservation_cta">
            Make Reservation
          </Link>
        </div>
      </div>

      {children}

      {!isBookingRoute ? (
        <div className="reservations text-center">
          <div
            className="parallax_background parallax-window theme-parallax"
            style={{ backgroundImage: "url(/theme1/images/reservations.jpg)" }}
          ></div>
          <div className="container">
            <div className="row">
              <div className="col">
                <div className="reservations_content d-flex flex-column align-items-center justify-content-center">
                  <div className="res_stars page_subtitle">
                    Karali Restaurant
                  </div>
                  <div className="res_title">
                    Reserve your table before you travel
                  </div>
                  <div className="home_text ml-auto mr-auto">
                    <p>
                      Book your visit in advance for a smoother dining
                      experience at Jaipur International Airport.
                    </p>
                  </div>
                  <div className="res_form_container">
                    <div className="res_form res_form_single">
                      <Link
                        href={reservationHref}
                        className="res_button theme_link_button"
                      >
                        Make Reservation
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="footer">
        <div className="container">
          <div className="row">
            <div className="col-lg-3 footer_col">
              <div className="footer_logo">
                <div className="footer_logo_title">Karali</div>
                <div className="footer_logo_subtitle">restaurant</div>
              </div>
              <div className="copyright">
                <p style={{ lineHeight: 1.2 }}>
                  Copyright &copy;{new Date().getFullYear()} {restaurantName}.
                  All rights reserved.
                </p>
              </div>
            </div>

            <div className="col-lg-6 footer_col">
              <div className="footer_about">
                <p>
                  {restaurantTagline}. Karali Restaurant is designed for
                  travelers who want Indian flavours, dependable service, and a
                  polished place to relax at Jaipur Airport.
                </p>
              </div>
            </div>

            <div className="col-lg-3 footer_col">
              <div className="footer_contact">
                <ul>
                  {footerContact.map((item) => (
                    <li
                      key={`${item.icon}-${item.text}`}
                      className="d-flex flex-row align-items-start justify-content-start"
                    >
                      <div className="footer_contact_icon">
                        <i
                          className={`fa ${item.icon}`}
                          aria-hidden="true"
                        ></i>
                      </div>
                      <div className="footer_contact_text">{item.text}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
