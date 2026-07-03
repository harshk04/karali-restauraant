import { Injectable } from "@nestjs/common";

@Injectable()
export class AuthService {
  login(email: string, _password: string) {
    return {
      accessToken: `access.${Buffer.from(email).toString("base64")}`,
      refreshToken: `refresh.${Buffer.from(email).toString("base64")}`,
    };
  }

  refresh() {
    return {
      accessToken: "access.refreshed",
      refreshToken: "refresh.refreshed",
    };
  }
}
