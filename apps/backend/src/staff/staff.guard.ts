import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";

export type StaffSession = {
  id: string;
  name: string;
  username: string;
  mobile: string;
  email: string;
  designation: string;
  role: "staff";
  status: "active" | "inactive";
};

@Injectable()
export class StaffAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { staff?: StaffSession }>();
    const cookieToken = request.cookies?.staff_session as string | undefined;
    const bearer = request.headers.authorization?.startsWith("Bearer ")
      ? request.headers.authorization.slice(7)
      : undefined;
    const token = cookieToken || bearer;

    if (!token) {
      throw new UnauthorizedException("Staff session required");
    }

    try {
      request.staff = this.jwtService.verify<StaffSession>(token);
      if (request.staff.role !== "staff") {
        throw new Error("Invalid role");
      }
      return true;
    } catch {
      throw new UnauthorizedException("Invalid staff session");
    }
  }
}
