import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";

type AdminSession = {
  id?: string;
  email: string;
  name: string;
  mobile: string;
  role: "admin";
};

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { admin?: AdminSession }>();
    const cookieToken = request.cookies?.admin_session as string | undefined;
    const bearer = request.headers.authorization?.startsWith("Bearer ") ? request.headers.authorization.slice(7) : undefined;
    const token = cookieToken || bearer;

    if (!token) {
      throw new UnauthorizedException("Admin session required");
    }

    try {
      request.admin = this.jwtService.verify<AdminSession>(token);
      if (request.admin.role !== "admin") {
        throw new Error("Invalid role");
      }
      return true;
    } catch {
      throw new UnauthorizedException("Invalid admin session");
    }
  }
}
