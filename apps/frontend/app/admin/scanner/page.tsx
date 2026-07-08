"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@karali/ui";
import jsQR from "jsqr";
import { api } from "../../../lib/api";

type ScannedBooking = {
  bookingId: string;
  customerName?: string;
  email?: string;
  phone?: string;
  date?: string;
  time?: string;
  pax?: number;
  status?: string;
  paymentStatus?: string;
  totalAmount?: number;
  paymentMethod?: string;
  checkedInAt?: string;
};

export default function ScannerPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isSubmittingRef = useRef(false);
  const autoStartRef = useRef(false);
  const [isSecureContext, setIsSecureContext] = useState(true);
  const [isCameraLive, setIsCameraLive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("Opening scanner...");
  const [scannerMode, setScannerMode] = useState("Waiting for camera...");
  const [isUploadingQr, setIsUploadingQr] = useState(false);

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

    if (!bookingId || isSubmittingRef.current) {
      if (!bookingId) {
        setCameraStatus("QR code detected, but no valid booking ID was found.");
      }
      return;
    }

    isSubmittingRef.current = true;
    setCameraStatus(`QR detected. Confirming booking ${bookingId}...`);

    try {
      const response = await api.post<ScannedBooking>("/admin/scan-qr", {
        bookingId,
        staffId: "admin",
      });
      setCameraStatus(`QR code scanned successfully for ${bookingId}.`);
      stopScan();
      const params = new URLSearchParams();
      Object.entries(response.data || {}).forEach(([key, rawValue]) => {
        if (rawValue === undefined || rawValue === null || rawValue === "") {
          return;
        }
        params.set(key, String(rawValue));
      });
      router.push(`/admin/scanner/success?${params.toString()}`);
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

  async function decodeQrFromFile(file: File) {
    const imageUrl = URL.createObjectURL(file);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Unable to read the uploaded image."));
        img.src = imageUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        throw new Error("QR scanning is unavailable because the canvas could not be initialized.");
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height);

      if (!result?.data) {
        throw new Error("No QR code was detected in the uploaded image.");
      }

      return result.data;
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  async function handleQrUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploadingQr(true);
    setCameraStatus(`Reading uploaded QR image: ${file.name}`);
    setScannerMode("Processing uploaded QR");

    try {
      const decodedValue = await decodeQrFromFile(file);
      await submitScan(decodedValue);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to process the uploaded QR image.";
      setCameraStatus(message);
    } finally {
      event.target.value = "";
      setIsUploadingQr(false);
    }
  }

  async function startScan() {
    try {
      stopScan();
      isSubmittingRef.current = false;
      setIsCameraLive(false);
      setScannerMode("Starting camera...");

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
      setIsCameraLive(true);
      setCameraStatus(
        "Camera permission granted. Point the camera at the QR code.",
      );
      if ("BarcodeDetector" in window) {
        setScannerMode("Live camera with BarcodeDetector");
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
        setScannerMode("Live camera with jsQR fallback");
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
      setIsCameraLive(false);
      setScannerMode("Camera unavailable");
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
    setIsCameraLive(false);
    setScannerMode("Scanner stopped");
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="lux-hero lux-reveal p-4 sm:p-8 md:p-10">
        <p className="lux-eyebrow">Arrival Scan</p>
        <h2 className="lux-heading mt-3 text-3xl font-bold text-[#231a13] sm:text-4xl">
          Scan booking QR
        </h2>
        <p className="mt-2 text-[#554336]">
          Use camera QR scanning to mark arrivals with the same polished motion
          and layout language as the customer journey.
        </p>
      </div>

      <Card className="space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={[
              "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
              isCameraLive
                ? "bg-[#e4f6ea] text-[#1b6a36]"
                : "bg-[#f7e8dc] text-[#8f4a00]",
            ].join(" ")}
          >
            {isCameraLive ? "Camera live" : "Camera not live"}
          </div>
          <div className="rounded-full bg-[#f6efe9] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#554336]">
            {scannerMode}
          </div>
        </div>
        <div className="rounded-2xl border border-[#e8d9cd] bg-[#fffaf5] p-4 text-sm text-[#554336]">
          {cameraStatus}
        </div>
        <div className="overflow-hidden rounded-[28px] bg-black">
          <video
            ref={videoRef}
            className="aspect-video w-full bg-black"
            playsInline
            muted
            autoPlay
          />
        </div>
        <div className="grid gap-3 sm:flex">
          <Button onClick={startScan} disabled={!isSecureContext} className="w-full sm:w-auto">
            Retry Camera
          </Button>
          <Button variant="secondary" onClick={stopScan} className="w-full sm:w-auto">
            Stop
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingQr}
            className="w-full sm:w-auto"
          >
            {isUploadingQr ? "Uploading..." : "Upload QR"}
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleQrUpload}
        />
      </Card>
    </div>
  );
}
