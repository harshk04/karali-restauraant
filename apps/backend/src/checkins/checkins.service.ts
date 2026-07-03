import { Injectable } from "@nestjs/common";

@Injectable()
export class CheckinsService {
  create(dto: { bookingId: string; staffId: string }) {
    return {
      id: "checkin_1",
      checkedInAt: new Date().toISOString(),
      ...dto,
    };
  }
}
