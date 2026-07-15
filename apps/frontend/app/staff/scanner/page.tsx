"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import jsQR from "jsqr";
import { CheckCircle2, RefreshCw, ScanLine, XCircle } from "lucide-react";
import { Button, Card, Modal, QRScannerOverlay } from "@karali/ui";
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

type ScannerAlert = {
  title: string;
  message: string;
};

export default function StaffScannerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const autoStartRef = useRef(false);
  const [isSecureContext, setIsSecureContext] = useState(true);
  const [cameraStatus, setCameraStatus] = useState("Opening scanner...");
  const [, setScannerMode] = useState("Waiting for camera...");
  const [isCameraLive, setIsCameraLive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [scanned, setScanned] = useState<ValidatedBooking | null>(null);
  const [success, setSuccess] = useState(false);
  const [scannerAlert, setScannerAlert] = useState<ScannerAlert | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<
    "environment" | "user"
  >("environment");
  const validatedBooking = scanned?.valid ? scanned.booking : undefined;

  useEffect(() => {
    setIsSecureContext(window.isSecureContext);
    if (!window.isSecureContext) {
      setCameraStatus(
        "Camera access requires HTTPS or localhost. Open this staff panel over a secure origin to prompt for permission.",
      );
    }
  }, []);

  function parseBookingId(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return { bookingId: "", qrToken: "" };
    try {
      const parsed = JSON.parse(trimmed) as {
        bookingId?: string;
        qrToken?: string;
      };
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
    if (animationFrameRef.current)
      window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    setIsCameraLive(false);
  }

  function normalizeScannerError(error: unknown, fallback: string) {
    const rawMessage =
      error instanceof Error && error.message.trim() ? error.message.trim() : fallback;
    const message = rawMessage.toLowerCase();

    if (
      message.includes("notallowederror") ||
      message.includes("permission denied") ||
      message.includes("permission dismissed")
    ) {
      return "Camera permission was denied. Allow camera access and try again.";
    }

    if (message.includes("notfounderror") || message.includes("requested device not found")) {
      return "No camera was found on this device. You can upload the QR image instead.";
    }

    if (message.includes("notreadableerror") || message.includes("could not start video source")) {
      return "The camera is busy in another app or tab. Close it there and try again.";
    }

    if (message.includes("overconstrainederror")) {
      return "This device could not open the preferred camera. Try again or upload the QR image instead.";
    }

    if (message.includes("secure booking token was missing")) {
      return "This QR code is missing its secure booking token. Please use the latest booking QR.";
    }

    if (message.includes("invalid or expired qr code")) {
      return "This QR code is invalid or has expired. Ask the guest to open the latest booking QR.";
    }

    if (message.includes("network error") || message.includes("timeout")) {
      return "The scanner could not reach the server. Check the connection and try again.";
    }

    return rawMessage;
  }

  function showScannerAlert(error: unknown, fallback: string, title = "Scanner issue") {
    const message = normalizeScannerError(error, fallback);
    stopScan();
    setIsProcessingScan(false);
    setCameraStatus(message);
    setScannerAlert({ title, message });
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
      showScannerAlert(error, "Unable to validate QR.", "Scan failed");
    } finally {
      setIsProcessingScan(false);
    }
  }

  async function checkIn(bookingId: string, qrToken: string) {
    try {
      const response = await staffApi.post("/staff/check-in", {
        bookingId,
        qrToken,
      });
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
      showScannerAlert(error, "Unable to check in this booking.", "Check-in failed");
    }
  }

  async function submitScan(value: string) {
    const parsed = parseBookingId(value);
    if (!parsed.bookingId || !parsed.qrToken) {
      showScannerAlert(
        new Error("QR code detected, but the secure booking token was missing."),
        "QR code detected, but the secure booking token was missing.",
        "Invalid QR code",
      );
      return;
    }
    setIsProcessingScan(true);
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
        showScannerAlert(
          new Error("QR scanning is unavailable because the canvas could not be initialized."),
          "QR scanning is unavailable because the canvas could not be initialized.",
        );
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
        img.onerror = () =>
          reject(new Error("Unable to read the uploaded image."));
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
    setScannerAlert(null);
    setIsUploading(true);
    setCameraStatus(`Reading uploaded QR image: ${file.name}`);
    try {
      const decodedValue = await decodeQrFromFile(file);
      await submitScan(decodedValue);
    } catch (error) {
      showScannerAlert(error, "Unable to process uploaded QR.", "Upload failed");
    } finally {
      event.target.value = "";
      setIsUploading(false);
    }
  }

  async function startScan() {
    await startScanWithFacingMode(cameraFacingMode);
  }

  async function startScanWithFacingMode(
    facingMode: "environment" | "user",
  ) {
    try {
      setScannerAlert(null);
      stopScan();
      setIsProcessingScan(false);
      setScanned(null);
      setSuccess(false);
      setCameraFacingMode(facingMode);
      setScannerMode("Starting camera...");

      if (!window.isSecureContext) {
        showScannerAlert(
          new Error("Camera access is blocked in insecure contexts. Use HTTPS or localhost."),
          "Camera access is blocked in insecure contexts. Use HTTPS or localhost.",
          "Secure connection required",
        );
        return;
      }

      setCameraStatus("Requesting camera permission...");
      const mediaDevices = navigator.mediaDevices;
      if (!mediaDevices?.getUserMedia) {
        showScannerAlert(
          new Error(
            "Camera access is not supported in this browser. Please upload a QR image instead.",
          ),
          "Camera access is not supported in this browser. Please upload a QR image instead.",
          "Camera unavailable",
        );
        setScannerMode("Camera unavailable");
        return;
      }

      const stream = await mediaDevices.getUserMedia({ video: { facingMode } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraLive(true);
      setCameraStatus("Point the camera at the QR code.");
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
          showScannerAlert(
            new Error("Camera is active, but QR detection is not supported in this browser."),
            "Camera is active, but QR detection is not supported in this browser.",
            "Scanner unavailable",
          );
          return;
        }
        const detector = new Detector({ formats: ["qr_code"] });
        scanTimerRef.current = window.setInterval(async () => {
          if (!videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const value = codes[0]?.rawValue;
            if (value) await submitScan(value);
          } catch (error) {
            showScannerAlert(
              error,
              "QR detection failed while reading the camera feed.",
              "Camera scan failed",
            );
          }
        }, 1200);
      } else {
        setScannerMode("Live camera with jsQR fallback");
        runFallbackScan();
      }
    } catch (error) {
      setIsCameraLive(false);
      setScannerMode("Camera unavailable");
      setIsProcessingScan(false);
      showScannerAlert(error, "Camera unavailable.", "Camera unavailable");
    }
  }

  async function toggleCameraFacingMode() {
    const nextFacingMode =
      cameraFacingMode === "environment" ? "user" : "environment";
    await startScanWithFacingMode(nextFacingMode);
  }

  useEffect(() => {
    if (!isSecureContext || autoStartRef.current) {
      return;
    }

    autoStartRef.current = true;
    void startScan();

    return () => stopScan();
  }, [isSecureContext]);

  const errorState = scanned && !scanned.valid ? scanned.reason : "";

  return (
    <div className="space-y-6">
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
        </div>
        <div className="rounded-2xl border border-[#e8d9cd] bg-[#fffaf5] p-4 text-sm text-[#554336]">
          {cameraStatus}
        </div>

        {!scanned ? (
          <>
            <div className="relative overflow-hidden rounded-[28px] bg-black">
              <video
                ref={videoRef}
                className="aspect-[4/5] w-full object-cover bg-black sm:aspect-video"
                playsInline
                muted
                autoPlay
              />
              <button
                type="button"
                onClick={() => void toggleCameraFacingMode()}
                className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-black/45 text-white backdrop-blur-md transition hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label="Switch camera"
                title="Switch camera"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <QRScannerOverlay
                active={isCameraLive && !isUploading && !isProcessingScan}
              />
            </div>
            <div className="space-y-3 sm:flex sm:flex-wrap sm:gap-3 sm:space-y-0">
              <div className="grid grid-cols-2 gap-3 sm:flex sm:contents">
                <Button
                  onClick={startScan}
                  disabled={!isSecureContext}
                  className="w-full sm:w-auto"
                >
                  Retry Camera
                </Button>
                <Button
                  variant="secondary"
                  onClick={stopScan}
                  className="w-full sm:w-auto"
                >
                  Stop
                </Button>
              </div>
              <Button
                variant="secondary"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full sm:w-auto"
              >
                {isUploading ? "Uploading..." : "Upload QR"}
              </Button>
            </div>
          </>
        ) : errorState ? (
          <div className="space-y-4 rounded-[28px] border border-[#efc8c8] bg-[#fff5f5] p-6">
            <div className="flex items-center gap-3 text-[#b54646]">
              <XCircle className="h-6 w-6" />
              <div className="text-lg font-semibold capitalize">
                {errorState.replace("_", " ")}
              </div>
            </div>
            <p className="text-sm text-[#7d4b4b]">
              This QR cannot be checked in right now. Please scan again or
              confirm the booking details.
            </p>
            <Button
              onClick={() => {
                setScanned(null);
                void startScan();
              }}
              className="w-full sm:w-auto"
            >
              Scan Again
            </Button>
          </div>
        ) : success ? (
          <div className="space-y-4 rounded-[28px] border border-[#d9eacb] bg-[#eef8e9] p-6 text-[#1f4d28]">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-7 w-7" />
              <div className="text-xl font-semibold">
                Checked in successfully
              </div>
            </div>
            <p className="text-sm">
              The guest has been marked as arrived. Returning to the scanner
              automatically.
            </p>
            <Button
              onClick={() => {
                setScanned(null);
                setSuccess(false);
                void startScan();
              }}
              className="w-full sm:w-auto"
            >
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
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#2d5e34]/70">
                    {label}
                  </div>
                  <div className="mt-1 break-words font-medium text-[#1f4d28]">
                    {value}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() =>
                  void checkIn(
                    validatedBooking.bookingId,
                    validatedBooking.qrToken || "",
                  )
                }
                className="w-full sm:flex-1"
              >
                Check In
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setScanned(null);
                  void startScan();
                }}
                className="w-full sm:flex-1"
              >
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

        <Modal open={Boolean(scannerAlert)} title={scannerAlert?.title || "Scanner issue"}>
          {scannerAlert ? (
            <div className="space-y-5">
              <div className="rounded-[24px] border border-[#f0d5c2] bg-[#fff7f0] p-5 text-[#554336]">
                <p className="text-sm leading-6">{scannerAlert.message}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  onClick={() => {
                    setScannerAlert(null);
                    void startScan();
                  }}
                  disabled={!isSecureContext}
                  className="w-full"
                >
                  Retry Camera
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setScannerAlert(null)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </Modal>
      </Card>
    </div>
  );
}
