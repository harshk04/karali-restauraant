import { Injectable, NotImplementedException } from "@nestjs/common";

@Injectable()
export class AuthService {
  login() {
    throw new NotImplementedException("Customer authentication is not enabled on this platform.");
  }

  refresh() {
    throw new NotImplementedException("Customer authentication is not enabled on this platform.");
  }
}
