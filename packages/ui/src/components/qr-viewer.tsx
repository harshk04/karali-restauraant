"use client";
import { Card } from "./card";

export function QRViewer({ value }: { value: string }) {
  const isDataUrl = value.startsWith("data:image");
  return (
    <Card className="flex flex-col items-center justify-center gap-3 bg-white p-3 text-center sm:gap-4 sm:p-5">
      <div className="flex aspect-square w-full max-w-[13rem] items-center justify-center rounded-[28px] bg-white shadow-[0_20px_50px_-12px_rgba(143,74,0,0.15)] sm:max-w-[16rem] sm:rounded-[40px]">
        {isDataUrl ? (
          <img
            src={value}
            alt="QR code"
            className="h-full w-full rounded-2xl object-contain p-2 sm:p-4"
          />
        ) : (
          <div className="grid grid-cols-8 gap-0.5 rounded-3xl border border-black/20 p-2 sm:gap-1 sm:p-4">
            {Array.from({ length: 64 }).map((_, index) => (
              <span
                key={index}
                className={[
                  "block aspect-square h-full w-full rounded-[4px]",
                  (index + value.length) % 3 === 0 ? "bg-black" : "bg-transparent",
                ].join(" ")}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
