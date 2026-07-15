import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import { Model } from "mongoose";
import crypto from "crypto";
import QRCode from "qrcode";
import { Booking, BookingDocument } from "../database/schemas/booking.schema";
import { SlotOccupancy, SlotOccupancyDocument } from "../database/schemas/slot-occupancy.schema";
import { buildReceiptPdf } from "../common/receipt-pdf";
import { SlotsService } from "../slots/slots.service";
import { NotificationsService } from "../notifications/notifications.service";
import { sha256 } from "../common/security/hash.util";
type CreateBookingInput = {
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
};

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  private readonly shareTokenSecret = process.env.JWT_SECRET || "karali";
  private readonly shareTokenTtlSeconds = 60 * 60 * 24 * 30;

  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(SlotOccupancy.name)
    private readonly slotOccupancyModel: Model<SlotOccupancyDocument>,
    private readonly slotsService: SlotsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async deliverWhatsAppConfirmation(payload: {
    bookingId: string;
    customerName: string;
    phone: string;
    accessKey?: string;
    shareToken?: string;
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
    qrToken: string;
    expiry: Date;
  }) {
    const signature = crypto
      .createHmac("sha256", process.env.JWT_SECRET || "karali")
      .update(`${booking.bookingId}:${booking.qrToken}:${booking.expiry.toISOString()}`)
      .digest("hex");

    return {
      bookingId: booking.bookingId,
      guestName: booking.customerName,
      date: booking.date,
      time: booking.time,
      pax: booking.pax,
      qrToken: booking.qrToken,
      signature,
      expiry: booking.expiry.toISOString(),
    };
  }

  private async generateQrCode(booking: {
    bookingId: string;
    customerName: string;
    date: string;
    time: string;
    pax: number;
    qrToken: string;
    expiry: Date;
  }) {
    return QRCode.toDataURL(JSON.stringify(this.buildQrPayload(booking)));
  }

  private normalizeContact(value?: string) {
    return String(value || "").trim();
  }

  private normalizeEmail(value?: string) {
    return this.normalizeContact(value).toLowerCase();
  }

  private createBookingId() {
    return `KR-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
  }

  private createAccessKey() {
    return crypto.randomBytes(24).toString("hex");
  }

  private createQrToken() {
    return crypto.randomBytes(18).toString("base64url");
  }

  createShareToken(bookingId: string) {
    const expiry = Math.floor(Date.now() / 1000) + this.shareTokenTtlSeconds;
    const expiryPart = expiry.toString(36);
    const signature = crypto
      .createHmac("sha256", this.shareTokenSecret)
      .update(`share:${bookingId}:${expiryPart}`)
      .digest("base64url")
      .slice(0, 18);

    return `${expiryPart}.${signature}`;
  }

  private validateShareToken(bookingId: string, shareToken: string) {
    const [expiryPart = "", signature = ""] = String(shareToken || "").split(".", 2);

    if (!expiryPart || !signature) {
      return false;
    }

    const expiry = Number.parseInt(expiryPart, 36);
    if (!Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000)) {
      return false;
    }

    const expected = crypto
      .createHmac("sha256", this.shareTokenSecret)
      .update(`share:${bookingId}:${expiryPart}`)
      .digest("base64url")
      .slice(0, 18);

    if (signature.length !== expected.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  private buildConfirmationResponse(doc: BookingDocument | null, accessKey: string) {
    return {
      ...this.toResponse(doc),
      accessKey,
    };
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

  private async reserveSlot(slotId: string, pax: number) {
    const date = slotId.slice(0, 10);
    const time = slotId.slice(11);
    const slotAvailability = await this.slotsService.slots(date);
    const selectedSlot = slotAvailability.slots.find((slot) => slot.time === time);

    if (!selectedSlot?.available) {
      throw new BadRequestException(selectedSlot?.reason || "Selected slot is unavailable.");
    }

    const maxBookingsPerSlot =
      selectedSlot && "maxBookingsPerSlot" in selectedSlot
        ? Number(selectedSlot.maxBookingsPerSlot || 0)
        : 6;

    try {
      const occupancy = await this.slotOccupancyModel.findOneAndUpdate(
        {
          slotId,
          reservationCount: { $lt: maxBookingsPerSlot },
        },
        {
          $setOnInsert: {
            slotId,
            date,
            time,
          },
          $set: {
            capacityBookings: maxBookingsPerSlot,
          },
          $inc: {
            reservationCount: 1,
            guestCount: pax,
          },
        },
        {
          upsert: true,
          new: true,
        },
      );

      if (!occupancy) {
        throw new ConflictException("Selected slot is fully booked.");
      }
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new ConflictException("Selected slot is currently being booked. Please try again.");
      }

      throw error;
    }
  }

  private async releaseSlot(slotId: string, pax: number) {
    await this.slotOccupancyModel.updateOne(
      { slotId, reservationCount: { $gt: 0 } },
      {
        $inc: {
          reservationCount: -1,
          guestCount: -Math.max(0, pax),
        },
      },
    );
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
    const booking = await this.bookingModel.findOne({ bookingId: id }).lean();
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

  private async createBookingDocument(dto: CreateBookingInput & { bookingId?: string; status: Booking["status"] }) {
    const bookingId = dto.bookingId || this.createBookingId();
    const date = dto.slotId.slice(0, 10);
    const time = dto.slotId.slice(11);
    const accessKey = this.createAccessKey();
    const qrToken = this.createQrToken();
    const qrExpiresAt = new Date(`${date}T${time}:00.000Z`);
    qrExpiresAt.setHours(qrExpiresAt.getHours() + 2);

    await this.reserveSlot(dto.slotId, dto.pax);

    try {
      const created = await this.bookingModel.create({
        bookingId,
        customerName: this.normalizeContact(dto.customerName) || "Guest",
        email: this.normalizeEmail(dto.email),
        phone: this.normalizeContact(dto.phone),
      source: dto.source || "customer",
      slotId: dto.slotId,
      date,
      time,
      pax: dto.pax,
      status: dto.status,
      paymentStatus: "pending",
      specialRequest: this.normalizeContact(dto.specialRequest),
      paymentMethod: dto.paymentMethod || "pay_later",
      couponCode: this.normalizeContact(dto.couponCode).toUpperCase(),
      discountAmount: dto.discountAmount || 0,
      totalAmount: dto.totalAmount || 0,
      accessKeyHash: sha256(accessKey),
      qrTokenHash: sha256(qrToken),
      qrExpiresAt,
      qrCode: await this.generateQrCode({
        bookingId,
        customerName: this.normalizeContact(dto.customerName) || "Guest",
        date,
        time,
        pax: dto.pax,
        qrToken,
        expiry: qrExpiresAt,
      }),
    });

      return {
        created,
        accessKey,
      };
    } catch (error) {
      await this.releaseSlot(dto.slotId, dto.pax);
      throw error;
    }
  }

  async create(dto: CreateBookingInput) {
    const finalAmount = dto.totalAmount || 0;
    const { created, accessKey } = await this.createBookingDocument({
      ...dto,
      status: "confirmed",
      totalAmount: finalAmount,
    });

    await this.deliverWhatsAppConfirmation({
      bookingId: created.bookingId,
      customerName: created.customerName,
      phone: created.phone,
      accessKey,
      shareToken: this.createShareToken(created.bookingId),
      date: created.date,
      time: created.time,
      pax: created.pax,
      totalAmount: finalAmount,
      qrCode: created.qrCode,
      paymentStatus: "pending",
      paymentMethod: (dto.paymentMethod || "pay_later") as "razorpay" | "pay_later",
    });

    this.logger.log(JSON.stringify({ event: "booking.created", bookingId: created.bookingId, source: created.source }));
    return this.buildConfirmationResponse(created as BookingDocument, accessKey);
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
    if (dto.bookingId) {
      const existingByBookingId = await this.bookingModel
        .findOne({ bookingId: dto.bookingId })
        .lean();
      if (existingByBookingId) {
        const accessKey = await this.rotateAccessKey(existingByBookingId.bookingId);
        return {
          ...this.toResponse(existingByBookingId as BookingDocument),
          accessKey,
        };
      }
    }

    const { created, accessKey } = await this.createBookingDocument({
      ...dto,
      status: "pending",
      paymentMethod: dto.paymentMethod || "razorpay",
    });

    created.razorpayOrderId = dto.razorpayOrderId || "";
    created.paymentId = dto.paymentId || "";
    created.razorpaySubscriptionId = dto.razorpaySubscriptionId || "";
    await created.save();

    return this.buildConfirmationResponse(created as BookingDocument, accessKey);
  }

  async rotateAccessKey(bookingId: string) {
    const accessKey = this.createAccessKey();
    await this.bookingModel.updateOne(
      { bookingId },
      {
        $set: {
          accessKeyHash: sha256(accessKey),
        },
      },
    );
    return accessKey;
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
      const qrToken = this.createQrToken();
      const qrExpiresAt = new Date(`${updated.date}T${updated.time}:00.000Z`);
      qrExpiresAt.setHours(qrExpiresAt.getHours() + 2);
      const qrCode = await this.generateQrCode({
        bookingId: updated.bookingId,
        customerName: updated.customerName,
        date: updated.date,
        time: updated.time,
        pax: updated.pax,
        qrToken,
        expiry: qrExpiresAt,
      });
      await this.bookingModel.updateOne({
        bookingId,
      }, {
        $set: {
          qrCode,
          qrTokenHash: sha256(qrToken),
          qrExpiresAt,
        },
      });
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
        shareToken: this.createShareToken(response.bookingId),
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

    if (updated?.slotId) {
      await this.releaseSlot(updated.slotId, updated.pax);
    }

    return this.toResponse(updated as BookingDocument | null);
  }

  async validatePublicAccess(bookingId: string, accessKey: string) {
    const booking = await this.bookingModel
      .findOne({ bookingId })
      .select("+accessKeyHash +qrTokenHash +qrExpiresAt")
      .lean();

    if (!booking) {
      throw new NotFoundException("Booking not found.");
    }

    if (!accessKey || booking.accessKeyHash !== sha256(accessKey)) {
      throw new NotFoundException("Booking not found.");
    }

    return booking;
  }

  async getPublicBooking(bookingId: string, accessKey: string) {
    const booking = await this.validatePublicAccess(bookingId, accessKey);
    return this.toResponse(booking as BookingDocument);
  }

  async getSharedBooking(bookingId: string, shareToken: string) {
    if (!this.validateShareToken(bookingId, shareToken)) {
      throw new NotFoundException("Booking not found.");
    }

    const booking = await this.bookingModel.findOne({ bookingId }).lean();
    if (!booking) {
      throw new NotFoundException("Booking not found.");
    }

    return this.toResponse(booking as BookingDocument);
  }

  async getPublicQr(bookingId: string, accessKey: string) {
    const booking = await this.validatePublicAccess(bookingId, accessKey);
    return {
      bookingId: booking.bookingId,
      customerName: booking.customerName,
      date: booking.date,
      time: booking.time,
      pax: booking.pax,
      expiry: booking.qrExpiresAt?.toISOString() || "",
      qrCode: booking.qrCode,
    };
  }

  async getSharedQr(bookingId: string, shareToken: string) {
    if (!this.validateShareToken(bookingId, shareToken)) {
      throw new NotFoundException("Booking not found.");
    }

    const booking = await this.bookingModel.findOne({ bookingId }).lean();
    if (!booking) {
      throw new NotFoundException("Booking not found.");
    }

    return {
      bookingId: booking.bookingId,
      customerName: booking.customerName,
      date: booking.date,
      time: booking.time,
      pax: booking.pax,
      expiry: booking.qrExpiresAt?.toISOString() || "",
      qrCode: booking.qrCode,
    };
  }

  async validateQrToken(bookingId: string, qrToken: string) {
    const booking = await this.bookingModel
      .findOne({ bookingId })
      .select("+qrTokenHash +qrExpiresAt")
      .lean();

    if (!booking) {
      return { valid: false as const, reason: "invalid" as const };
    }

    if (!qrToken || booking.qrTokenHash !== sha256(qrToken)) {
      return { valid: false as const, reason: "invalid" as const, booking };
    }

    if (booking.qrExpiresAt && booking.qrExpiresAt.getTime() < Date.now()) {
      return { valid: false as const, reason: "expired" as const, booking };
    }

    return {
      valid: true as const,
      booking,
    };
  }

  async releaseBookingSlotIfNeeded(bookingId: string) {
    const booking = await this.bookingModel.findOne({ bookingId }).lean();
    if (booking?.slotId) {
      await this.releaseSlot(booking.slotId, booking.pax);
    }
  }

  @Cron("*/10 * * * *")
  async expireStalePendingBookings() {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);
    const staleBookings = await this.bookingModel
      .find({
        status: "pending",
        paymentStatus: "pending",
        createdAt: { $lt: cutoff },
      })
      .lean();

    for (const booking of staleBookings) {
      await this.bookingModel.updateOne(
        { _id: booking._id, status: "pending" },
        {
          $set: {
            status: "cancelled",
            paymentStatus: "failed",
            cancelledAt: new Date(),
          },
        },
      );
      await this.releaseSlot(booking.slotId, booking.pax);
    }
  }
}
