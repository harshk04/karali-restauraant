import { Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class UsersService {
  me() {
    throw new UnauthorizedException("Authentication required.");
  }
}
