import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { BookingsController } from "./bookings.controller";
import { BookingsService } from "./bookings.service";
import { Booking, BookingSchema } from "../database/schemas/booking.schema";
import { SlotOccupancy, SlotOccupancySchema } from "../database/schemas/slot-occupancy.schema";
import { SlotsModule } from "../slots/slots.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { SessionAuthModule } from "../common/auth/session-auth.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: SlotOccupancy.name, schema: SlotOccupancySchema },
    ]),
    SlotsModule,
    NotificationsModule,
    SessionAuthModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
