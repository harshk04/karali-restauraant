import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      originalUrl?: string;
      ip?: string;
    }>();
    const response = context.switchToHttp().getResponse<{ statusCode: number }>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            JSON.stringify({
              event: "http.request.completed",
              method: request.method,
              path: request.originalUrl,
              statusCode: response.statusCode,
              durationMs: Date.now() - startedAt,
              ip: request.ip,
            }),
          );
        },
      }),
    );
  }
}
