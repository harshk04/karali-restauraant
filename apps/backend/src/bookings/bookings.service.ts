import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { randomInt } from "crypto";
import crypto from "crypto";
import QRCode from "qrcode";
import { Booking, BookingDocument } from "../database/schemas/booking.schema";
import { buildReceiptPdf } from "../common/receipt-pdf";
import { SlotsService } from "../slots/slots.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    private readonly slotsService: SlotsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async deliverWhatsAppConfirmation(payload: {
    bookingId: string;
    customerName: string;
    phone: string;
    date: string;
    time: string;
    pax: number;
    totalAmount: number;
    qrCode: string;
    paymentStatus: "pending" | "paid" | "failed";
    paymentMethod: "razorpay" | "pay_later";
    paymentId?: string;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
  }) {
    const notification =
      await this.notificationsService.sendBookingNotification(payload);

    await this.bookingModel.updateOne(
      { bookingId: payload.bookingId },
      {
        $set: {
          whatsappNotificationStatus: notification.status,
          whatsappMessageIds: notification.messageIds,
          whatsappNotificationSentAt:
            notification.status === "sent_to_meta" ? new Date() : null,
          whatsappNotificationError: notification.error || "",
        },
      },
    );
  }

  private buildQrPayload(booking: {
    bookingId: string;
    customerName: string;
    date: string;
    time: string;
    pax: number;
  }) {
    const signature = crypto
      .createHmac("sha256", process.env.JWT_SECRET || "karali")
      .update(
        `${booking.bookingId}:${booking.customerName}:${booking.date}:${booking.time}:${booking.pax}`,
      )
      .digest("hex");

    return {
      bookingId: booking.bookingId,
      guestName: booking.customerName,
      date: booking.date,
      time: booking.time,
      pax: booking.pax,
      signature,
      expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  private async generateQrCode(booking: {
    bookingId: string;
    customerName: string;
    date: string;
    time: string;
    pax: number;
  }) {
    return QRCode.toDataURL(JSON.stringify(this.buildQrPayload(booking)));
  }

  private toResponse(doc: BookingDocument | null) {
    if (!doc) {
      return null;
    }

    return {
      id: String(doc._id),
      bookingId: doc.bookingId,
      customerName: doc.customerName,
      email: doc.email,
      phone: doc.phone,
      source: doc.source,
      paymentId: doc.paymentId,
      paymentMethod: doc.paymentMethod,
      couponCode: doc.couponCode,
      discountAmount: doc.discountAmount,
      totalAmount: doc.totalAmount,
      razorpayOrderId: doc.razorpayOrderId,
      razorpayPaymentId: doc.razorpayPaymentId,
      razorpaySubscriptionId: doc.razorpaySubscriptionId,
      qrCode: doc.qrCode,
      date: doc.date,
      time: doc.time,
      pax: doc.pax,
      status: doc.status,
      paymentStatus: doc.paymentStatus,
      specialRequest: doc.specialRequest,
    };
  }

  async list() {
    const docs = await this.bookingModel.find().sort({ createdAt: -1 }).lean();
    return docs.map((doc) => ({
      id: String(doc._id),
      bookingId: doc.bookingId,
      customerName: doc.customerName,
      email: doc.email,
      phone: doc.phone,
      source: doc.source,
      paymentId: doc.paymentId,
      paymentMethod: doc.paymentMethod,
      couponCode: doc.couponCode,
      discountAmount: doc.discountAmount,
      totalAmount: doc.totalAmount,
      razorpayOrderId: doc.razorpayOrderId,
      razorpayPaymentId: doc.razorpayPaymentId,
      razorpaySubscriptionId: doc.razorpaySubscriptionId,
      qrCode: doc.qrCode,
      date: doc.date,
      time: doc.time,
      pax: doc.pax,
      status: doc.status,
      paymentStatus: doc.paymentStatus,
      specialRequest: doc.specialRequest,
    }));
  }

  async findOne(id: string) {
    const booking = await this.bookingModel.findById(id).lean();
    return this.toResponse(booking as BookingDocument | null);
  }

  async findByBookingId(bookingId: string) {
    const booking = await this.bookingModel.findOne({ bookingId }).lean();
    return this.toResponse(booking as BookingDocument | null);
  }

  async receiptPdf(bookingId: string) {
    const booking = await this.findByBookingId(bookingId);

    if (!booking) {
      throw new BadRequestException("Booking not found.");
    }

    return buildReceiptPdf({
      bookingId: booking.bookingId,
      customerName: booking.customerName,
      amountReceived: booking.totalAmount,
      paymentStatus: booking.paymentStatus,
      paymentId: booking.paymentId,
      razorpayPaymentId: booking.razorpayPaymentId,
      razorpayOrderId: booking.razorpayOrderId,
      date: booking.date,
      time: booking.time,
    });
  }

  async create(dto: {
    customerName?: string;
    email?: string;
    phone?: string;
    source?: "customer" | "manual";
    slotId: string;
    pax: number;
    specialRequest?: string;
    paymentMethod?: "razorpay" | "pay_later";
    couponCode?: string;
    discountAmount?: number;
    totalAmount?: number;
  }) {
    const finalAmount = dto.totalAmount || 0;
    const slotAvailability = await this.slotsService.slots(
      dto.slotId.slice(0, 10),
    );
    const selectedSlot = slotAvailability.slots.find(
      (slot) => slot.time === dto.slotId.slice(11),
    );
    if (!selectedSlot?.available) {
      throw new BadRequestException(
        selectedSlot?.reason || "Selected slot is unavailable",
      );
    }

    const bookingId = `KR-${randomInt(1000, 9999)}`;
    const date = dto.slotId.slice(0, 10);
    const time = dto.slotId.slice(11);

    const created = await this.bookingModel.create({
      bookingId,
      customerName: dto.customerName || "Guest",
      email: dto.email || "",
      phone: dto.phone || "",
      source: dto.source || "customer",
      slotId: dto.slotId,
      date,
      time,
      pax: dto.pax,
      status: "confirmed",
      paymentStatus: "pending",
      specialRequest: dto.specialRequest || "",
      paymentMethod: dto.paymentMethod || "pay_later",
      couponCode: dto.couponCode || "",
      discountAmount: dto.discountAmount || 0,
      totalAmount: finalAmount,
      qrCode: await this.generateQrCode({
        bookingId,
        customerName: dto.customerName || "Guest",
        date,
        time,
        pax: dto.pax,
      }),
    });

    await this.deliverWhatsAppConfirmation({
      bookingId,
      customerName: dto.customerName || "Guest",
      phone: dto.phone || "",
      date,
      time,
      pax: dto.pax,
      totalAmount: finalAmount,
      qrCode: created.qrCode,
      paymentStatus: "pending",
      paymentMethod: (dto.paymentMethod || "pay_later") as "razorpay" | "pay_later",
    });

    return this.toResponse(created as BookingDocument);
  }

  async createPending(dto: {
    bookingId?: string;
    customerName?: string;
    email?: string;
    phone?: string;
    source?: "customer" | "manual";
    slotId: string;
    pax: number;
    specialRequest?: string;
    paymentMethod?: "razorpay" | "pay_later";
    couponCode?: string;
    discountAmount?: number;
    totalAmount?: number;
    razorpayOrderId?: string;
    paymentId?: string;
    razorpaySubscriptionId?: string;
  }) {
    const slotAvailability = await this.slotsService.slots(
      dto.slotId.slice(0, 10),
    );
    const selectedSlot = slotAvailability.slots.find(
      (slot) => slot.time === dto.slotId.slice(11),
    );
    if (!selectedSlot?.available) {
      throw new BadRequestException(
        selectedSlot?.reason || "Selected slot is unavailable",
      );
    }

    if (dto.bookingId) {
      const existingByBookingId = await this.bookingModel
        .findOne({ bookingId: dto.bookingId })
        .lean();
      if (existingByBookingId) {
        return this.toResponse(existingByBookingId as BookingDocument);
      }
    }

    const bookingId = dto.bookingId || `KR-${randomInt(1000, 9999)}`;
    const date = dto.slotId.slice(0, 10);
    const time = dto.slotId.slice(11);

    const created = await this.bookingModel.create({
      bookingId,
      customerName: dto.customerName || "Guest",
      email: dto.email || "",
      phone: dto.phone || "",
      source: dto.source || "customer",
      slotId: dto.slotId,
      date,
      time,
      pax: dto.pax,
      status: "pending",
      paymentStatus: "pending",
      specialRequest: dto.specialRequest || "",
      paymentMethod: "pay_later",
      couponCode: dto.couponCode || "",
      discountAmount: dto.discountAmount || 0,
      totalAmount: dto.totalAmount || 0,
      razorpayOrderId: dto.razorpayOrderId || "",
      paymentId: dto.paymentId || "",
      razorpaySubscriptionId: dto.razorpaySubscriptionId || "",
      qrCode: await this.generateQrCode({
        bookingId,
        customerName: dto.customerName || "Guest",
        date,
        time,
        pax: dto.pax,
      }),
    });

    return this.toResponse(created as BookingDocument);
  }

  async markPaymentPaid(
    bookingId: string,
    payload: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySubscriptionId?: string;
      paymentId?: string;
    },
  ) {
    const updated = await this.bookingModel
      .findOneAndUpdate(
        { bookingId },
        {
          $set: {
            paymentStatus: "paid",
            status: "confirmed",
            razorpayOrderId: payload.razorpayOrderId,
            razorpayPaymentId: payload.razorpayPaymentId,
            razorpaySubscriptionId: payload.razorpaySubscriptionId || "",
            paymentId: payload.paymentId || "",
          },
        },
        { new: true },
      )
      .lean();

    if (updated && !updated.qrCode) {
      const qrCode = await this.generateQrCode({
        bookingId: updated.bookingId,
        customerName: updated.customerName,
        date: updated.date,
        time: updated.time,
        pax: updated.pax,
      });
      await this.bookingModel.updateOne({ bookingId }, { $set: { qrCode } });
      updated.qrCode = qrCode as never;
    }

    const response = this.toResponse(updated as BookingDocument | null);

    if (
      response &&
      response.status === "confirmed" &&
      response.paymentStatus === "paid" &&
      (updated?.whatsappNotificationStatus || "pending") !== "sent_to_meta"
    ) {
      await this.deliverWhatsAppConfirmation({
        bookingId: response.bookingId,
        customerName: response.customerName,
        phone: response.phone,
        date: response.date,
        time: response.time,
        pax: response.pax,
        totalAmount: response.totalAmount,
        qrCode: response.qrCode,
        paymentStatus: response.paymentStatus,
        paymentMethod: response.paymentMethod,
        paymentId: response.paymentId,
        razorpayPaymentId: response.razorpayPaymentId,
        razorpayOrderId: response.razorpayOrderId,
      });
    }

    return response;
  }

  async markPaymentFailed(bookingId: string) {
    const updated = await this.bookingModel
      .findOneAndUpdate(
        { bookingId },
        {
          $set: {
            paymentStatus: "failed",
            status: "cancelled",
          },
        },
        { new: true },
      )
      .lean();

    return this.toResponse(updated as BookingDocument | null);
  }
}
