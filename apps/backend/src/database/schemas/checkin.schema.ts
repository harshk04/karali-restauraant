import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type CheckinDocument = HydratedDocument<Checkin>;

@Schema({ timestamps: true, collection: "checkins" })
export class Checkin {
  @Prop({ required: true, unique: true, index: true })
  bookingId!: string;

  @Prop({ required: true })
  staffId!: string;

  @Prop({ required: true, default: "checked_in" })
  status!: "checked_in" | "completed" | "no_show";

  @Prop({ default: null, type: Date })
  checkedInAt!: Date | null;
}

export const CheckinSchema = SchemaFactory.createForClass(Checkin);
