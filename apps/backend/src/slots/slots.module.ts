import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SlotsController } from "./slots.controller";
import { SlotsService } from "./slots.service";
import { Booking, BookingSchema } from "../database/schemas/booking.schema";
import { Availability, AvailabilitySchema } from "../database/schemas/availability.schema";
import { RestaurantTiming, RestaurantTimingSchema } from "../database/schemas/restaurant-timing.schema";
import { Closure, ClosureSchema } from "../database/schemas/closure.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Availability.name, schema: AvailabilitySchema },
      { name: RestaurantTiming.name, schema: RestaurantTimingSchema },
      { name: Closure.name, schema: ClosureSchema },
    ]),
  ],
  controllers: [SlotsController],
  providers: [SlotsService],
  exports: [SlotsService],
})
export class SlotsModule {}
