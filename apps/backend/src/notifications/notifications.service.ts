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

  private async uploadQrMedia(qrCode?: string) {
    const accessToken = this.configService.get<string>("whatsappAccessToken");
    const phoneNumberId = this.configService.get<string>(
      "whatsappPhoneNumberId",
    );
    const qrPng = this.decodeQrPng(qrCode);

    if (!accessToken || !phoneNumberId || !qrPng) {
      return "";
    }

    const formData = new FormData();
    formData.append("messaging_product", "whatsapp");
    formData.append("type", "image/png");
    formData.append(
      "file",
      new Blob([qrPng], { type: "image/png" }),
      "booking-qr.png",
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

  private async sendBookingTemplateMessage(
    to: string,
    payload: Required<
      Pick<
        BookingNotificationPayload,
        "customerName" | "bookingId" | "date" | "time" | "pax"
      >
    > & { amount: string },
  ) {
    const accessToken = this.configService.get<string>("whatsappAccessToken");
    const phoneNumberId = this.configService.get<string>(
      "whatsappPhoneNumberId",
    );
    const templateName =
      this.configuredTemplateName() || "karali_booking_confirmation_v1";
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
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: payload.customerName },
                  { type: "text", text: payload.bookingId },
                  { type: "text", text: payload.date },
                  { type: "text", text: payload.time },
                  { type: "text", text: String(payload.pax) },
                  { type: "text", text: payload.amount },
                ],
              },
            ],
          },
        }),
      },
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(
        `WhatsApp booking template send failed with status ${response.status}${details ? `: ${details}` : ""}`,
      );
    }

    const data = (await response.json()) as {
      messages?: Array<{ id?: string }>;
    };
    return data.messages?.[0]?.id || "";
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
    const summaryMessage =
      `Karali booking confirmed\n\n` +
      `Booking ID: ${payload.bookingId}\n` +
      `Guest: ${payload.customerName || "Guest"}\n` +
      `Date: ${payload.date || "-"}\n` +
      `Time: ${payload.time || "-"}\n` +
      `Guests: ${payload.pax || 0}\n` +
      (confirmationUrl ? `Confirmation: ${confirmationUrl}\n` : "") +
      (qrFallbackUrl ? `QR fallback: ${qrFallbackUrl}` : "");

    try {
      const messageIds: string[] = [];
      const useBookingTemplate = this.shouldUseBookingTemplate();
      const useTemplateOpener = Boolean(
        this.configService.get<boolean>("whatsappUseTemplateOpener"),
      );

      if (useBookingTemplate) {
        const bookingTemplateId = await this.sendBookingTemplateMessage(
          normalizedPhone,
          {
            customerName: payload.customerName || "Guest",
            bookingId: payload.bookingId,
            date: payload.date || "-",
            time: payload.time || "-",
            pax: payload.pax || 0,
            amount: `Rs. ${payload.totalAmount || 0}`,
          },
        );
        if (bookingTemplateId) {
          messageIds.push(bookingTemplateId);
        }
      } else if (useTemplateOpener) {
        const openerMessageId = await this.sendTemplateMessage(normalizedPhone);
        if (openerMessageId) {
          messageIds.push(openerMessageId);
        }
      }

      const allowFollowUpMessages = !useBookingTemplate;

      if (allowFollowUpMessages) {
        const mediaId = await this.uploadQrMedia(payload.qrCode);

        if (mediaId) {
          const imageMessageId = await this.sendImageMessage(
            normalizedPhone,
            mediaId,
            `Karali reservation QR for ${payload.bookingId}`,
          );
          if (imageMessageId) {
            messageIds.push(imageMessageId);
          }
        }

        const textMessageId = await this.sendTextMessage(
          normalizedPhone,
          summaryMessage,
        );
        if (textMessageId) {
          messageIds.push(textMessageId);
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
