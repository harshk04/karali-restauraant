"use client";
import { Card } from "./card";

export function QRViewer({ value }: { value: string }) {
  const isDataUrl = value.startsWith("data:image");
  return (
    <Card className="flex flex-col items-center justify-center gap-4 bg-white p-6 text-center">
      <div className="flex h-56 w-56 items-center justify-center rounded-[40px] bg-white shadow-[0_20px_50px_-12px_rgba(143,74,0,0.15)]">
        {isDataUrl ? (
          <img src={value} alt="QR code" className="h-48 w-48 rounded-2xl object-contain" />
        ) : (
          <div className="grid grid-cols-8 gap-1 rounded-3xl border border-black/20 p-4">
            {Array.from({ length: 64 }).map((_, index) => (
              <span
                key={index}
                className={[
                  "block h-4 w-4 rounded-[4px]",
                  (index + value.length) % 3 === 0 ? "bg-black" : "bg-transparent",
                ].join(" ")}
              />
            ))}
          </div>
        )}
      </div>
      <p className="max-w-sm text-sm text-[#554336]">Encrypted QR payload bound to booking identity, expiry, and signature.</p>
    </Card>
  );
}
