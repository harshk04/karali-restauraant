import { Controller, Get, Query } from "@nestjs/common";
import { SlotsService } from "./slots.service";

@Controller("slots")
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get("calendar")
  calendar() {
    return this.slotsService.calendar();
  }

  @Get()
  list(@Query("date") date?: string) {
    const selectedDate = date || new Date().toISOString().slice(0, 10);
    return this.slotsService.slots(selectedDate);
  }
}
