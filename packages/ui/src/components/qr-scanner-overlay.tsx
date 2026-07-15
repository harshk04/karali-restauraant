"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "../lib";

type QRScannerOverlayProps = {
  active?: boolean;
  className?: string;
  bandHeight?: number;
  durationMs?: number;
  horizontalInset?: number;
  lineColor?: string;
  lineHeight?: number;
};

function toRgbChannels(color: string) {
  const normalized = color.trim();
  const shortHexMatch = /^#([\da-f]{3})$/i.exec(normalized);
  if (shortHexMatch) {
    const [r, g, b] = shortHexMatch[1]
      .split("")
      .map((value) => Number.parseInt(value.repeat(2), 16));
    return `${r} ${g} ${b}`;
  }

  const hexMatch = /^#([\da-f]{6})$/i.exec(normalized);
  if (hexMatch) {
    const value = hexMatch[1];
    const r = Number.parseInt(value.slice(0, 2), 16);
    const g = Number.parseInt(value.slice(2, 4), 16);
    const b = Number.parseInt(value.slice(4, 6), 16);
    return `${r} ${g} ${b}`;
  }

  return "34 197 94";
}

export function QRScannerOverlay({
  active = true,
  className,
  bandHeight = 52,
  durationMs = 2200,
  horizontalInset = 20,
  lineColor = "#22c55e",
  lineHeight = 2,
}: QRScannerOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [travelDistance, setTravelDistance] = useState(0);

  useEffect(() => {
    const node = overlayRef.current;
    if (!node) return;

    const updateTravelDistance = () => {
      const nextDistance = Math.max(node.clientHeight - lineHeight, 0);
      setTravelDistance((currentDistance) =>
        currentDistance === nextDistance ? currentDistance : nextDistance,
      );
    };

    updateTravelDistance();
    const resizeObserver = new ResizeObserver(updateTravelDistance);
    resizeObserver.observe(node);

    return () => {
      resizeObserver.disconnect();
    };
  }, [lineHeight]);

  const overlayStyle = {
    "--qr-scan-band-height": `${bandHeight}px`,
    "--qr-scan-band-offset": `${(lineHeight - bandHeight) / 2}px`,
    "--qr-scan-color": lineColor,
    "--qr-scan-color-rgb": toRgbChannels(lineColor),
    "--qr-scan-duration": `${durationMs}ms`,
    "--qr-scan-horizontal-inset": `${horizontalInset}px`,
    "--qr-scan-line-height": `${lineHeight}px`,
    "--qr-scan-travel-distance": `${travelDistance}px`,
  } as CSSProperties;

  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-10 overflow-hidden",
        className,
      )}
      style={overlayStyle}
    >
      <div
        className="qr-scanner-overlay__sweep"
        data-active={active ? "true" : "false"}
      >
        <div className="qr-scanner-overlay__band" />
        <div className="qr-scanner-overlay__line" />
      </div>
      <style>{`
        @keyframes qr-scanner-overlay-sweep {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(0, var(--qr-scan-travel-distance), 0);
          }
        }

        .qr-scanner-overlay__sweep {
          position: absolute;
          inset-inline: 0;
          top: 0;
          height: var(--qr-scan-line-height);
          animation: qr-scanner-overlay-sweep var(--qr-scan-duration) ease-in-out infinite;
          will-change: transform;
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
        }

        .qr-scanner-overlay__sweep[data-active="false"] {
          animation-play-state: paused;
        }

        .qr-scanner-overlay__band {
          position: absolute;
          inset-inline: 0;
          top: var(--qr-scan-band-offset);
          height: var(--qr-scan-band-height);
          background:
            linear-gradient(
              180deg,
              transparent 0%,
              rgb(var(--qr-scan-color-rgb) / 0.1) 18%,
              rgb(var(--qr-scan-color-rgb) / 0.2) 50%,
              rgb(var(--qr-scan-color-rgb) / 0.1) 82%,
              transparent 100%
            ),
            linear-gradient(
              90deg,
              transparent 0%,
              rgb(var(--qr-scan-color-rgb) / 0) 10%,
              rgb(var(--qr-scan-color-rgb) / 0.08) 26%,
              rgb(var(--qr-scan-color-rgb) / 0.18) 50%,
              rgb(var(--qr-scan-color-rgb) / 0.08) 74%,
              rgb(var(--qr-scan-color-rgb) / 0) 90%,
              transparent 100%
            );
          filter: blur(6px);
          opacity: 0.95;
        }

        .qr-scanner-overlay__line {
          position: absolute;
          top: 0;
          left: var(--qr-scan-horizontal-inset);
          right: var(--qr-scan-horizontal-inset);
          height: var(--qr-scan-line-height);
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgb(var(--qr-scan-color-rgb) / 0.16) 8%,
            rgb(var(--qr-scan-color-rgb) / 0.82) 28%,
            rgb(var(--qr-scan-color-rgb) / 1) 50%,
            rgb(var(--qr-scan-color-rgb) / 0.82) 72%,
            rgb(var(--qr-scan-color-rgb) / 0.16) 92%,
            transparent 100%
          );
          box-shadow:
            0 0 10px rgb(var(--qr-scan-color-rgb) / 0.65),
            0 0 22px rgb(var(--qr-scan-color-rgb) / 0.32);
          filter: blur(0.2px);
        }
      `}</style>
    </div>
  );
}
