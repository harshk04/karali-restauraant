import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { NotificationsService } from "./notifications.service";

@Controller("webhooks/whatsapp")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  verifyWebhook(
    @Query("hub.mode") mode?: string,
    @Query("hub.verify_token") verifyToken?: string,
    @Query("hub.challenge") challenge?: string,
  ) {
    return this.notificationsService.verifyWebhook(
      mode,
      verifyToken,
      challenge,
    );
  }

  @Post()
  receiveWebhook(
    @Body() payload: Record<string, unknown>,
    @Headers("x-hub-signature-256") signature?: string,
    @Req() req?: Request & { rawBody?: Buffer },
  ) {
    return this.notificationsService.handleWebhook(
      payload,
      signature,
      req?.rawBody,
    );
  }
}
