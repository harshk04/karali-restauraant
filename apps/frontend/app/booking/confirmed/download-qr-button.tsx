"use client";

import { Button } from "@karali/ui";

export function DownloadQrButton({
  qrCode,
  bookingId,
}: {
  qrCode: string;
  bookingId: string;
}) {
  async function downloadQr() {
    if (!qrCode.startsWith("data:image")) {
      return;
    }

    const response = await fetch(qrCode);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `${bookingId || "karali-booking"}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <Button
      type="button"
      className="w-full text-lg"
      onClick={downloadQr}
      disabled={!qrCode.startsWith("data:image")}
    >
      Download QR
    </Button>
  );
}
