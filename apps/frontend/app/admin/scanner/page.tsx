"use client";

import { useRef, useState } from "react";
import { Button, Card } from "@karali/ui";
import { api } from "../../../lib/api";

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const [scanCode, setScanCode] = useState("");

  async function startScan() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if ("BarcodeDetector" in window) {
        const Detector = (window as Window & { BarcodeDetector?: new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
        if (!Detector) return;
        const detector = new Detector({ formats: ["qr_code"] });
        scanTimerRef.current = window.setInterval(async () => {
          if (!videoRef.current) return;
          const codes = await detector.detect(videoRef.current);
          const value = codes[0]?.rawValue;
          if (value) {
            setScanCode(value);
            const parsed = JSON.parse(value) as { bookingId?: string };
            if (parsed.bookingId) {
              await api.post("/admin/scan-qr", { bookingId: parsed.bookingId, staffId: "admin" });
            }
          }
        }, 1200);
      }
    } catch {
      setScanCode("Camera access denied or unavailable.");
    }
  }

  function stopScan() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (scanTimerRef.current) window.clearInterval(scanTimerRef.current);
    scanTimerRef.current = null;
  }

  return (
    <div className="space-y-8 px-6 py-10 md:px-16">
      <div>
        <h2 className="text-3xl font-bold text-[#231a13]">Scan Booking QR</h2>
        <p className="text-[#554336]">Use camera QR scanning to mark arrivals.</p>
      </div>

      <Card className="space-y-4">
        <video ref={videoRef} className="aspect-video w-full rounded-[28px] bg-black" playsInline muted />
        <div className="flex gap-3">
          <Button onClick={startScan}>Start Scan</Button>
          <Button variant="secondary" onClick={stopScan}>
            Stop
          </Button>
        </div>
        {scanCode ? <div className="text-sm text-[#8f4a00] break-all">{scanCode}</div> : null}
      </Card>
    </div>
  );
}
