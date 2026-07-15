import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { SessionTokenService } from "../common/auth/session-token.service";
import { STAFF_ACCESS_COOKIE } from "../common/auth/session.constants";
import type { StaffAccessTokenPayload, StaffSession } from "../common/auth/session.types";

@Injectable()
export class StaffAuthGuard implements CanActivate {
  constructor(private readonly sessionTokenService: SessionTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { staff?: StaffSession }>();
    const cookieToken = request.cookies?.[STAFF_ACCESS_COOKIE] as string | undefined;
    const bearer = request.headers.authorization?.startsWith("Bearer ")
      ? request.headers.authorization.slice(7)
      : undefined;
    const token = cookieToken || bearer;

    if (!token) {
      throw new UnauthorizedException("Staff session required");
    }

    try {
      const payload = this.sessionTokenService.verifyAccessToken<StaffAccessTokenPayload>(token, "staff");
      request.staff = {
        id: payload.id,
        name: payload.name,
        username: payload.username,
        mobile: payload.mobile,
        email: payload.email,
        designation: payload.designation,
        role: payload.role,
        status: payload.status,
      };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid staff session");
    }
  }
}
