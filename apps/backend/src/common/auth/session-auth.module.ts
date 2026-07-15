import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { SessionTokenService } from "./session-token.service";
import { AuthRateLimitGuard } from "../guards/auth-rate-limit.guard";
import { AdminAuthGuard } from "../../admin/admin.guard";
import { StaffAuthGuard } from "../../staff/staff.guard";

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("jwtSecret") || "change-me",
      }),
    }),
  ],
  providers: [
    SessionTokenService,
    AuthRateLimitGuard,
    AdminAuthGuard,
    StaffAuthGuard,
  ],
  exports: [
    SessionTokenService,
    AuthRateLimitGuard,
    AdminAuthGuard,
    StaffAuthGuard,
    JwtModule,
  ],
})
export class SessionAuthModule {}
