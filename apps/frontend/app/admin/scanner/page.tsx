"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Modal, QRScannerOverlay } from "@karali/ui";
import jsQR from "jsqr";
import { RefreshCw } from "lucide-react";
import { api } from "../../../lib/api";

type ScannedBooking = {
  bookingId: string;
  qrToken?: string;
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
  alreadyCheckedIn?: boolean;
};

type ScannerAlert = {
  title: string;
  message: string;
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
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [scannerAlert, setScannerAlert] = useState<ScannerAlert | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<
    "environment" | "user"
  >("environment");

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
      return { bookingId: "", qrToken: "" };
    }

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

  function normalizeScannerError(error: unknown, fallback: string) {
    const rawMessage =
      error instanceof Error && error.message.trim()
        ? error.message.trim()
        : fallback;
    const message = rawMessage.toLowerCase();

    if (
      message.includes("notallowederror") ||
      message.includes("permission denied") ||
      message.includes("permission dismissed")
    ) {
      return "Camera permission was denied. Allow camera access and try again.";
    }

    if (
      message.includes("notfounderror") ||
      message.includes("requested device not found")
    ) {
      return "No camera was found on this device. You can upload the QR image instead.";
    }

    if (
      message.includes("notreadableerror") ||
      message.includes("could not start video source")
    ) {
      return "The camera is busy in another app or tab. Close it there and try again.";
    }

    if (message.includes("overconstrainederror")) {
      return "This device could not open the preferred camera. Try again or upload the QR image instead.";
    }

    if (message.includes("invalid or expired qr code")) {
      return "This QR code is invalid or has expired. Ask the guest to open the latest booking QR.";
    }

    if (message.includes("booking not found")) {
      return "This booking could not be found. Please confirm the QR belongs to an active reservation.";
    }

    if (message.includes("secure booking token was missing")) {
      return "This QR code is missing its secure booking token. Please use the latest booking QR.";
    }

    if (message.includes("network error") || message.includes("timeout")) {
      return "The scanner could not reach the server. Check the connection and try again.";
    }

    return rawMessage;
  }

  function showScannerAlert(
    error: unknown,
    fallback: string,
    title = "Scanner issue",
  ) {
    const message = normalizeScannerError(error, fallback);
    stopScan();
    setCameraStatus(message);
    setScannerAlert({ title, message });
  }

  async function submitScan(value: string) {
    const parsed = parseBookingId(value);

    if (!parsed.bookingId || !parsed.qrToken || isSubmittingRef.current) {
      if (!parsed.bookingId || !parsed.qrToken) {
        showScannerAlert(
          new Error(
            "QR code detected, but the secure booking token was missing.",
          ),
          "QR code detected, but the secure booking token was missing.",
          "Invalid QR code",
        );
      }
      return;
    }

    isSubmittingRef.current = true;
    setIsProcessingScan(true);
    setCameraStatus(`QR detected. Confirming booking ${parsed.bookingId}...`);

    try {
      const response = await api.post<ScannedBooking>("/admin/scan-qr", {
        bookingId: parsed.bookingId,
        qrToken: parsed.qrToken,
      });
      setCameraStatus(`QR code scanned successfully for ${parsed.bookingId}.`);
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
      showScannerAlert(error, "Unable to verify this QR code.", "Scan failed");
    } finally {
      isSubmittingRef.current = false;
      setIsProcessingScan(false);
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
        showScannerAlert(
          new Error(
            "QR scanning is unavailable because the canvas could not be initialized.",
          ),
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
      if (!context) {
        throw new Error(
          "QR scanning is unavailable because the canvas could not be initialized.",
        );
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

    setScannerAlert(null);
    setIsUploadingQr(true);
    setCameraStatus(`Reading uploaded QR image: ${file.name}`);
    setScannerMode("Processing uploaded QR");

    try {
      const decodedValue = await decodeQrFromFile(file);
      await submitScan(decodedValue);
    } catch (error) {
      showScannerAlert(
        error,
        "Unable to process the uploaded QR image.",
        "Upload failed",
      );
    } finally {
      event.target.value = "";
      setIsUploadingQr(false);
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
      isSubmittingRef.current = false;
      setIsProcessingScan(false);
      setIsCameraLive(false);
      setCameraFacingMode(facingMode);
      setScannerMode("Starting camera...");

      if (!window.isSecureContext) {
        showScannerAlert(
          new Error(
            "Camera access is blocked in insecure contexts. Use HTTPS or localhost.",
          ),
          "Camera access is blocked in insecure contexts. Use HTTPS or localhost.",
          "Secure connection required",
        );
        return;
      }

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

      setCameraStatus("Requesting camera permission...");
      const stream = await mediaDevices.getUserMedia({ video: { facingMode } });
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
          showScannerAlert(
            new Error(
              "Camera is active, but QR detection is not supported in this browser.",
            ),
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
            if (value) {
              await submitScan(value);
            }
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
        setCameraStatus(
          "Camera is active. Using a compatible QR scanning fallback for this browser.",
        );
        runJsQrFallback();
      }
    } catch (error) {
      setScannerMode("Camera unavailable");
      setIsProcessingScan(false);
      showScannerAlert(
        error,
        "Camera access denied or unavailable.",
        "Camera unavailable",
      );
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

    return () => {
      stopScan();
    };
  }, [isSecureContext]);

  function stopScan() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (scanTimerRef.current) window.clearInterval(scanTimerRef.current);
    scanTimerRef.current = null;
    if (animationFrameRef.current)
      window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    setIsCameraLive(false);
    setScannerMode("Scanner stopped");
  }

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
          <div className="rounded-full bg-[#f6efe9] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#554336]">
            {scannerMode}
          </div>
        </div>
        <div className="rounded-2xl border border-[#e8d9cd] bg-[#fffaf5] p-4 text-sm text-[#554336]">
          {cameraStatus}
        </div>
        <div className="relative overflow-hidden rounded-[28px] bg-black">
          <video
            ref={videoRef}
            className="aspect-video w-full bg-black"
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
            active={
              isCameraLive &&
              !isUploadingQr &&
              !scannerAlert &&
              !isProcessingScan
            }
          />
        </div>
        <div className="grid gap-3 sm:flex">
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

      <Modal
        open={Boolean(scannerAlert)}
        title={scannerAlert?.title || "Scanner issue"}
      >
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
    </div>
  );
}
