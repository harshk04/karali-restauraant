import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString, MinLength } from "class-validator";
import type { Response, Request } from "express";
import { AdminAuthGuard } from "./admin.guard";
import { AdminService } from "./admin.service";
import { BookingsService } from "../bookings/bookings.service";

type AdminSession = {
  email: string;
  name: string;
  mobile: string;
  role: "admin";
};

class AdminLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

class BookingUpdateDto {
  @IsOptional()
  @IsString()
  status?: "pending" | "checked_in" | "cancelled" | "completed" | "no_show";

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @IsNumber()
  pax?: number;

  @IsOptional()
  @IsString()
  specialRequest?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  paymentStatus?: "pending" | "paid" | "failed";
}

class TimingDto {
  @IsString()
  openTime!: string;

  @IsString()
  closeTime!: string;

  @IsOptional()
  @IsNumber()
  slotDurationMins?: number;
}

class ClosureDto {
  @IsString()
  startDate!: string;

  @IsString()
  endDate!: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsBoolean()
  displayReasonToCustomers?: boolean;
}

class CouponDto {
  @IsString()
  code!: string;

  @IsString()
  discountType!: "percentage" | "fixed";

  @IsOptional()
  @IsNumber()
  percentage?: number;

  @IsOptional()
  @IsNumber()
  fixedAmount?: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @IsOptional()
  @IsNumber()
  perUserLimit?: number;

  @IsOptional()
  @IsNumber()
  minimumAmount?: number;

  @IsOptional()
  @IsNumber()
  maximumDiscount?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

class ScanQrDto {
  @IsString()
  bookingId!: string;

  @IsString()
  staffId!: string;
}

class ManualBookingDto {
  @IsString()
  customerName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  date!: string;

  @IsString()
  time!: string;

  @IsNumber()
  pax!: number;

  @IsOptional()
  @IsString()
  specialRequest?: string;
}

@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly adminService: AdminService) {}

  @Post("login")
  login(@Body() dto: AdminLoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = this.adminService.login(dto.email, dto.password);
    if (!result) {
      throw new UnauthorizedException("Invalid admin credentials");
    }

    const forwardedProto = request.headers["x-forwarded-proto"];
    const protoValue = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
    const isHttps = request.secure || protoValue?.split(",")[0]?.trim() === "https";

    response.cookie("admin_session", result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" && isHttps,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    response.cookie("admin_session_hint", "1", {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" && isHttps,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { success: true, admin: result.session, token: result.token };
  }

  @UseGuards(AdminAuthGuard)
  @Get("me")
  me(@Req() request: Request & { admin?: AdminSession }) {
    return { success: true, admin: this.adminService.me(request.admin) };
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie("admin_session", { path: "/" });
    response.clearCookie("admin_session_hint", { path: "/" });
    return { success: true };
  }
}

@UseGuards(AdminAuthGuard)
@Controller("admin")
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly bookingsService: BookingsService,
  ) {}

  @Get("dashboard")
  dashboard() {
    return this.adminService.dashboard();
  }

  @Get("bookings")
  bookings(@Query("search") search?: string, @Query("status") status?: string, @Query("paymentStatus") paymentStatus?: string) {
    return this.adminService.listBookings({ search, status, paymentStatus });
  }

  @Patch("bookings/:bookingId")
  updateBooking(@Body() dto: BookingUpdateDto, @Param("bookingId") bookingId: string) {
    return this.adminService.updateBooking(bookingId, dto as Record<string, unknown>);
  }

  @Post("bookings/:bookingId/cancel")
  cancelBooking(@Param("bookingId") bookingId: string) {
    return this.adminService.markBooking(bookingId, "cancelled");
  }

  @Post("bookings/:bookingId/check-in")
  checkin(@Param("bookingId") bookingId: string) {
    return this.adminService.markBooking(bookingId, "checked_in");
  }

  @Post("bookings/:bookingId/complete")
  complete(@Param("bookingId") bookingId: string) {
    return this.adminService.markBooking(bookingId, "completed");
  }

  @Get("bookings/:bookingId/receipt")
  async bookingReceipt(
    @Param("bookingId") bookingId: string,
    @Res() res: Response,
  ) {
    const pdf = await this.bookingsService.receiptPdf(bookingId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${bookingId}-receipt.pdf"`,
    );
    res.setHeader("Cache-Control", "private, max-age=60");
    res.send(pdf);
  }

  @Post("bookings/:bookingId/no-show")
  noShow(@Param("bookingId") bookingId: string) {
    return this.adminService.markBooking(bookingId, "no_show");
  }

  @Get("availability")
  availability() {
    return this.adminService.getAvailability();
  }

  @Post("availability/timing")
  timing(@Body() dto: TimingDto) {
    return this.adminService.upsertTiming(dto);
  }

  @Post("availability/closures")
  closure(@Body() dto: ClosureDto) {
    return this.adminService.createClosure(dto);
  }

  @Post("coupons")
  coupon(@Body() dto: CouponDto) {
    return this.adminService.createCoupon(dto as never);
  }

  @Get("coupons")
  coupons() {
    return this.adminService.listCoupons();
  }

  @Get("coupons/:code")
  couponByCode(@Param("code") code: string) {
    return this.adminService.getCoupon(code);
  }

  @Patch("coupons/:code")
  updateCoupon(@Param("code") code: string, @Body() dto: CouponDto) {
    return this.adminService.updateCoupon(code, dto as never);
  }

  @Patch("coupons/:code/toggle")
  toggleCoupon(@Param("code") code: string) {
    return this.adminService.toggleCoupon(code);
  }

  @Delete("coupons/:code")
  deleteCoupon(@Param("code") code: string) {
    return this.adminService.deleteCoupon(code);
  }

  @Post("scan-qr")
  scanQr(@Body() dto: ScanQrDto) {
    return this.adminService.scanQr(dto);
  }

  @Post("bookings/manual")
  async createManualBooking(@Body() dto: ManualBookingDto) {
    if (!dto.date || !dto.time) {
      throw new BadRequestException("Date and time are required");
    }

    const slotId = `${dto.date}-${dto.time}`;
    return this.bookingsService.create({
      customerName: dto.customerName,
      email: dto.email,
      phone: dto.phone,
      source: "manual",
      slotId,
      pax: Number(dto.pax || 1),
      specialRequest: dto.specialRequest || "",
      paymentMethod: "pay_later",
      totalAmount: 0,
      discountAmount: 0,
    });
  }
}

@Controller("coupons")
export class CouponsController {
  constructor(private readonly adminService: AdminService) {}

  @Get("validate")
  validate(@Query("code") code: string, @Query("amount") amount: string, @Query("userId") userId = "guest") {
    return this.adminService.applyCoupon(code, userId, Number(amount || 0));
  }
}
