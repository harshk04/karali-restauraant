import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";

class LoginDto {
  email!: string;
  password!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() _dto: LoginDto) {
    return this.authService.login();
  }

  @Post("refresh")
  refresh() {
    return this.authService.refresh();
  }
}
