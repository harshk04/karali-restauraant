import { Controller, Get } from "@nestjs/common";

@Controller("staff")
export class StaffController {
  @Get("dashboard")
  dashboard() {
    return {
      todaysBookings: 124,
      occupiedNow: 82,
      arrivingSoon: 18,
      offlineQueue: 0,
    };
  }
}
