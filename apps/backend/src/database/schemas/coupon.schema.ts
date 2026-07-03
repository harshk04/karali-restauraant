import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type CouponDocument = HydratedDocument<Coupon>;

@Schema({ timestamps: true, collection: "coupons" })
export class Coupon {
  @Prop({ required: true, unique: true, index: true })
  code!: string;

  @Prop({ required: true, default: "percentage" })
  discountType!: "percentage" | "fixed";

  @Prop({ required: true, default: 0 })
  percentage!: number;

  @Prop({ required: true, default: 0 })
  fixedAmount!: number;

  @Prop({ default: "" })
  startDate!: string;

  @Prop({ default: "" })
  endDate!: string;

  @Prop({ default: 0 })
  usageLimit!: number;

  @Prop({ default: 1 })
  perUserLimit!: number;

  @Prop({ default: 0 })
  minimumAmount!: number;

  @Prop({ default: 0 })
  maximumDiscount!: number;

  @Prop({ default: true })
  active!: boolean;

  @Prop({ default: [] })
  usedBy!: string[];

  @Prop({ default: 0 })
  totalUsed!: number;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
