import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";
import { Booking, BookingSchema } from "../database/schemas/booking.schema";
import { Checkin, CheckinSchema } from "../database/schemas/checkin.schema";
import { AuditLog, AuditLogSchema } from "../database/schemas/audit-log.schema";
import { Staff, StaffSchema } from "../database/schemas/staff.schema";
import { StaffAdminController, StaffAuthController, StaffPortalController } from "./staff.controller";
import { StaffService } from "./staff.service";
import { SessionAuthModule } from "../common/auth/session-auth.module";

@Module({
  imports: [
    ConfigModule,
    SessionAuthModule,
    MongooseModule.forFeature([
      { name: Staff.name, schema: StaffSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Checkin.name, schema: CheckinSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [StaffAuthController, StaffPortalController, StaffAdminController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
