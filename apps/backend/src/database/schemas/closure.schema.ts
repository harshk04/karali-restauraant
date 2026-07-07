import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ClosureDocument = HydratedDocument<Closure>;

@Schema({ timestamps: true, collection: "closures" })
export class Closure {
  @Prop({ required: true })
  startDate!: string;

  @Prop({ required: true })
  endDate!: string;

  @Prop({ default: true })
  entireDay!: boolean;

  @Prop({ default: "" })
  startTime!: string;

  @Prop({ default: "" })
  endTime!: string;

  @Prop({ default: "" })
  reason!: string;

  @Prop({ default: false })
  displayReasonToCustomers!: boolean;

  @Prop({ default: true })
  active!: boolean;
}

export const ClosureSchema = SchemaFactory.createForClass(Closure);
