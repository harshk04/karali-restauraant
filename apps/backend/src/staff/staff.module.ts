import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AdminAuthGuard } from "../admin/admin.guard";
import { Booking, BookingSchema } from "../database/schemas/booking.schema";
import { Checkin, CheckinSchema } from "../database/schemas/checkin.schema";
import { AuditLog, AuditLogSchema } from "../database/schemas/audit-log.schema";
import { Staff, StaffSchema } from "../database/schemas/staff.schema";
import { StaffAdminController, StaffAuthController, StaffPortalController } from "./staff.controller";
import { StaffAuthGuard } from "./staff.guard";
import { StaffService } from "./staff.service";

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("jwtSecret") || "change-me",
      }),
    }),
    MongooseModule.forFeature([
      { name: Staff.name, schema: StaffSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Checkin.name, schema: CheckinSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [StaffAuthController, StaffPortalController, StaffAdminController],
  providers: [StaffService, StaffAuthGuard, AdminAuthGuard],
  exports: [StaffService],
})
export class StaffModule {}
