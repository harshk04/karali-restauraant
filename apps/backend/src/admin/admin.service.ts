import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import bcrypt from "bcryptjs";
import { Booking, BookingDocument } from "../database/schemas/booking.schema";
import { Payment, PaymentDocument } from "../database/schemas/payment.schema";
import { Availability, AvailabilityDocument } from "../database/schemas/availability.schema";
import { RestaurantTiming, RestaurantTimingDocument } from "../database/schemas/restaurant-timing.schema";
import { Closure, ClosureDocument } from "../database/schemas/closure.schema";
import { Coupon, CouponDocument } from "../database/schemas/coupon.schema";
import { Checkin, CheckinDocument } from "../database/schemas/checkin.schema";
import { AuditLog, AuditLogDocument } from "../database/schemas/audit-log.schema";
import { SessionTokenService } from "../common/auth/session-token.service";
import type { AdminSession } from "../common/auth/session.types";
import { BookingsService } from "../bookings/bookings.service";

const HARD_CODED_ADMIN_EMAIL = "admin@example.com";
const HARD_CODED_ADMIN_PASSWORD = "password";
const HARD_CODED_ADMIN_NAME = "Admin";
const HARD_CODED_ADMIN_MOBILE = "";

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly allowedTransitions: Record<
    Booking["status"],
    Array<Booking["status"]>
  > = {
    pending: ["confirmed", "cancelled", "no_show"],
    confirmed: ["checked_in", "cancelled", "no_show"],
    checked_in: ["completed"],
    completed: [],
    no_show: [],
    cancelled: [],
  };

  constructor(
    private readonly sessionTokenService: SessionTokenService,
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Availability.name) private readonly availabilityModel: Model<AvailabilityDocument>,
    @InjectModel(RestaurantTiming.name) private readonly timingModel: Model<RestaurantTimingDocument>,
    @InjectModel(Closure.name) private readonly closureModel: Model<ClosureDocument>,
    @InjectModel(Coupon.name) private readonly couponModel: Model<CouponDocument>,
    @InjectModel(Checkin.name) private readonly checkinModel: Model<CheckinDocument>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
    private readonly bookingsService: BookingsService,
  ) {}

  private get adminEmail() {
    return HARD_CODED_ADMIN_EMAIL;
  }

  private get adminPassword() {
    return HARD_CODED_ADMIN_PASSWORD;
  }

  private get adminPasswordHash() {
    return "";
  }

  private get adminName() {
    return HARD_CODED_ADMIN_NAME;
  }

  private get adminMobile() {
    return HARD_CODED_ADMIN_MOBILE;
  }

  private async logAction(action: string, metadata: Record<string, unknown> = {}, targetId = "") {
    await this.auditLogModel.create({
      actorId: "admin",
      actorRole: "admin",
      action,
      targetId,
      metadata,
    });
  }

  async login(email: string, password: string) {
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    const normalizedPassword = String(password ?? "").trim();

    if (normalizedEmail !== this.adminEmail.trim().toLowerCase()) {
      return null;
    }

    const configuredHash = this.adminPasswordHash.trim();
    const configuredPassword = this.adminPassword.trim();
    const matches = configuredHash
      ? await bcrypt.compare(normalizedPassword, configuredHash)
      : Boolean(configuredPassword) && normalizedPassword === configuredPassword;

    if (!matches) {
      this.logger.warn(`Rejected admin login attempt for ${normalizedEmail}`);
      return null;
    }

    const session: AdminSession = {
      id: "admin",
      email: this.adminEmail,
      name: this.adminName,
      mobile: this.adminMobile,
      role: "admin",
    };

    await this.logAction("admin.login", { email: normalizedEmail }, "admin");

    return {
      session,
      accessToken: this.sessionTokenService.signAccessToken({ role: "admin", session }),
      refreshToken: this.sessionTokenService.signRefreshToken("admin", session.id),
    };
  }

  me(session: AdminSession | undefined) {
    if (!session) {
      return null;
    }

    return session;
  }

  refresh(token: string) {
    const payload = this.sessionTokenService.verifyRefreshToken(token, "admin");

    const session: AdminSession = {
      id: "admin",
      email: this.adminEmail,
      name: this.adminName,
      mobile: this.adminMobile,
      role: "admin",
    };

    if (payload.sub !== session.id) {
      throw new UnauthorizedException("Invalid refresh token.");
    }

    return {
      session,
      accessToken: this.sessionTokenService.signAccessToken({ role: "admin", session }),
      refreshToken: this.sessionTokenService.signRefreshToken("admin", session.id),
    };
  }

  async dashboard() {
    const bookings = await this.bookingModel.find().lean();
    const payments = await this.paymentModel.find().lean();
    const today = new Date().toISOString().slice(0, 10);
    return {
      totalBookings: bookings.length,
      todaysBookings: bookings.filter((booking) => booking.date === today).length,
      upcomingBookings: bookings.filter((booking) => booking.date >= today && booking.status !== "cancelled").length,
      completedBookings: bookings.filter((booking) => booking.status === "completed").length,
      cancelledBookings: bookings.filter((booking) => booking.status === "cancelled").length,
      revenue: payments.filter((payment) => payment.paymentStatus === "captured").reduce((sum, payment) => sum + Number(payment.amount || 0), 0) / 100,
    };
  }

  async listBookings(query: { search?: string; status?: string; paymentStatus?: string }) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.search) {
      filter.$or = [
        { bookingId: { $regex: query.search, $options: "i" } },
        { customerName: { $regex: query.search, $options: "i" } },
        { phone: { $regex: query.search, $options: "i" } },
        { email: { $regex: query.search, $options: "i" } },
      ];
    }
    return this.bookingModel.find(filter).sort({ createdAt: -1 }).lean();
  }

  async updateBooking(bookingId: string, payload: Record<string, unknown>) {
    const existing = await this.bookingModel.findOne({ bookingId }).lean();
    if (!existing) {
      throw new NotFoundException("Booking not found.");
    }

    if (typeof payload.status === "string" && payload.status !== existing.status) {
      const nextStatus = payload.status as Booking["status"];
      if (!this.allowedTransitions[existing.status]?.includes(nextStatus)) {
        throw new BadRequestException(`Cannot move booking from ${existing.status} to ${nextStatus}.`);
      }
    }

    if (
      payload.date !== undefined ||
      payload.time !== undefined ||
      payload.pax !== undefined
    ) {
      throw new BadRequestException("Direct rescheduling is disabled until slot reallocation is implemented.");
    }

    const booking = await this.bookingModel.findOneAndUpdate({ bookingId }, { $set: payload }, { new: true }).lean();
    await this.logAction("admin.booking_updated", { bookingId, fields: Object.keys(payload) }, bookingId);
    return booking;
  }

  async markBooking(bookingId: string, status: "checked_in" | "completed" | "no_show" | "cancelled") {
    const current = await this.bookingModel.findOne({ bookingId }).lean();
    if (!current) {
      throw new NotFoundException("Booking not found.");
    }

    if (!this.allowedTransitions[current.status]?.includes(status)) {
      throw new BadRequestException(`Cannot move booking from ${current.status} to ${status}.`);
    }

    if (status === "cancelled" && current.status !== "cancelled") {
      await this.bookingsService.releaseBookingSlotIfNeeded(bookingId);
    }

    const payload: Record<string, unknown> = { status };
    if (status === "checked_in") payload.checkedInAt = new Date();
    if (status === "completed") payload.completedAt = new Date();
    if (status === "no_show") payload.noShowAt = new Date();
    if (status === "cancelled") payload.cancelledAt = new Date();
    const booking = await this.bookingModel.findOneAndUpdate({ bookingId }, { $set: payload }, { new: true }).lean();
    if (booking && status === "checked_in") {
      await this.checkinModel.updateOne(
        { bookingId },
        {
          $set: {
            bookingId,
            staffId: "admin",
            checkedInByStaffId: "admin",
            status: "checked_in",
            checkedInAt: new Date(),
          },
        },
        { upsert: true },
      );
    }
    await this.logAction("admin.booking_status_updated", { bookingId, status }, bookingId);
    return booking;
  }

  async getAvailability() {
    const [timing] = await this.timingModel.find().sort({ createdAt: -1 }).limit(1).lean();
    const [globalAvailability] = await this.availabilityModel.find({ scope: "global" }).sort({ createdAt: -1 }).limit(1).lean();
    const closures = await this.closureModel.find().sort({ createdAt: -1 }).lean();
    const coupons = await this.couponModel.find().sort({ createdAt: -1 }).lean();
    return { timing, globalAvailability, closures, coupons };
  }

  async upsertTiming(payload: { openTime: string; closeTime: string; slotDurationMins?: number }) {
    const [timing] = await this.timingModel.find().sort({ createdAt: -1 }).limit(1).lean();
    if (!timing) {
      return this.timingModel.create(payload);
    }
    return this.timingModel.findByIdAndUpdate(timing._id, { $set: payload }, { new: true }).lean();
  }

  async createClosure(payload: {
    startDate: string;
    endDate?: string;
    entireDay?: boolean;
    startTime?: string;
    endTime?: string;
    reason?: string;
    displayReasonToCustomers?: boolean;
  }) {
    const startDate = String(payload.startDate || "").trim();
    const endDate = String(payload.endDate || payload.startDate || "").trim();
    const entireDay = payload.entireDay ?? true;
    const startTime = entireDay ? "" : String(payload.startTime || "").trim();
    const endTime = entireDay ? "" : String(payload.endTime || "").trim();

    if (!startDate) {
      throw new BadRequestException("Start date is required.");
    }
    if (!endDate) {
      throw new BadRequestException("End date is required.");
    }
    if (startDate > endDate) {
      throw new BadRequestException("Start date must be before end date.");
    }
    if (!entireDay) {
      if (!startTime || !endTime) {
        throw new BadRequestException("Start and end time are required for partial closures.");
      }
      if (startTime >= endTime) {
        throw new BadRequestException("Start time must be before end time.");
      }
    }

    return this.closureModel.create({
      startDate,
      endDate,
      entireDay,
      startTime,
      endTime,
      reason: payload.reason || "",
      displayReasonToCustomers: Boolean(payload.displayReasonToCustomers),
      active: true,
    });
  }

  async undoClosure(closureId: string) {
    const closure = await this.closureModel.findByIdAndUpdate(
      closureId,
      { $set: { active: false } },
      { new: true },
    ).lean();

    if (!closure) {
      throw new NotFoundException("Closure not found.");
    }

    return closure;
  }

  async createCoupon(payload: Partial<Coupon>) {
    const code = String(payload.code || "").trim().toUpperCase();
    if (!code) {
      throw new BadRequestException("Coupon code is required.");
    }

    const existing = await this.couponModel.findOne({ code }).lean();
    if (existing) {
      throw new BadRequestException("Coupon code already exists.");
    }

    return this.couponModel.create(this.normalizeCouponPayload({ ...payload, code }, true));
  }

  async listCoupons() {
    return this.couponModel.find().sort({ createdAt: -1 }).lean();
  }

  async getCoupon(code: string) {
    const coupon = await this.couponModel.findOne({ code: code.trim().toUpperCase() }).lean();
    if (!coupon) {
      throw new NotFoundException("Coupon not found.");
    }
    return coupon;
  }

  async updateCoupon(code: string, payload: Partial<Coupon>) {
    const normalizedCode = code.trim().toUpperCase();
    const existing = await this.couponModel.findOne({ code: normalizedCode });
    if (!existing) {
      throw new NotFoundException("Coupon not found.");
    }

    const next = this.normalizeCouponPayload({ ...existing.toObject(), ...payload, code: normalizedCode }, false);
    Object.assign(existing, next);
    await existing.save();
    return existing.toObject();
  }

  async toggleCoupon(code: string) {
    const coupon = await this.couponModel.findOne({ code: code.trim().toUpperCase() });
    if (!coupon) {
      throw new NotFoundException("Coupon not found.");
    }
    coupon.active = !coupon.active;
    await coupon.save();
    return coupon.toObject();
  }

  async deleteCoupon(code: string) {
    const normalizedCode = code.trim().toUpperCase();
    const deleted = await this.couponModel.findOneAndDelete({ code: normalizedCode }).lean();
    if (!deleted) {
      throw new NotFoundException("Coupon not found.");
    }
    return { success: true, code: normalizedCode };
  }

  private normalizeCouponPayload(payload: Partial<Coupon> & { code: string }, resetUsage: boolean) {
    const discountType = payload.discountType === "fixed" ? "fixed" : "percentage";
    const percentage = Math.max(0, Number(payload.percentage || 0));
    const fixedAmount = Math.max(0, Number(payload.fixedAmount || 0));
    const usageLimit = Math.max(0, Number(payload.usageLimit || 0));
    const perUserLimit = Math.max(1, Number(payload.perUserLimit || 1));
    const minimumAmount = Math.max(0, Number(payload.minimumAmount || 0));
    const maximumDiscount = Math.max(0, Number(payload.maximumDiscount || 0));
    const code = String(payload.code || "").trim().toUpperCase();
    const startDate = this.normalizeDateString(payload.startDate);
    const endDate = this.normalizeDateString(payload.endDate);

    if (!code) {
      throw new BadRequestException("Coupon code is required.");
    }
    if (discountType === "percentage" && (percentage <= 0 || percentage > 100)) {
      throw new BadRequestException("Percentage coupon must be between 1 and 100.");
    }
    if (discountType === "fixed" && fixedAmount <= 0) {
      throw new BadRequestException("Fixed coupon amount must be greater than 0.");
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException("Start date must be before end date.");
    }

    return {
      code,
      discountType,
      percentage: discountType === "percentage" ? percentage : 0,
      fixedAmount: discountType === "fixed" ? fixedAmount : 0,
      startDate,
      endDate,
      usageLimit,
      perUserLimit,
      minimumAmount,
      maximumDiscount,
      active: payload.active ?? true,
      usedBy: resetUsage ? [] : payload.usedBy || [],
      totalUsed: resetUsage ? 0 : Number(payload.totalUsed || 0),
    };
  }

  private normalizeDateString(value?: string) {
    if (!value) {
      return "";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException("Invalid coupon date.");
    }

    return parsed.toISOString();
  }

  async verifyCoupon(code: string, userId: string, amount: number) {
    const coupon = await this.couponModel.findOne({ code: code.trim().toUpperCase(), active: true }).lean();
    if (!coupon) return null;
    if (coupon.minimumAmount && amount < coupon.minimumAmount) return null;
    const usageByUser = coupon.usedBy.filter((item) => item === userId).length;
    if (coupon.perUserLimit && usageByUser >= coupon.perUserLimit) return null;
    if (coupon.usageLimit && coupon.totalUsed >= coupon.usageLimit) return null;
    const now = new Date();
    if (coupon.startDate && now < new Date(coupon.startDate)) return null;
    if (coupon.endDate && now > new Date(coupon.endDate)) return null;
    return coupon;
  }

  async applyCoupon(code: string, userId: string, amount: number) {
    const coupon = await this.verifyCoupon(code, userId, amount);
    if (!coupon) return null;

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = Math.floor((amount * coupon.percentage) / 100);
    } else {
      discount = coupon.fixedAmount;
    }
    if (coupon.maximumDiscount) {
      discount = Math.min(discount, coupon.maximumDiscount);
    }
    discount = Math.min(discount, amount);

    await this.couponModel.updateOne(
      { _id: coupon._id },
      { $push: { usedBy: userId }, $inc: { totalUsed: 1 } },
    );
    await this.logAction("coupon.applied", { code: coupon.code, bookingUserId: userId, amount, discount }, code);
    return { coupon, discount };
  }

  async scanQr(payload: { bookingId: string; qrToken: string }) {
    const validation = await this.bookingsService.validateQrToken(payload.bookingId, payload.qrToken);
    if (!validation.valid) {
      throw new BadRequestException("Invalid or expired QR code.");
    }

    const existing = await this.bookingModel.findOne({ bookingId: payload.bookingId }).lean();
    if (!existing) {
      throw new NotFoundException("Booking not found.");
    }

    if (existing.status === "checked_in" || existing.checkedInAt) {
      await this.logAction("admin.qr_scanned_duplicate", { bookingId: payload.bookingId }, payload.bookingId);
      return {
        ...existing,
        alreadyCheckedIn: true,
      };
    }

    const booking = await this.markBooking(payload.bookingId, "checked_in");
    await this.checkinModel.updateOne(
      { bookingId: payload.bookingId },
      {
        $set: {
          bookingId: payload.bookingId,
          staffId: "admin",
          checkedInByStaffId: "admin",
          status: "checked_in",
          checkedInAt: new Date(),
        },
      },
      { upsert: true },
    );
    await this.logAction("admin.qr_scanned", { bookingId: payload.bookingId }, payload.bookingId);
    return booking;
  }
}
