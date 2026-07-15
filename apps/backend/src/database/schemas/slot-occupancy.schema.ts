import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type SlotOccupancyDocument = HydratedDocument<SlotOccupancy>;

@Schema({ timestamps: true, collection: "slot_occupancies" })
export class SlotOccupancy {
  @Prop({ required: true, unique: true, index: true })
  slotId!: string;

  @Prop({ required: true, index: true })
  date!: string;

  @Prop({ required: true })
  time!: string;

  @Prop({ default: 0 })
  reservationCount!: number;

  @Prop({ default: 0 })
  guestCount!: number;

  @Prop({ default: 0 })
  capacityBookings!: number;
}

export const SlotOccupancySchema = SchemaFactory.createForClass(SlotOccupancy);
SlotOccupancySchema.index({ date: 1, time: 1 });
