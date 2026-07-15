import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type BookingDocument = HydratedDocument<Booking>;

@Schema({ timestamps: true, collection: "bookings" })
export class Booking {
  @Prop({ required: true, unique: true, index: true })
  bookingId!: string;

  @Prop({ required: true })
  customerName!: string;

  @Prop({ default: "" })
  email!: string;

  @Prop({ default: "" })
  phone!: string;

  @Prop({ default: "customer" })
  source!: "customer" | "manual";

  @Prop({ default: "" })
  razorpayOrderId!: string;

  @Prop({ default: "" })
  razorpayPaymentId!: string;

  @Prop({ default: "" })
  razorpaySubscriptionId!: string;

  @Prop({ default: "" })
  paymentId!: string;

  @Prop({ default: "" })
  paymentMethod!: "razorpay" | "pay_later";

  @Prop({ default: "" })
  couponCode!: string;

  @Prop({ default: 0 })
  discountAmount!: number;

  @Prop({ default: 0 })
  totalAmount!: number;

  @Prop({ default: "" })
  qrCode!: string;

  @Prop({ default: "", select: false })
  accessKeyHash!: string;

  @Prop({ default: "", select: false })
  qrTokenHash!: string;

  @Prop({ default: null, type: Date })
  qrExpiresAt!: Date | null;

  @Prop({ required: true })
  slotId!: string;

  @Prop({ required: true })
  date!: string;

  @Prop({ required: true })
  time!: string;

  @Prop({ required: true })
  pax!: number;

  @Prop({ required: true, default: "confirmed" })
  status!:
    | "confirmed"
    | "pending"
    | "checked_in"
    | "cancelled"
    | "completed"
    | "no_show";

  @Prop({ required: true, default: "pending" })
  paymentStatus!: "pending" | "paid" | "failed";

  @Prop({ default: null, type: Date })
  checkedInAt!: Date | null;

  @Prop({ default: "" })
  checkedInByStaffId!: string;

  @Prop({ default: null, type: Date })
  completedAt!: Date | null;

  @Prop({ default: null, type: Date })
  noShowAt!: Date | null;

  @Prop({ default: null, type: Date })
  cancelledAt!: Date | null;

  @Prop({ default: "" })
  specialRequest!: string;

  @Prop({ default: "pending" })
  whatsappNotificationStatus!:
    | "pending"
    | "sent_to_meta"
    | "sent"
    | "delivered"
    | "read"
    | "failed"
    | "skipped";

  @Prop({ type: [String], default: [] })
  whatsappMessageIds!: string[];

  @Prop({ default: null, type: Date })
  whatsappNotificationSentAt!: Date | null;

  @Prop({ default: "" })
  whatsappNotificationError!: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
BookingSchema.index({ date: 1, time: 1, status: 1 });
BookingSchema.index({ slotId: 1, status: 1 });
