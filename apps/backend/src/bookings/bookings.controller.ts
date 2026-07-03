import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { IsNumber, IsOptional, IsString, Matches, Min } from "class-validator";
import { BookingsService } from "./bookings.service";

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
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  specialRequest?: string;

  @IsOptional()
  @IsString()
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

  @Get()
  list() {
    return this.bookingsService.list();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.bookingsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }
}
