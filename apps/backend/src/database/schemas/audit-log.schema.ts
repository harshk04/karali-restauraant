import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: true, collection: "audit_logs" })
export class AuditLog {
  @Prop({ required: true })
  actorId!: string;

  @Prop({ required: true })
  actorRole!: string;

  @Prop({ required: true })
  action!: string;

  @Prop({ default: "" })
  targetId!: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata!: Record<string, unknown>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
