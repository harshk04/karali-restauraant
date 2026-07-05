function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function splitLine(value: string, maxLength = 78) {
  const parts: string[] = [];
  let remaining = value;

  while (remaining.length > maxLength) {
    parts.push(remaining.slice(0, maxLength));
    remaining = remaining.slice(maxLength);
  }

  parts.push(remaining);
  return parts;
}

export function buildReceiptPdf(input: {
  bookingId: string;
  customerName: string;
  amountReceived: number;
  paymentStatus: string;
  paymentId?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  date?: string;
  time?: string;
}) {
  const generatedAt = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });

  const lines = [
    "Karali Payment Receipt",
    "",
    `Booking ID: ${input.bookingId}`,
    `Guest: ${input.customerName}`,
    input.date ? `Reservation Date: ${input.date}` : "",
    input.time ? `Reservation Time: ${input.time}` : "",
    `Amount Received: Rs. ${Number(input.amountReceived || 0).toFixed(0)}`,
    `Payment Status: ${input.paymentStatus}`,
    `Internal Payment ID: ${input.paymentId || "-"}`,
    `Razorpay Payment ID: ${input.razorpayPaymentId || "-"}`,
    `Razorpay Order ID: ${input.razorpayOrderId || "-"}`,
    "",
    `Generated On: ${generatedAt}`,
    "This advance payment will be adjusted in the final restaurant bill.",
  ]
    .filter((line) => line !== "")
    .flatMap((line) => splitLine(line));

  let currentY = 780;
  const textCommands = [
    "BT",
    "/F1 22 Tf",
    "50 810 Td",
    `(${escapePdfText("Karali Payment Receipt")}) Tj`,
    "ET",
    "BT",
    "/F1 12 Tf",
  ];

  for (const line of lines.slice(1)) {
    textCommands.push(`50 ${currentY} Td`);
    textCommands.push(`(${escapePdfText(line)}) Tj`);
    currentY -= 20;
  }

  textCommands.push("ET");
  const content = textCommands.join("\n");
  const contentLength = Buffer.byteLength(content, "utf8");

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
    `5 0 obj\n<< /Length ${contentLength} >>\nstream\n${content}\nendstream\nendobj`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${object}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}
