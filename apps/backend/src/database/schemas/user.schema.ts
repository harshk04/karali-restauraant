import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: "users" })
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, index: true })
  email!: string;

  @Prop({ default: "" })
  phone!: string;

  @Prop({ default: "" })
  password!: string;

  @Prop({ required: true, default: "customer" })
  role!: "customer" | "reception_staff" | "manager" | "admin" | "super_admin";

  @Prop({ required: true, default: "active" })
  status!: "active" | "inactive" | "suspended";

  @Prop({ default: "" })
  currentPlan!: string;

  @Prop({ default: "inactive" })
  planStatus!: "inactive" | "active" | "expired" | "past_due" | "cancelled";

  @Prop({ default: false })
  accessAllowed!: boolean;

  @Prop({ default: null, type: Date })
  currentPeriodStart!: Date | null;

  @Prop({ default: null, type: Date })
  currentPeriodEnd!: Date | null;

  @Prop({ default: null, type: Date })
  nextBillingDate!: Date | null;

  @Prop({ default: "" })
  razorpaySubscriptionId!: string;

  @Prop({ default: "" })
  razorpayCustomerId!: string;

  @Prop({ default: "" })
  lastPaymentStatus!: string;

  @Prop({ default: null, type: Date })
  lastSyncedAt!: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
