import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from "@nestjs/common";
import { Observable, map } from "rxjs";

function shouldWrapResponse(data: unknown) {
  if (data instanceof StreamableFile) {
    return false;
  }

  if (Buffer.isBuffer(data)) {
    return false;
  }

  if (typeof data === "string" || typeof data === "number" || typeof data === "boolean") {
    return false;
  }

  return true;
}

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse<{ headersSent?: boolean }>();

    return next.handle().pipe(
      map((data) => {
        if (response.headersSent || !shouldWrapResponse(data)) {
          return data;
        }

        if (
          data &&
          typeof data === "object" &&
          "success" in (data as Record<string, unknown>)
        ) {
          return data;
        }

        return {
          success: true,
          data,
        };
      }),
    );
  }
}
