import { Body, Controller, Post } from "@nestjs/common";
import { CheckinsService } from "./checkins.service";

class CheckinDto {
  bookingId!: string;
  staffId!: string;
}

@Controller("checkins")
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  @Post()
  create(@Body() dto: CheckinDto) {
    return this.checkinsService.create(dto);
  }
}
