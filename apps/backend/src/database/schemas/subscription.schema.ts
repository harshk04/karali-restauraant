import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema({ timestamps: true, collection: "subscriptions" })
export class Subscription {
  @Prop({ required: true, unique: true, index: true })
  subscriptionId!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  planId!: string;

  @Prop({ required: true, default: "active" })
  status!: "active" | "pending" | "halted" | "cancelled" | "completed" | "expired";

  @Prop({ default: true })
  accessAllowed!: boolean;

  @Prop({ default: "" })
  razorpaySubscriptionId!: string;

  @Prop({ default: "" })
  razorpayCustomerId!: string;

  @Prop({ default: "" })
  razorpayInvoiceId!: string;

  @Prop({ default: null, type: Date })
  currentPeriodStart!: Date | null;

  @Prop({ default: null, type: Date })
  currentPeriodEnd!: Date | null;

  @Prop({ default: null, type: Date })
  nextBillingDate!: Date | null;

  @Prop({ default: {}, type: Object })
  metadata!: Record<string, unknown>;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
