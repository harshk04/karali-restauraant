import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type PlanDocument = HydratedDocument<Plan>;

@Schema({ timestamps: true, collection: "plans" })
export class Plan {
  @Prop({ required: true, unique: true, index: true })
  planCode!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true, default: "INR" })
  currency!: string;

  @Prop({ required: true, default: "monthly" })
  interval!: "monthly" | "yearly";

  @Prop({ default: [] })
  features!: string[];

  @Prop({ default: true })
  active!: boolean;

  @Prop({ default: "" })
  razorpayPlanId!: string;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
