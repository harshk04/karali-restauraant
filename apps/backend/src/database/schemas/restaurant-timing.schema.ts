import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type RestaurantTimingDocument = HydratedDocument<RestaurantTiming>;

@Schema({ timestamps: true, collection: "restaurant_timings" })
export class RestaurantTiming {
  @Prop({ default: "11:00" })
  openTime!: string;

  @Prop({ default: "22:00" })
  closeTime!: string;

  @Prop({ default: 60 })
  slotDurationMins!: number;

  @Prop({ default: true })
  active!: boolean;
}

export const RestaurantTimingSchema = SchemaFactory.createForClass(RestaurantTiming);
