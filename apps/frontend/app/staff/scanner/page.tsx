"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import jsQR from "jsqr";
import { CheckCircle2, ScanLine, XCircle } from "lucide-react";
import { Button, Card } from "@karali/ui";
import { staffApi } from "../../../lib/staff-api";

type ValidatedBooking = {
  valid: boolean;
  reason?: "invalid" | "expired" | "already_used" | "cancelled";
  booking?: {
    bookingId: string;
    qrToken?: string;
    customerName: string;
    phone: string;
    email: string;
    pax: number;
    date: string;
    time: string;
    tableNumber: string;
    status: string;
    paymentStatus: string;
  };
};

export default function StaffScannerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const [cameraStatus, setCameraStatus] = useState("Opening scanner...");
  const [scannerMode, setScannerMode] = useState("Waiting for camera...");
  const [isCameraLive, setIsCameraLive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [scanned, setScanned] = useState<ValidatedBooking | null>(null);
  const [success, setSuccess] = useState(false);
  const validatedBooking = scanned?.valid ? scanned.booking : undefined;

  function parseBookingId(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return { bookingId: "", qrToken: "" };
    try {
      const parsed = JSON.parse(trimmed) as { bookingId?: string; qrToken?: string };
      return {
        bookingId: parsed.bookingId?.trim() || "",
        qrToken: parsed.qrToken?.trim() || "",
      };
    } catch {
      return { bookingId: trimmed, qrToken: "" };
    }
  }

  function stopScan() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (scanTimerRef.current) window.clearInterval(scanTimerRef.current);
    scanTimerRef.current = null;
    if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    setIsCameraLive(false);
  }

  async function validateBooking(bookingId: string, qrToken: string) {
    try {
      const response = await staffApi.post<ValidatedBooking>("/staff/scan-qr", {
        bookingId,
        qrToken,
      });
      setScanned(response.data);
      if (!response.data.valid) {
        setCameraStatus("Booking is not eligible for check-in.");
      } else {
        setCameraStatus("Booking validated. Ready to check in.");
      }
    } catch (error) {
      setCameraStatus(error instanceof Error ? error.message : "Unable to validate QR.");
    }
  }

  async function checkIn(bookingId: string, qrToken: string) {
    try {
      const response = await staffApi.post("/staff/check-in", { bookingId, qrToken });
      setSuccess(true);
      setCameraStatus(`Checked in ${response.data.customerName}.`);
      stopScan();
      window.setTimeout(() => {
        setScanned(null);
        setSuccess(false);
        setCameraStatus("Ready for next guest.");
        void startScan();
      }, 2500);
    } catch (error) {
      setCameraStatus(error instanceof Error ? error.message : "Unable to check in this booking.");
    }
  }

  async function submitScan(value: string) {
    const parsed = parseBookingId(value);
    if (!parsed.bookingId || !parsed.qrToken) {
      setCameraStatus("QR code detected, but the secure booking token was missing.");
      return;
    }
    stopScan();
    await validateBooking(parsed.bookingId, parsed.qrToken);
  }

  function runFallbackScan() {
    const video = videoRef.current;
    if (!video) return;

    const scanFrame = () => {
      if (!videoRef.current) return;
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
        setCameraStatus("QR scanning unavailable.");
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
      if (!context) throw new Error("QR scanning unavailable.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height);
      if (!result?.data) throw new Error("No QR code detected.");
      return result.data;
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  async function handleQrUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setCameraStatus(`Reading uploaded QR image: ${file.name}`);
    try {
      const decodedValue = await decodeQrFromFile(file);
      await submitScan(decodedValue);
    } catch (error) {
      setCameraStatus(error instanceof Error ? error.message : "Unable to process uploaded QR.");
    } finally {
      event.target.value = "";
      setIsUploading(false);
    }
  }

  async function startScan() {
    try {
      stopScan();
      setScanned(null);
      setSuccess(false);
      setScannerMode("Starting camera...");
      setCameraStatus("Requesting camera permission...");
      const mediaDevices = navigator.mediaDevices;
      if (!mediaDevices?.getUserMedia) {
        setCameraStatus(
          "Camera access is not supported in this browser. Please upload a QR image instead.",
        );
        setScannerMode("Camera unavailable");
        return;
      }

      const stream = await mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraLive(true);
      setCameraStatus("Point the camera at the QR code.");
      if ("BarcodeDetector" in window) {
        setScannerMode("Live camera with BarcodeDetector");
        const Detector = (window as Window & { BarcodeDetector?: new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>; }; }).BarcodeDetector;
        if (!Detector) return;
        const detector = new Detector({ formats: ["qr_code"] });
        scanTimerRef.current = window.setInterval(async () => {
          if (!videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const value = codes[0]?.rawValue;
            if (value) await submitScan(value);
          } catch {
            setCameraStatus("QR detection failed while reading the camera feed.");
          }
        }, 1200);
      } else {
        setScannerMode("Live camera with jsQR fallback");
        runFallbackScan();
      }
    } catch (error) {
      setCameraStatus(error instanceof Error ? error.message : "Camera unavailable.");
      setIsCameraLive(false);
      setScannerMode("Camera unavailable");
    }
  }

  useEffect(() => {
    void startScan();
    return () => stopScan();
  }, []);

  const errorState = scanned && !scanned.valid ? scanned.reason : "";

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className={["rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]", isCameraLive ? "bg-[#e4f6ea] text-[#1b6a36]" : "bg-[#f7e8dc] text-[#8f4a00]"].join(" ")}>
            {isCameraLive ? "Camera live" : "Camera not live"}
          </div>
          <div className="rounded-full bg-[#f6efe9] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#554336]">
            {scannerMode}
          </div>
        </div>
        <div className="rounded-2xl border border-[#e8d9cd] bg-[#fffaf5] p-4 text-sm text-[#554336]">
          {cameraStatus}
        </div>

        {!scanned ? (
          <>
            <div className="overflow-hidden rounded-[28px] bg-black">
              <video ref={videoRef} className="aspect-video w-full bg-black" playsInline muted autoPlay />
            </div>
            <div className="grid gap-3 sm:flex">
              <Button onClick={startScan} className="w-full sm:w-auto">
                Retry Camera
              </Button>
              <Button variant="secondary" onClick={stopScan} className="w-full sm:w-auto">
                Stop
              </Button>
              <Button variant="secondary" type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full sm:w-auto">
                {isUploading ? "Uploading..." : "Upload QR"}
              </Button>
            </div>
          </>
        ) : errorState ? (
          <div className="space-y-4 rounded-[28px] border border-[#efc8c8] bg-[#fff5f5] p-6">
            <div className="flex items-center gap-3 text-[#b54646]">
              <XCircle className="h-6 w-6" />
              <div className="text-lg font-semibold capitalize">{errorState.replace("_", " ")}</div>
            </div>
            <p className="text-sm text-[#7d4b4b]">
              This QR cannot be checked in right now. Please scan again or confirm the booking details.
            </p>
            <Button onClick={() => { setScanned(null); void startScan(); }} className="w-full sm:w-auto">
              Scan Again
            </Button>
          </div>
        ) : success ? (
          <div className="space-y-4 rounded-[28px] border border-[#d9eacb] bg-[#eef8e9] p-6 text-[#1f4d28]">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-7 w-7" />
              <div className="text-xl font-semibold">Checked in successfully</div>
            </div>
            <p className="text-sm">The guest has been marked as arrived. Returning to the scanner automatically.</p>
            <Button onClick={() => { setScanned(null); setSuccess(false); void startScan(); }} className="w-full sm:w-auto">
              Scan Next Guest
            </Button>
          </div>
        ) : validatedBooking ? (
          <div className="space-y-5 rounded-[28px] border border-[#d9eacb] bg-[#eef8e9] p-6">
            <div className="flex items-center gap-3 text-[#1f4d28]">
              <ScanLine className="h-7 w-7" />
              <div className="text-xl font-semibold">Booking validated</div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                ["Booking ID", validatedBooking.bookingId],
                ["Customer", validatedBooking.customerName],
                ["Mobile", validatedBooking.phone],
                ["Guests", String(validatedBooking.pax)],
                ["Date", validatedBooking.date],
                ["Time", validatedBooking.time],
                ["Table", validatedBooking.tableNumber],
                ["Booking Status", validatedBooking.status],
                ["Payment Status", validatedBooking.paymentStatus],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#2d5e34]/70">{label}</div>
                  <div className="mt-1 break-words font-medium text-[#1f4d28]">{value}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => void checkIn(validatedBooking.bookingId, validatedBooking.qrToken || "")}
                className="w-full sm:flex-1"
              >
                Check In
              </Button>
              <Button variant="secondary" onClick={() => { setScanned(null); void startScan(); }} className="w-full sm:flex-1">
                Scan Again
              </Button>
            </div>
          </div>
        ) : null}

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
