"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card } from "@karali/ui";
import { api } from "../../../lib/api";

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const autoStartRef = useRef(false);
  const [scanCode, setScanCode] = useState("");
  const [isSecureContext, setIsSecureContext] = useState(true);
  const [cameraStatus, setCameraStatus] = useState("Opening scanner...");

  useEffect(() => {
    setIsSecureContext(window.isSecureContext);
    if (!window.isSecureContext) {
      setCameraStatus("Camera access requires HTTPS or localhost. Open this admin panel over a secure origin to prompt for permission.");
    }
  }, []);

  async function startScan() {
    try {
      if (!window.isSecureContext) {
        setCameraStatus("Camera access is blocked in insecure contexts. Use HTTPS or localhost.");
        return;
      }

      setCameraStatus("Requesting camera permission...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraStatus("Camera permission granted. Point the camera at the QR code.");
      if ("BarcodeDetector" in window) {
        const Detector = (window as Window & { BarcodeDetector?: new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
        if (!Detector) {
          setCameraStatus("Camera is active, but QR detection is not supported in this browser.");
          return;
        }
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
              setCameraStatus("QR code scanned successfully.");
            }
          }
        }, 1200);
      } else {
        setCameraStatus("Camera is active. QR detection is not supported, but the video feed is running.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Camera access denied or unavailable.";
      setCameraStatus(message);
      setScanCode(message);
    }
  }

  useEffect(() => {
    if (!isSecureContext || autoStartRef.current) {
      return;
    }

    autoStartRef.current = true;
    void startScan();

    return () => {
      stopScan();
    };
  }, [isSecureContext]);

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
        <div className="rounded-2xl border border-[#e8d9cd] bg-[#fffaf5] p-4 text-sm text-[#554336]">
          {cameraStatus}
        </div>
        <video ref={videoRef} className="aspect-video w-full rounded-[28px] bg-black" playsInline muted autoPlay />
        <div className="flex gap-3">
          <Button onClick={startScan} disabled={!isSecureContext}>
            Retry Camera
          </Button>
          <Button variant="secondary" onClick={stopScan}>
            Stop
          </Button>
        </div>
        {scanCode ? <div className="text-sm text-[#8f4a00] break-all">{scanCode}</div> : null}
      </Card>
    </div>
  );
}
