import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type StaffDocument = HydratedDocument<Staff>;

@Schema({ timestamps: true, collection: "staff" })
export class Staff {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, index: true })
  username!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ default: "" })
  mobile!: string;

  @Prop({ default: "" })
  email!: string;

  @Prop({ default: "" })
  designation!: string;

  @Prop({ required: true, default: "staff" })
  role!: "staff";

  @Prop({ required: true, default: "active" })
  status!: "active" | "inactive";

  @Prop({ default: null, type: Date })
  lastLogin!: Date | null;

  @Prop({ default: null, type: Date })
  deletedAt!: Date | null;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);
StaffSchema.index({ email: 1 }, { sparse: true });
