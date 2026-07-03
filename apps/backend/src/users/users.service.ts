import { Injectable } from "@nestjs/common";

@Injectable()
export class UsersService {
  me() {
    return { id: "u_1", name: "Elena Ray", email: "elena@karali.aero", role: "manager" };
  }
}
