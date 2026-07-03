import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: true, collection: "payments" })
export class PaymentWebhookEvent {
  @Prop({ required: true })
  eventId!: string;

  @Prop({ required: true })
  event!: string;

  @Prop({ required: true })
  receivedAt!: string;

  @Prop({ default: {}, type: Object })
  payload!: Record<string, unknown>;
}

const PaymentWebhookEventSchema = SchemaFactory.createForClass(PaymentWebhookEvent);

@Schema({ timestamps: true, collection: "payments" })
export class Payment {
  @Prop({ required: true, unique: true, index: true })
  idempotencyKey!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  bookingId!: string;

  @Prop({ required: false, default: "" })
  planId!: string;

  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true, default: "INR" })
  currency!: string;

  @Prop({ required: true, default: "razorpay" })
  paymentMethod!: string;

  @Prop({ default: "" })
  razorpayOrderId!: string;

  @Prop({ default: "" })
  razorpayPaymentId!: string;

  @Prop({ default: "" })
  razorpaySubscriptionId!: string;

  @Prop({ default: "" })
  razorpaySignature!: string;

  @Prop({ default: "" })
  invoiceId!: string;

  @Prop({ default: "" })
  transactionDate!: string;

  @Prop({ default: {}, type: Object })
  metadata!: Record<string, unknown>;

  @Prop({
    type: [PaymentWebhookEventSchema],
    default: [],
  })
  webhookEvents!: PaymentWebhookEvent[];

  @Prop({ default: "created" })
  paymentStatus!: "created" | "authorized" | "captured" | "failed" | "refunded";

  @Prop({ default: "" })
  failureReason!: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
