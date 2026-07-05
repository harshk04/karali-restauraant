"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card } from "@karali/ui";
import jsQR from "jsqr";
import { api } from "../../../lib/api";

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isSubmittingRef = useRef(false);
  const autoStartRef = useRef(false);
  const [scanCode, setScanCode] = useState("");
  const [isSecureContext, setIsSecureContext] = useState(true);
  const [cameraStatus, setCameraStatus] = useState("Opening scanner...");

  useEffect(() => {
    setIsSecureContext(window.isSecureContext);
    if (!window.isSecureContext) {
      setCameraStatus(
        "Camera access requires HTTPS or localhost. Open this admin panel over a secure origin to prompt for permission.",
      );
    }
  }, []);

  function parseBookingId(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }

    try {
      const parsed = JSON.parse(trimmed) as { bookingId?: string };
      return parsed.bookingId?.trim() || "";
    } catch {
      return trimmed;
    }
  }

  async function submitScan(value: string) {
    const bookingId = parseBookingId(value);

    setScanCode(value);

    if (!bookingId || isSubmittingRef.current) {
      if (!bookingId) {
        setCameraStatus("QR code detected, but no valid booking ID was found.");
      }
      return;
    }

    isSubmittingRef.current = true;

    try {
      await api.post("/admin/scan-qr", {
        bookingId,
        staffId: "admin",
      });
      setCameraStatus(`QR code scanned successfully for ${bookingId}.`);
      stopScan();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to verify this QR code.";
      setCameraStatus(message);
    } finally {
      isSubmittingRef.current = false;
    }
  }

  function runJsQrFallback() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const scanFrame = () => {
      if (!videoRef.current) {
        return;
      }

      const activeVideo = videoRef.current;
      if (activeVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        animationFrameRef.current = window.requestAnimationFrame(scanFrame);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = activeVideo.videoWidth;
      canvas.height = activeVideo.videoHeight;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        setCameraStatus("QR scanning is unavailable because the canvas could not be initialized.");
        return;
      }

      context.drawImage(activeVideo, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height);

      if (result?.data) {
        void submitScan(result.data);
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = window.requestAnimationFrame(scanFrame);
  }

  async function startScan() {
    try {
      stopScan();
      setScanCode("");
      isSubmittingRef.current = false;

      if (!window.isSecureContext) {
        setCameraStatus(
          "Camera access is blocked in insecure contexts. Use HTTPS or localhost.",
        );
        return;
      }

      setCameraStatus("Requesting camera permission...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraStatus(
        "Camera permission granted. Point the camera at the QR code.",
      );
      if ("BarcodeDetector" in window) {
        const Detector = (
          window as Window & {
            BarcodeDetector?: new (options: { formats: string[] }) => {
              detect: (
                source: HTMLVideoElement,
              ) => Promise<Array<{ rawValue: string }>>;
            };
          }
        ).BarcodeDetector;
        if (!Detector) {
          setCameraStatus(
            "Camera is active, but QR detection is not supported in this browser.",
          );
          return;
        }
        const detector = new Detector({ formats: ["qr_code"] });
        scanTimerRef.current = window.setInterval(async () => {
          if (!videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const value = codes[0]?.rawValue;
            if (value) {
              await submitScan(value);
            }
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "QR detection failed while reading the camera feed.";
            setCameraStatus(message);
          }
        }, 1200);
      } else {
        setCameraStatus(
          "Camera is active. Using a compatible QR scanning fallback for this browser.",
        );
        runJsQrFallback();
      }
    } catch (error) {
      const message =
      error instanceof Error
          ? error.message
          : "Camera access denied or unavailable.";
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
    if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
  }

  return (
    <div className="space-y-8">
      <div className="lux-hero lux-reveal p-8 md:p-10">
        <p className="lux-eyebrow">Arrival Scan</p>
        <h2 className="lux-heading mt-3 text-4xl font-bold text-[#231a13]">
          Scan booking QR
        </h2>
        <p className="mt-2 text-[#554336]">
          Use camera QR scanning to mark arrivals with the same polished motion
          and layout language as the customer journey.
        </p>
      </div>

      <Card className="space-y-4 p-8">
        <div className="rounded-2xl border border-[#e8d9cd] bg-[#fffaf5] p-4 text-sm text-[#554336]">
          {cameraStatus}
        </div>
        <video
          ref={videoRef}
          className="aspect-video w-full rounded-[28px] bg-black"
          playsInline
          muted
          autoPlay
        />
        <div className="flex gap-3">
          <Button onClick={startScan} disabled={!isSecureContext}>
            Retry Camera
          </Button>
          <Button variant="secondary" onClick={stopScan}>
            Stop
          </Button>
        </div>
        {scanCode ? (
          <div className="text-sm text-[#8f4a00] break-all">{scanCode}</div>
        ) : null}
      </Card>
    </div>
  );
}
