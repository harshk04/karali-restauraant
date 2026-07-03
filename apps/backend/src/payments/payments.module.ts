import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ScheduleModule } from "@nestjs/schedule";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { Booking, BookingSchema } from "../database/schemas/booking.schema";
import { Payment, PaymentSchema } from "../database/schemas/payment.schema";
import { Coupon, CouponSchema } from "../database/schemas/coupon.schema";
import { Plan, PlanSchema } from "../database/schemas/plan.schema";
import { Subscription, SubscriptionSchema } from "../database/schemas/subscription.schema";
import { User, UserSchema } from "../database/schemas/user.schema";
import { BookingsModule } from "../bookings/bookings.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PaymentsGateway } from "./payments.gateway";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BookingsModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: User.name, schema: UserSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Plan.name, schema: PlanSchema },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsGateway],
  exports: [PaymentsService, PaymentsGateway],
})
export class PaymentsModule {}
