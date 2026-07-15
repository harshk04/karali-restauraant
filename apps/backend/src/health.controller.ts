import { Controller, Get } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import type { Connection } from "mongoose";

@Controller("health")
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  health() {
    return {
      status: "ok",
      uptimeSeconds: Math.round(process.uptime()),
      database:
        this.connection.readyState === 1 ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    };
  }
}
