import "./globals.css";
import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "../providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins" });

export const metadata: Metadata = {
  title: "Karali Restaurant Platform",
  description: "Airport dining booking portal for customers, staff, and admins.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.variable} ${poppins.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
