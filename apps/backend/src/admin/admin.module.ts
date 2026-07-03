import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AdminAuthController, AdminController, CouponsController } from "./admin.controller";
import { AdminAuthGuard } from "./admin.guard";
import { AdminService } from "./admin.service";
import { Booking, BookingSchema } from "../database/schemas/booking.schema";
import { Payment, PaymentSchema } from "../database/schemas/payment.schema";
import { Availability, AvailabilitySchema } from "../database/schemas/availability.schema";
import { RestaurantTiming, RestaurantTimingSchema } from "../database/schemas/restaurant-timing.schema";
import { Closure, ClosureSchema } from "../database/schemas/closure.schema";
import { Coupon, CouponSchema } from "../database/schemas/coupon.schema";
import { Checkin, CheckinSchema } from "../database/schemas/checkin.schema";
import { BookingsModule } from "../bookings/bookings.module";

@Module({
  imports: [
    ConfigModule,
    BookingsModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("jwtSecret") || "change-me",
      }),
    }),
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Availability.name, schema: AvailabilitySchema },
      { name: RestaurantTiming.name, schema: RestaurantTimingSchema },
      { name: Closure.name, schema: ClosureSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: Checkin.name, schema: CheckinSchema },
    ]),
  ],
  controllers: [AdminAuthController, AdminController, CouponsController],
  providers: [AdminService, AdminAuthGuard],
})
export class AdminModule {}
