import { Body, Controller, Headers, Post, Req } from "@nestjs/common";
import { IsNumber, IsOptional, IsString, Min, Matches } from "class-validator";
import type { Request } from "express";
import { PaymentsService } from "./payments.service";

class CreateRazorpayOrderDto {
  @IsString()
  customerName!: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}-\d{2}:\d{2}$/)
  slotId!: string;

  @IsNumber()
  @Min(1)
  pax!: number;

  @IsOptional()
  @IsString()
  specialRequest?: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  attemptId?: string;
}

class VerifyRazorpayPaymentDto {
  @IsString()
  bookingId!: string;

  @IsString()
  razorpayOrderId!: string;

  @IsString()
  razorpayPaymentId!: string;

  @IsString()
  razorpaySignature!: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("razorpay/create-order")
  createOrder(@Body() dto: CreateRazorpayOrderDto) {
    return this.paymentsService.createRazorpayOrder(dto);
  }

  @Post("razorpay/verify")
  verifyPayment(@Body() dto: VerifyRazorpayPaymentDto) {
    return this.paymentsService.verifyRazorpayPayment(dto);
  }

  @Post("razorpay/webhook")
  handleWebhook(
    @Req() request: Request & { rawBody?: Buffer },
    @Headers("x-razorpay-signature") razorpaySignature?: string,
  ) {
    return this.paymentsService.handleWebhook(request.rawBody || Buffer.from(""), razorpaySignature || "");
  }
}
