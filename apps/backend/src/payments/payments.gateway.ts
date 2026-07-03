import { Injectable, Logger } from "@nestjs/common";
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

type PaymentSuccessPayload = {
  paymentId: string;
  orderId: string;
  subscriptionId?: string;
  status: string;
  nextBillingDate?: string | null;
};

@WebSocketGateway({
  namespace: "/payments",
  cors: {
    origin: true,
    credentials: true,
  },
})
@Injectable()
export class PaymentsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(PaymentsGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const userId = (client.handshake.auth?.userId || client.handshake.query.userId || client.handshake.headers["x-user-id"]) as
      | string
      | undefined;

    if (!userId) {
      client.disconnect(true);
      return;
    }

    client.data.userId = userId;
    client.join(`user:${userId}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`socket disconnected ${client.id}`);
  }

  emitPaymentProcessing(userId: string) {
    this.server?.to(`user:${userId}`).emit("payment:processing", { status: "processing" });
  }

  emitPaymentSuccess(userId: string, payload: PaymentSuccessPayload) {
    this.server?.to(`user:${userId}`).emit("payment:success", payload);
  }

  emitPaymentFailed(userId: string, payload: { paymentId: string; reason: string }) {
    this.server?.to(`user:${userId}`).emit("payment:failed", payload);
  }

  emitSubscriptionUpdated(
    userId: string,
    payload: { planStatus: string; currentPeriodEnd: string | null; nextBillingDate: string | null },
  ) {
    this.server?.to(`user:${userId}`).emit("subscription:updated", payload);
  }

  emitSubscriptionExpired(userId: string, payload: { reason: string }) {
    this.server?.to(`user:${userId}`).emit("subscription:expired", payload);
  }
}
