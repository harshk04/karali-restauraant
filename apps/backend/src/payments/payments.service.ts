import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import { Model } from "mongoose";
import crypto from "crypto";
import Razorpay from "razorpay";
import { Booking, BookingDocument } from "../database/schemas/booking.schema";
import { Payment, PaymentDocument } from "../database/schemas/payment.schema";
import { Coupon, CouponDocument } from "../database/schemas/coupon.schema";
import { Plan, PlanDocument } from "../database/schemas/plan.schema";
import {
  Subscription,
  SubscriptionDocument,
} from "../database/schemas/subscription.schema";
import { User, UserDocument } from "../database/schemas/user.schema";
import { BookingsService } from "../bookings/bookings.service";
import { PaymentsGateway } from "./payments.gateway";

type CreateRazorpayOrderDto = {
  customerName: string;
  email?: string;
  phone?: string;
  slotId: string;
  pax: number;
  specialRequest?: string;
  amount: number;
  userId?: string;
  attemptId?: string;
  couponCode?: string;
};

type VerifyRazorpayPaymentDto = {
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  userId?: string;
};

type WebhookPayload = {
  event?: string;
  payload?: Record<string, { entity?: any }>;
  created_at?: number;
};

@Injectable()
export class PaymentsService implements OnModuleInit {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay?: Razorpay;
  private readonly currency = "INR";

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<CouponDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Plan.name) private readonly planModel: Model<PlanDocument>,
    private readonly bookingsService: BookingsService,
    private readonly paymentsGateway: PaymentsGateway,
  ) {}

  onModuleInit() {
    const keyId = this.configService.get<string>("razorpayKeyId");
    const keySecret = this.configService.get<string>("razorpayKeySecret");

    if (
      !keyId ||
      !keySecret ||
      keyId.includes("replace-with") ||
      keySecret.includes("replace-with")
    ) {
      this.logger.warn(
        "Razorpay credentials are missing. Payment creation and verification are disabled until credentials are configured.",
      );
      return;
    }

    this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  private requireRazorpay() {
    if (!this.razorpay) {
      throw new ServiceUnavailableException(
        "Razorpay is not configured on this server.",
      );
    }

    return this.razorpay;
  }

  private requireWebhookSecret() {
    const secret = this.configService.get<string>("razorpayWebhookSecret");
    if (!secret || secret.includes("replace-with")) {
      throw new Error("RAZORPAY_WEBHOOK_SECRET is required.");
    }
    return secret;
  }

  private stableIdempotencyKey(dto: CreateRazorpayOrderDto) {
    return crypto
      .createHash("sha256")
      .update(
        JSON.stringify({
          customerName: dto.customerName.trim().toLowerCase(),
          email: (dto.email || "").trim().toLowerCase(),
          phone: (dto.phone || "").trim(),
          slotId: dto.slotId.trim(),
          pax: dto.pax,
          amount: dto.amount,
          specialRequest: (dto.specialRequest || "").trim().toLowerCase(),
          userId: dto.userId || "u_1",
          attemptId: dto.attemptId || "initial",
        }),
      )
      .digest("hex");
  }

  private bookingIdFromKey(key: string) {
    return `KR-${key.slice(0, 8).toUpperCase()}`;
  }

  private async resolveCoupon(
    code: string | undefined,
    userId: string,
    amountInRupees: number,
  ) {
    if (!code) {
      return { discount: 0, coupon: null as any };
    }

    const coupon = await this.couponModel
      .findOne({ code: code.trim().toUpperCase(), active: true })
      .lean();
    if (!coupon) {
      return { discount: 0, coupon: null as any };
    }

    const now = new Date();
    if (coupon.startDate && now < new Date(coupon.startDate)) {
      return { discount: 0, coupon: null as any };
    }
    if (coupon.endDate && now > new Date(coupon.endDate)) {
      return { discount: 0, coupon: null as any };
    }
    if (coupon.minimumAmount && amountInRupees < coupon.minimumAmount) {
      return { discount: 0, coupon: null as any };
    }
    if (coupon.usageLimit && coupon.totalUsed >= coupon.usageLimit) {
      return { discount: 0, coupon: null as any };
    }
    if (
      coupon.perUserLimit &&
      coupon.usedBy.filter((entry: string) => entry === userId).length >=
        coupon.perUserLimit
    ) {
      return { discount: 0, coupon: null as any };
    }

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = Math.floor((amountInRupees * coupon.percentage) / 100);
    } else {
      discount = coupon.fixedAmount;
    }
    if (coupon.maximumDiscount) {
      discount = Math.min(discount, coupon.maximumDiscount);
    }
    discount = Math.min(discount, amountInRupees);
    return { discount, coupon };
  }

  private async ensureUser(dto: {
    userId?: string;
    customerName: string;
    email?: string;
    phone?: string;
  }) {
    const email = (dto.email || "").trim().toLowerCase();
    const userId = dto.userId || email || "u_1";
    const existing = await this.userModel
      .findOne({ email: email || `${userId}@karali.local` })
      .lean();

    if (existing) {
      return existing;
    }

    const created = await this.userModel.create({
      name: dto.customerName,
      email: email || `${userId}@karali.local`,
      phone: dto.phone || "",
      role: "customer",
      status: "active",
      accessAllowed: false,
      planStatus: "inactive",
    });

    return created.toObject();
  }

  async createRazorpayOrder(dto: CreateRazorpayOrderDto) {
    if (!dto.customerName || !dto.slotId || !dto.amount) {
      throw new BadRequestException("Missing booking/payment details.");
    }

    const normalized = {
      ...dto,
      customerName: dto.customerName.trim(),
      email: dto.email?.trim(),
      phone: dto.phone?.trim(),
      attemptId: dto.attemptId?.trim(),
      couponCode: dto.couponCode?.trim(),
    };
    const amountInRupees = Number(normalized.amount);
    const couponContext = await this.resolveCoupon(
      normalized.couponCode,
      dto.userId || normalized.email || "guest",
      amountInRupees,
    );
    const payableAmount = Math.max(
      0,
      Math.round((amountInRupees - couponContext.discount) * 100),
    );
    const idempotencyKey = this.stableIdempotencyKey(normalized);
    const existingPayment = await this.paymentModel
      .findOne({ idempotencyKey })
      .lean();

    if (existingPayment?.razorpayOrderId) {
      const booking = await this.bookingsService.findByBookingId(
        existingPayment.bookingId,
      );
      return {
        status: existingPayment.paymentStatus,
        bookingId: existingPayment.bookingId,
        userId: existingPayment.userId,
        paymentId: String(existingPayment._id),
        orderId: existingPayment.razorpayOrderId,
        amount: existingPayment.amount,
        currency: existingPayment.currency,
        keyId: this.configService.get<string>("razorpayKeyId"),
        customerName: booking?.customerName ?? normalized.customerName,
        notes: {
          bookingId: existingPayment.bookingId,
          idempotencyKey,
        },
      };
    }

    const user = await this.ensureUser({
      userId: dto.userId,
      customerName: normalized.customerName,
      email: normalized.email,
      phone: normalized.phone,
    });
    const bookingId = this.bookingIdFromKey(idempotencyKey);
    await this.bookingsService.createPending({
      bookingId,
      customerName: normalized.customerName,
      email: normalized.email,
      phone: normalized.phone,
      slotId: normalized.slotId,
      pax: normalized.pax,
      specialRequest: normalized.specialRequest,
      paymentMethod: "razorpay",
      couponCode: normalized.couponCode || "",
      discountAmount: couponContext.discount,
      totalAmount: Math.max(0, amountInRupees - couponContext.discount),
    });

    const razorpay = this.requireRazorpay();
    const order = (await razorpay.orders.create({
      amount: payableAmount,
      currency: this.currency,
      receipt: bookingId,
      payment_capture: true,
      notes: {
        bookingId,
        userId: String(user._id),
        idempotencyKey,
        slotId: normalized.slotId,
        couponCode: normalized.couponCode || "",
      },
    })) as any;

    const payment = await this.paymentModel.create({
      idempotencyKey,
      userId: String(user._id),
      bookingId,
      amount: payableAmount,
      currency: this.currency,
      paymentMethod: "razorpay",
      razorpayOrderId: order.id,
      paymentStatus: "created",
      metadata: {
        customerName: normalized.customerName,
        email: normalized.email || "",
        phone: normalized.phone || "",
        slotId: normalized.slotId,
        pax: normalized.pax,
        specialRequest: normalized.specialRequest || "",
        couponCode: normalized.couponCode || "",
        discountAmount: couponContext.discount,
        totalAmount: payableAmount,
      },
    });

    await this.bookingModel.updateOne(
      { bookingId },
      {
        $set: {
          paymentId: String(payment._id),
          razorpayOrderId: order.id,
          paymentStatus: "pending",
          status: "pending",
        },
      },
    );

    this.paymentsGateway.emitPaymentProcessing(String(user._id));

    return {
      paymentId: String(payment._id),
      bookingId,
      userId: String(user._id),
      orderId: order.id,
      amount: payment.amount,
      currency: payment.currency,
      keyId: this.configService.get<string>("razorpayKeyId"),
      customerName: normalized.customerName,
      notes: {
        bookingId,
        idempotencyKey,
      },
    };
  }

  async verifyRazorpayPayment(dto: VerifyRazorpayPaymentDto) {
    const payment = await this.paymentModel.findOne({
      razorpayOrderId: dto.razorpayOrderId,
      bookingId: dto.bookingId,
    });
    if (!payment) {
      throw new BadRequestException("Payment record not found.");
    }

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        this.configService.get<string>("razorpayKeySecret") || "",
      )
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== dto.razorpaySignature) {
      await this.paymentModel.updateOne(
        { _id: payment._id },
        {
          $set: { paymentStatus: "failed", failureReason: "Invalid signature" },
        },
      );
      await this.bookingsService.markPaymentFailed(dto.bookingId);
      this.paymentsGateway.emitPaymentFailed(payment.userId, {
        paymentId: String(payment._id),
        reason: "Invalid signature",
      });
      throw new BadRequestException("Invalid Razorpay signature.");
    }

    let fetchedPayment: any;
    try {
      fetchedPayment = await this.requireRazorpay().payments.fetch(
        dto.razorpayPaymentId,
      );
    } catch (error) {
      this.logger.warn(
        `Razorpay payment fetch failed for ${dto.razorpayPaymentId}: ${(error as Error).message}`,
      );
    }

    if (
      fetchedPayment?.amount &&
      Number(fetchedPayment.amount) !== Number(payment.amount)
    ) {
      throw new BadRequestException("Payment amount mismatch.");
    }

    await this.paymentModel.updateOne(
      { _id: payment._id },
      {
        $set: {
          paymentStatus: "captured",
          razorpayPaymentId: dto.razorpayPaymentId,
          razorpaySignature: dto.razorpaySignature,
          transactionDate: new Date().toISOString(),
        },
      },
    );

    const booking = await this.bookingsService.markPaymentPaid(dto.bookingId, {
      razorpayOrderId: dto.razorpayOrderId,
      razorpayPaymentId: dto.razorpayPaymentId,
      paymentId: String(payment._id),
    });

    await this.userModel.updateOne(
      { _id: payment.userId },
      {
        $set: {
          lastPaymentStatus: "paid",
          accessAllowed: true,
          lastSyncedAt: new Date(),
        },
      },
    );

    this.paymentsGateway.emitPaymentSuccess(payment.userId, {
      paymentId: dto.razorpayPaymentId,
      orderId: dto.razorpayOrderId,
      status: "captured",
    });

    return {
      success: true,
      bookingId: booking?.bookingId ?? dto.bookingId,
      paymentId: dto.razorpayPaymentId,
      orderId: dto.razorpayOrderId,
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const secret = this.requireWebhookSecret();
    const computed = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (computed !== signature) {
      throw new BadRequestException("Invalid webhook signature");
    }

    const payload = JSON.parse(rawBody.toString("utf8")) as WebhookPayload;
    const eventName = payload.event || "unknown";
    const eventId = crypto.createHash("sha256").update(rawBody).digest("hex");
    const paymentEntity = payload.payload?.payment?.entity;
    const subscriptionEntity = payload.payload?.subscription?.entity;
    const invoiceEntity = payload.payload?.invoice?.entity;

    const targetPayment =
      paymentEntity &&
      (await this.paymentModel.findOne({
        $or: [
          { razorpayPaymentId: paymentEntity.id },
          { razorpayOrderId: paymentEntity.order_id },
          { razorpaySubscriptionId: paymentEntity.subscription_id },
        ],
      }));

    if (
      targetPayment &&
      targetPayment.webhookEvents.some(
        (entry: { eventId: string }) => entry.eventId === eventId,
      )
    ) {
      return { ok: true, duplicate: true };
    }

    if (targetPayment) {
      targetPayment.webhookEvents.push({
        eventId,
        event: eventName,
        receivedAt: new Date().toISOString(),
        payload,
      } as never);
      await targetPayment.save();
    }

    if (
      eventName === "payment.authorized" ||
      eventName === "payment.captured" ||
      eventName === "invoice.paid"
    ) {
      if (targetPayment) {
        targetPayment.paymentStatus = "captured";
        targetPayment.razorpayPaymentId =
          paymentEntity?.id || targetPayment.razorpayPaymentId;
        targetPayment.transactionDate = new Date().toISOString();
        await targetPayment.save();
        await this.bookingsService.markPaymentPaid(targetPayment.bookingId, {
          razorpayOrderId: targetPayment.razorpayOrderId,
          razorpayPaymentId: targetPayment.razorpayPaymentId,
          paymentId: String(targetPayment._id),
          razorpaySubscriptionId:
            targetPayment.razorpaySubscriptionId || undefined,
        });
        await this.userModel.updateOne(
          { _id: targetPayment.userId },
          {
            $set: {
              lastPaymentStatus: "paid",
              accessAllowed: true,
              lastSyncedAt: new Date(),
            },
          },
        );
        this.paymentsGateway.emitPaymentSuccess(targetPayment.userId, {
          paymentId: targetPayment.razorpayPaymentId,
          orderId: targetPayment.razorpayOrderId,
          subscriptionId: targetPayment.razorpaySubscriptionId || undefined,
          status: "captured",
          nextBillingDate: null,
        });
      }
    }

    if (eventName === "payment.failed") {
      if (targetPayment) {
        targetPayment.paymentStatus = "failed";
        targetPayment.failureReason =
          paymentEntity?.error_description ||
          paymentEntity?.error_reason ||
          "Payment failed";
        await targetPayment.save();
        await this.bookingsService.markPaymentFailed(targetPayment.bookingId);
        await this.userModel.updateOne(
          { _id: targetPayment.userId },
          {
            $set: {
              lastPaymentStatus: "failed",
              accessAllowed: false,
              lastSyncedAt: new Date(),
            },
          },
        );
        this.paymentsGateway.emitPaymentFailed(targetPayment.userId, {
          paymentId:
            targetPayment.razorpayPaymentId ||
            paymentEntity?.id ||
            String(targetPayment._id),
          reason: targetPayment.failureReason,
        });
      }
    }

    if (eventName.startsWith("subscription.")) {
      const subscriptionId = subscriptionEntity?.id;
      if (subscriptionId) {
        let subscription = await this.subscriptionModel.findOne({
          razorpaySubscriptionId: subscriptionId,
        });
        if (!subscription) {
          subscription = await this.subscriptionModel.create({
            subscriptionId,
            userId: targetPayment?.userId || "u_1",
            planId: "",
            razorpaySubscriptionId: subscriptionId,
            accessAllowed: true,
            status: "active",
          });
        }

        subscription.status =
          eventName === "subscription.cancelled"
            ? "cancelled"
            : eventName === "subscription.halted"
              ? "halted"
              : eventName === "subscription.completed"
                ? "completed"
                : eventName === "subscription.pending"
                  ? "pending"
                  : "active";
        subscription.accessAllowed = ![
          "halted",
          "cancelled",
          "expired",
        ].includes(subscription.status);
        subscription.currentPeriodEnd = subscriptionEntity?.current_end
          ? new Date(subscriptionEntity.current_end * 1000)
          : subscription.currentPeriodEnd;
        subscription.nextBillingDate = subscriptionEntity?.charge_at
          ? new Date(subscriptionEntity.charge_at * 1000)
          : subscription.nextBillingDate;
        await subscription.save();

        await this.userModel.updateOne(
          { _id: subscription.userId },
          {
            $set: {
              planStatus:
                subscription.status === "active"
                  ? "active"
                  : subscription.status === "pending"
                    ? "past_due"
                    : subscription.status,
              accessAllowed: subscription.accessAllowed,
              currentPeriodEnd: subscription.currentPeriodEnd,
              nextBillingDate: subscription.nextBillingDate,
              razorpaySubscriptionId: subscription.razorpaySubscriptionId,
              lastSyncedAt: new Date(),
            },
          },
        );

        if (subscription.accessAllowed) {
          this.paymentsGateway.emitSubscriptionUpdated(
            String(subscription.userId),
            {
              planStatus: subscription.status,
              currentPeriodEnd:
                subscription.currentPeriodEnd?.toISOString() || null,
              nextBillingDate:
                subscription.nextBillingDate?.toISOString() || null,
            },
          );
        } else {
          this.paymentsGateway.emitSubscriptionExpired(
            String(subscription.userId),
            { reason: `subscription.${eventName.split(".")[1]}` },
          );
        }
      }
    }

    if (eventName === "invoice.payment_failed") {
      if (targetPayment) {
        await this.userModel.updateOne(
          { _id: targetPayment.userId },
          {
            $set: {
              accessAllowed: false,
              planStatus: "past_due",
              lastPaymentStatus: "failed",
            },
          },
        );
      }
    }

    if (invoiceEntity?.id && targetPayment) {
      targetPayment.invoiceId = invoiceEntity.id;
      await targetPayment.save();
    }

    return { ok: true };
  }

  @Cron("0 2 * * *")
  async reconcileSubscriptions() {
    if (!this.razorpay) {
      this.logger.warn(
        "Skipping subscription reconciliation because Razorpay is not configured.",
      );
      return;
    }

    const activeSubscriptions = await this.subscriptionModel.find({
      razorpaySubscriptionId: { $ne: "" },
      status: { $in: ["active", "pending", "halted"] },
    });

    for (const subscription of activeSubscriptions) {
      try {
        const remote = await this.requireRazorpay().subscriptions.fetch(
          subscription.razorpaySubscriptionId,
        );
        const nextBillingDate = remote.charge_at
          ? new Date(remote.charge_at * 1000)
          : subscription.nextBillingDate;
        const currentPeriodEnd = remote.current_end
          ? new Date(remote.current_end * 1000)
          : subscription.currentPeriodEnd;
        const status = remote.status as Subscription["status"];
        subscription.status = status;
        subscription.nextBillingDate = nextBillingDate || null;
        subscription.currentPeriodEnd = currentPeriodEnd || null;
        subscription.accessAllowed = ["active", "authenticated"].includes(
          remote.status,
        );
        await subscription.save();

        await this.userModel.updateOne(
          { _id: subscription.userId },
          {
            $set: {
              planStatus: subscription.accessAllowed ? "active" : "expired",
              accessAllowed: subscription.accessAllowed,
              currentPeriodEnd: subscription.currentPeriodEnd,
              nextBillingDate: subscription.nextBillingDate,
              lastSyncedAt: new Date(),
            },
          },
        );

        this.paymentsGateway.emitSubscriptionUpdated(
          String(subscription.userId),
          {
            planStatus: subscription.status,
            currentPeriodEnd:
              subscription.currentPeriodEnd?.toISOString() || null,
            nextBillingDate:
              subscription.nextBillingDate?.toISOString() || null,
          },
        );
      } catch (error) {
        this.logger.warn(
          `Failed to reconcile subscription ${subscription.razorpaySubscriptionId}: ${(error as Error).message}`,
        );
      }
    }
  }
}
