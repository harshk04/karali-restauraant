import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { JwtSignOptions } from "@nestjs/jwt";
import {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
  SESSION_AUDIENCE,
  SESSION_ISSUER,
} from "./session.constants";
import type {
  AdminSession,
  BaseSessionToken,
  SessionRole,
  StaffSession,
} from "./session.types";

type SignAccessTokenInput =
  | { role: "admin"; session: AdminSession }
  | { role: "staff"; session: StaffSession };

@Injectable()
export class SessionTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  signAccessToken(input: SignAccessTokenInput) {
    return this.jwtService.sign(
      {
        ...input.session,
        sub: input.session.id,
        role: input.role,
        type: "access",
      } as Record<string, unknown>,
      this.getCommonOptions(ACCESS_TOKEN_TTL),
    );
  }

  signRefreshToken(role: SessionRole, subject: string) {
    return this.jwtService.sign(
      {
        sub: subject,
        role,
        type: "refresh",
      } as Record<string, unknown>,
      this.getCommonOptions(REFRESH_TOKEN_TTL, true),
    );
  }

  verifyAccessToken<T extends BaseSessionToken>(token: string, role: SessionRole) {
    const payload = this.verifyToken<T>(token, role);
    if (payload.type !== "access") {
      throw new UnauthorizedException("Invalid session token.");
    }
    return payload;
  }

  verifyRefreshToken(token: string, role: SessionRole) {
    const payload = this.verifyToken<BaseSessionToken>(token, role, true);
    if (payload.type !== "refresh") {
      throw new UnauthorizedException("Invalid refresh token.");
    }
    return payload;
  }

  private verifyToken<T extends BaseSessionToken>(
    token: string,
    role: SessionRole,
    refresh = false,
  ) {
    try {
      const payload = this.jwtService.verify<T>(token, {
        secret: this.getSecret(refresh),
        issuer: SESSION_ISSUER,
        audience: SESSION_AUDIENCE,
      });

      if (payload.role !== role) {
        throw new UnauthorizedException("Invalid session role.");
      }

      return payload;
    } catch {
      throw new UnauthorizedException("Invalid session token.");
    }
  }

  private getCommonOptions(expiresIn: number, refresh = false): JwtSignOptions {
    return {
      secret: this.getSecret(refresh),
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
      expiresIn,
    };
  }

  private getSecret(refresh = false) {
    if (refresh) {
      return (
        this.configService.get<string>("jwtRefreshSecret") ||
        this.configService.get<string>("jwtSecret") ||
        "change-me-refresh"
      );
    }

    return this.configService.get<string>("jwtSecret") || "change-me";
  }
}
