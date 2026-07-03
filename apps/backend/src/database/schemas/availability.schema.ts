import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type AvailabilityDocument = HydratedDocument<Availability>;

@Schema({ timestamps: true, collection: "availability" })
export class Availability {
  @Prop({ required: true, default: "global" })
  scope!: "global" | "date" | "slot" | "closure";

  @Prop({ default: "" })
  date!: string;

  @Prop({ default: "" })
  startTime!: string;

  @Prop({ default: "" })
  endTime!: string;

  @Prop({ default: [] })
  blockedSlots!: string[];

  @Prop({ default: 6 })
  maxBookingsPerSlot!: number;

  @Prop({ default: 20 })
  maxGuestsPerSlot!: number;

  @Prop({ default: "" })
  reason!: string;

  @Prop({ default: true })
  active!: boolean;
}

export const AvailabilitySchema = SchemaFactory.createForClass(Availability);
