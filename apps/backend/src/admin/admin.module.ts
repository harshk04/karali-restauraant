import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";
import { AdminAuthController, AdminController, CouponsController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { Booking, BookingSchema } from "../database/schemas/booking.schema";
import { Payment, PaymentSchema } from "../database/schemas/payment.schema";
import { Availability, AvailabilitySchema } from "../database/schemas/availability.schema";
import { RestaurantTiming, RestaurantTimingSchema } from "../database/schemas/restaurant-timing.schema";
import { Closure, ClosureSchema } from "../database/schemas/closure.schema";
import { Coupon, CouponSchema } from "../database/schemas/coupon.schema";
import { Checkin, CheckinSchema } from "../database/schemas/checkin.schema";
import { BookingsModule } from "../bookings/bookings.module";
import { AuditLog, AuditLogSchema } from "../database/schemas/audit-log.schema";
import { SessionAuthModule } from "../common/auth/session-auth.module";

@Module({
  imports: [
    ConfigModule,
    BookingsModule,
    SessionAuthModule,
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Availability.name, schema: AvailabilitySchema },
      { name: RestaurantTiming.name, schema: RestaurantTimingSchema },
      { name: Closure.name, schema: ClosureSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: Checkin.name, schema: CheckinSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [AdminAuthController, AdminController, CouponsController],
  providers: [AdminService],
})
export class AdminModule {}
