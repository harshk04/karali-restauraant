import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { SessionTokenService } from "../common/auth/session-token.service";
import { ADMIN_ACCESS_COOKIE } from "../common/auth/session.constants";
import type { AdminAccessTokenPayload, AdminSession } from "../common/auth/session.types";

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly sessionTokenService: SessionTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { admin?: AdminSession }>();
    const cookieToken = request.cookies?.[ADMIN_ACCESS_COOKIE] as string | undefined;
    const bearer = request.headers.authorization?.startsWith("Bearer ") ? request.headers.authorization.slice(7) : undefined;
    const token = cookieToken || bearer;

    if (!token) {
      throw new UnauthorizedException("Admin session required");
    }

    try {
      const payload = this.sessionTokenService.verifyAccessToken<AdminAccessTokenPayload>(token, "admin");
      request.admin = {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        mobile: payload.mobile,
        role: payload.role,
      };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid admin session");
    }
  }
}
