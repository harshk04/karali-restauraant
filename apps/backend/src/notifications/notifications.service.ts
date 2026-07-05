import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import crypto from "crypto";
import { Model } from "mongoose";
import { buildReceiptPdf } from "../common/receipt-pdf";
import { Booking, BookingDocument } from "../database/schemas/booking.schema";

type BookingNotificationPayload = {
  bookingId?: string;
  customerName?: string;
  phone?: string;
  date?: string;
  time?: string;
  pax?: number;
  totalAmount?: number;
  qrCode?: string;
  paymentStatus?: "pending" | "paid" | "failed";
  paymentMethod?: "razorpay" | "pay_later";
  paymentId?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
};

type BookingNotificationResult = {
  status: "sent_to_meta" | "failed" | "skipped";
  channel: "whatsapp";
  messageIds: string[];
  error?: string;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
  ) {}

  private normalizePhoneNumber(phone?: string) {
    const digits = (phone || "").replace(/[^\d+]/g, "");

    if (!digits) {
      return "";
    }

    if (digits.startsWith("+")) {
      return digits;
    }

    if (digits.length === 10) {
      return `+91${digits}`;
    }

    return `+${digits}`;
  }

  private decodeQrPng(qrCode?: string) {
    if (!qrCode || !qrCode.startsWith("data:image")) {
      return null;
    }

    const [, base64Payload = ""] = qrCode.split(",", 2);
    if (!base64Payload) {
      return null;
    }

    return Buffer.from(base64Payload, "base64");
  }

  private whatsappEnabled() {
    return Boolean(
      this.configService.get<string>("whatsappAccessToken") &&
      this.configService.get<string>("whatsappPhoneNumberId"),
    );
  }

  private configuredTemplateName() {
    return this.configService.get<string>("whatsappTemplateName") || "";
  }

  private shouldUseBookingTemplate() {
    const templateName = this.configuredTemplateName();
    return Boolean(
      this.configService.get<boolean>("whatsappUseBookingTemplate") ||
        (templateName && templateName !== "hello_world"),
    );
  }

  private apiBaseUrl() {
    const version =
      this.configService.get<string>("whatsappApiVersion") || "v20.0";
    return `https://graph.facebook.com/${version}`;
  }

  private async markMessageStatus(
    messageId: string,
    status: "sent" | "delivered" | "read" | "failed",
    errorMessage = "",
  ) {
    await this.bookingModel.updateOne(
      { whatsappMessageIds: messageId },
      {
        $set: {
          whatsappNotificationStatus: status,
          whatsappNotificationError: errorMessage,
        },
      },
    );
  }

  verifyWebhook(mode?: string, verifyToken?: string, challenge?: string) {
    const expectedToken =
      this.configService.get<string>("whatsappWebhookVerifyToken") || "";

    if (
      mode === "subscribe" &&
      verifyToken &&
      expectedToken &&
      verifyToken === expectedToken
    ) {
      return challenge || "ok";
    }

    throw new UnauthorizedException("Invalid WhatsApp webhook verify token.");
  }

  async handleWebhook(
    payload: Record<string, unknown>,
    signature?: string,
    rawBody?: Buffer,
  ) {
    const appSecret = this.configService.get<string>("whatsappAppSecret") || "";

    if (appSecret && rawBody && signature) {
      const expectedSignature = `sha256=${crypto
        .createHmac("sha256", appSecret)
        .update(rawBody)
        .digest("hex")}`;

      if (expectedSignature !== signature) {
        throw new BadRequestException("Invalid WhatsApp webhook signature.");
      }
    }

    const entries = Array.isArray(payload.entry) ? payload.entry : [];

    for (const entry of entries as Array<Record<string, unknown>>) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];

      for (const change of changes as Array<Record<string, unknown>>) {
        const value = (change.value || {}) as Record<string, unknown>;
        const statuses = Array.isArray(value.statuses) ? value.statuses : [];

        for (const item of statuses as Array<Record<string, unknown>>) {
          const messageId = String(item.id || "");
          const status = String(item.status || "");
          const errors = Array.isArray(item.errors) ? item.errors : [];
          const errorMessage =
            errors.length > 0
              ? JSON.stringify(errors[0])
              : status === "failed"
                ? "WhatsApp delivery failed."
                : "";

          if (
            messageId &&
            (status === "sent" ||
              status === "delivered" ||
              status === "read" ||
              status === "failed")
          ) {
            await this.markMessageStatus(
              messageId,
              status as "sent" | "delivered" | "read" | "failed",
              errorMessage,
            );
          }
        }
      }
    }

    return { received: true };
  }

  private async uploadMedia(input: {
    bytes: Buffer;
    mimeType: string;
    filename: string;
  }) {
    const accessToken = this.configService.get<string>("whatsappAccessToken");
    const phoneNumberId = this.configService.get<string>(
      "whatsappPhoneNumberId",
    );

    if (!accessToken || !phoneNumberId || !input.bytes?.length) {
      return "";
    }

    const formData = new FormData();
    formData.append("messaging_product", "whatsapp");
    formData.append("type", input.mimeType);
    formData.append(
      "file",
      new Blob([new Uint8Array(input.bytes)], { type: input.mimeType }),
      input.filename,
    );

    const response = await fetch(
      `${this.apiBaseUrl()}/${phoneNumberId}/media`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(
        `WhatsApp media upload failed with status ${response.status}${details ? `: ${details}` : ""}`,
      );
    }

    const data = (await response.json()) as { id?: string };
    return data.id || "";
  }

  private async uploadQrMedia(qrCode?: string) {
    const qrPng = this.decodeQrPng(qrCode);

    if (!qrPng) {
      return "";
    }

    return this.uploadMedia({
      bytes: qrPng,
      mimeType: "image/png",
      filename: "booking-qr.png",
    });
  }

  private async sendImageMessage(to: string, mediaId: string, caption: string) {
    const accessToken = this.configService.get<string>("whatsappAccessToken");
    const phoneNumberId = this.configService.get<string>(
      "whatsappPhoneNumberId",
    );

    if (!accessToken || !phoneNumberId || !mediaId) {
      return "";
    }

    const response = await fetch(
      `${this.apiBaseUrl()}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "image",
          image: {
            id: mediaId,
            caption,
          },
        }),
      },
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(
        `WhatsApp image send failed with status ${response.status}${details ? `: ${details}` : ""}`,
      );
    }

    const data = (await response.json()) as {
      messages?: Array<{ id?: string }>;
    };
    return data.messages?.[0]?.id || "";
  }

  private async sendTextMessage(to: string, body: string) {
    const accessToken = this.configService.get<string>("whatsappAccessToken");
    const phoneNumberId = this.configService.get<string>(
      "whatsappPhoneNumberId",
    );

    if (!accessToken || !phoneNumberId) {
      return "";
    }

    const response = await fetch(
      `${this.apiBaseUrl()}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: {
            preview_url: false,
            body,
          },
        }),
      },
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(
        `WhatsApp text send failed with status ${response.status}${details ? `: ${details}` : ""}`,
      );
    }

    const data = (await response.json()) as {
      messages?: Array<{ id?: string }>;
    };
    return data.messages?.[0]?.id || "";
  }

  private async sendDocumentMessage(
    to: string,
    mediaId: string,
    filename: string,
    caption?: string,
  ) {
    const accessToken = this.configService.get<string>("whatsappAccessToken");
    const phoneNumberId = this.configService.get<string>(
      "whatsappPhoneNumberId",
    );

    if (!accessToken || !phoneNumberId || !mediaId) {
      return "";
    }

    const response = await fetch(
      `${this.apiBaseUrl()}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "document",
          document: {
            id: mediaId,
            filename,
            caption: caption || undefined,
          },
        }),
      },
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(
        `WhatsApp document send failed with status ${response.status}${details ? `: ${details}` : ""}`,
      );
    }

    const data = (await response.json()) as {
      messages?: Array<{ id?: string }>;
    };
    return data.messages?.[0]?.id || "";
  }

  private async sendTemplateMessage(to: string) {
    const accessToken = this.configService.get<string>("whatsappAccessToken");
    const phoneNumberId = this.configService.get<string>(
      "whatsappPhoneNumberId",
    );
    const templateName = this.configuredTemplateName() || "hello_world";
    const templateLanguage =
      this.configService.get<string>("whatsappTemplateLanguage") || "en_US";

    if (!accessToken || !phoneNumberId || !templateName) {
      return "";
    }

    const response = await fetch(
      `${this.apiBaseUrl()}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "template",
          template: {
            name: templateName,
            language: {
              code: templateLanguage,
            },
          },
        }),
      },
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(
        `WhatsApp template send failed with status ${response.status}${details ? `: ${details}` : ""}`,
      );
    }

    const data = (await response.json()) as {
      messages?: Array<{ id?: string }>;
    };
    return data.messages?.[0]?.id || "";
  }

  private currency(amount?: number) {
    return `Rs. ${Number(amount || 0).toFixed(0)}`;
  }

  private buildBookingCaption(payload: BookingNotificationPayload) {
    const lines = [
      `Hello ${payload.customerName || "Guest"}, your Karali reservation is confirmed.`,
      "",
      `Booking ID: ${payload.bookingId}`,
      `Date: ${payload.date || "-"}`,
      `Time: ${payload.time || "-"}`,
      `Guests: ${payload.pax || 0}`,
    ];

    if (payload.paymentStatus === "paid" && (payload.totalAmount || 0) > 0) {
      lines.push(
        `Prepaid Amount: INR ${this.currency(payload.totalAmount)}`,
        "This prepaid amount will be adjusted in the final bill.",
      );
    }

    lines.push("Please present this QR pass at check-in.");

    return lines.join("\n");
  }

  private buildPaymentReceiptCaption(payload: BookingNotificationPayload) {
    return [
      `Payment receipt for booking ${payload.bookingId}`,
      `Amount Received: INR ${this.currency(payload.totalAmount)}`,
      "This advance payment will be adjusted in the final restaurant bill.",
    ].join("\n");
  }

  async sendBookingNotification(
    payload?: BookingNotificationPayload,
  ): Promise<BookingNotificationResult> {
    const normalizedPhone = this.normalizePhoneNumber(payload?.phone);

    if (!payload?.bookingId || !normalizedPhone) {
      return {
        status: "skipped",
        channel: "whatsapp",
        messageIds: [],
        error: "Missing booking id or phone number.",
      };
    }

    if (!this.whatsappEnabled()) {
      this.logger.warn(
        `WhatsApp is not configured. Skipping notification for ${payload.bookingId}.`,
      );
      return {
        status: "skipped",
        channel: "whatsapp",
        messageIds: [],
        error: "WhatsApp credentials are not configured.",
      };
    }

    const frontendUrl = this.configService.get<string>("frontendUrl") || "";
    const backendUrl = this.configService.get<string>("backendUrl") || "";
    const confirmationUrl = frontendUrl
      ? `${frontendUrl.replace(/\/$/, "")}/booking/confirmed?bookingId=${encodeURIComponent(payload.bookingId)}`
      : "";
    const qrFallbackUrl = backendUrl
      ? `${backendUrl.replace(/\/$/, "")}/qr/${encodeURIComponent(payload.bookingId)}/image`
      : "";
    const caption = [
      this.buildBookingCaption(payload),
      confirmationUrl ? `Confirmation: ${confirmationUrl}` : "",
      !payload.qrCode && qrFallbackUrl ? `QR fallback: ${qrFallbackUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      const messageIds: string[] = [];
      const mediaId = await this.uploadQrMedia(payload.qrCode);

      if (mediaId) {
        const imageMessageId = await this.sendImageMessage(
          normalizedPhone,
          mediaId,
          caption,
        );
        if (imageMessageId) {
          messageIds.push(imageMessageId);
        }
      } else {
        const textMessageId = await this.sendTextMessage(normalizedPhone, caption);
        if (textMessageId) {
          messageIds.push(textMessageId);
        }
      }

      if (payload.paymentStatus === "paid" && (payload.totalAmount || 0) > 0) {
        const receiptPdf = buildReceiptPdf({
          bookingId: payload.bookingId,
          customerName: payload.customerName || "Guest",
          amountReceived: payload.totalAmount || 0,
          paymentStatus: payload.paymentStatus,
          paymentId: payload.paymentId,
          razorpayPaymentId: payload.razorpayPaymentId,
          razorpayOrderId: payload.razorpayOrderId,
          date: payload.date,
          time: payload.time,
        });
        const receiptMediaId = await this.uploadMedia({
          bytes: receiptPdf,
          mimeType: "application/pdf",
          filename: `${payload.bookingId}-receipt.pdf`,
        });
        const receiptMessageId = receiptMediaId
          ? await this.sendDocumentMessage(
              normalizedPhone,
              receiptMediaId,
              `${payload.bookingId}-receipt.pdf`,
              this.buildPaymentReceiptCaption(payload),
            )
          : "";
        if (receiptMessageId) {
          messageIds.push(receiptMessageId);
        }
      }

      return {
        status: "sent_to_meta",
        channel: "whatsapp",
        messageIds,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown WhatsApp delivery failure.";
      this.logger.error(
        `Failed to send WhatsApp booking confirmation for ${payload.bookingId}: ${message}`,
      );
      return {
        status: "failed",
        channel: "whatsapp",
        messageIds: [],
        error: message,
      };
    }
  }
}
