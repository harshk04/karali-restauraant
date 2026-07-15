import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { IsEmail, IsIn, IsNumber, IsOptional, IsString, Matches, Min, ValidateIf } from "class-validator";
import { BookingsService } from "./bookings.service";
import { AdminAuthGuard } from "../admin/admin.guard";

class CreateBookingDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}-\d{2}:\d{2}$/)
  slotId!: string;

  @IsNumber()
  @Min(1)
  pax!: number;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsEmail()
  email?: string;

  @IsOptional()
  @Matches(/^(?:\+91\d{10}|\d{10})$/)
  phone?: string;

  @IsOptional()
  @IsString()
  specialRequest?: string;

  @IsOptional()
  @IsIn(["razorpay", "pay_later"])
  paymentMethod?: "razorpay" | "pay_later";

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;
}

@Controller("bookings")
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @UseGuards(AdminAuthGuard)
  @Get()
  list() {
    return this.bookingsService.list();
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Query("accessKey") accessKey: string) {
    return this.bookingsService.getPublicBooking(id, accessKey);
  }

  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }
}
