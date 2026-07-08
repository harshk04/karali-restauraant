import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { IsEmail, IsOptional, IsString, MinLength, ValidateIf } from "class-validator";
import type { Request, Response } from "express";
import { AdminAuthGuard } from "../admin/admin.guard";
import { StaffAuthGuard, type StaffSession } from "./staff.guard";
import { StaffService } from "./staff.service";

class StaffLoginDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

class CreateStaffDto {
  @IsString()
  name!: string;

  @IsString()
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  confirmPassword!: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  status?: "active" | "inactive";
}

class UpdateStaffDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  status?: "active" | "inactive";
}

class ResetPasswordDto {
  @IsString()
  newPassword!: string;

  @IsString()
  confirmPassword!: string;
}

class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  newPassword!: string;

  @IsString()
  confirmPassword!: string;
}

class StaffCheckInDto {
  @IsString()
  bookingId!: string;
}

class CheckinQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  sort?: "asc" | "desc";

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

class StaffScanDto {
  @IsString()
  bookingId!: string;
}

@Controller("staff/auth")
export class StaffAuthController {
  constructor(private readonly staffService: StaffService) {}

  @Post("login")
  async login(
    @Body() dto: StaffLoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.staffService.login(dto.username, dto.password);
    if (!result) {
      throw new UnauthorizedException("Invalid staff credentials");
    }

    const forwardedProto = request.headers["x-forwarded-proto"];
    const protoValue = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
    const isHttps = request.secure || protoValue?.split(",")[0]?.trim() === "https";

    response.cookie("staff_session", result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" && isHttps,
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });
    response.cookie("staff_session_hint", "1", {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" && isHttps,
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return { success: true, staff: result.session, token: result.token };
  }

  @UseGuards(StaffAuthGuard)
  @Get("me")
  me(@Req() request: Request & { staff?: StaffSession }) {
    return { success: true, staff: request.staff };
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie("staff_session", { path: "/" });
    response.clearCookie("staff_session_hint", { path: "/" });
    return { success: true };
  }
}

@UseGuards(StaffAuthGuard)
@Controller("staff")
export class StaffPortalController {
  constructor(private readonly staffService: StaffService) {}

  @Get("dashboard")
  dashboard() {
    return this.staffService.dashboard();
  }

  @Get("checkins")
  checkins(@Query() query: CheckinQueryDto) {
    return this.staffService.listCheckins({
      search: query.search,
      date: query.date,
      sort: query.sort,
      page: Number(query.page || 1),
      limit: Number(query.limit || 20),
    });
  }

  @Get("profile")
  profile(@Req() request: Request & { staff?: StaffSession }) {
    return this.staffService.getProfile(request.staff as StaffSession);
  }

  @Patch("profile/password")
  changePassword(
    @Req() request: Request & { staff?: StaffSession },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.staffService.changePassword(request.staff as StaffSession, dto);
  }

  @Post("scan-qr")
  validateQr(@Body() dto: StaffScanDto) {
    return this.staffService.validateBooking(dto.bookingId);
  }

  @Post("check-in")
  checkIn(
    @Req() request: Request & { staff?: StaffSession },
    @Body() dto: StaffCheckInDto,
  ) {
    return this.staffService.checkInBooking(dto.bookingId, request.staff as StaffSession);
  }
}

@UseGuards(AdminAuthGuard)
@Controller("admin/staff")
export class StaffAdminController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  list(@Query("search") search?: string) {
    return this.staffService.listStaff(search);
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.staffService.getStaff(id);
  }

  @Post()
  create(@Body() dto: CreateStaffDto) {
    return this.staffService.createStaff(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateStaffDto) {
    return this.staffService.updateStaff(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.staffService.deleteStaff(id);
  }

  @Patch(":id/reset-password")
  resetPassword(@Param("id") id: string, @Body() dto: ResetPasswordDto) {
    return this.staffService.resetPassword(id, dto);
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body() dto: { status: "active" | "inactive" }) {
    return this.staffService.setStatus(id, dto.status);
  }
}
