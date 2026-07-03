import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { BookingsController } from "./bookings.controller";
import { BookingsService } from "./bookings.service";
import { Booking, BookingSchema } from "../database/schemas/booking.schema";
import { SlotsModule } from "../slots/slots.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]), SlotsModule, NotificationsModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
