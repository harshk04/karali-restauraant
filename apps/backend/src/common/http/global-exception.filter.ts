import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException ? exception.getResponse() : null;

    const errorBody =
      typeof exceptionResponse === "string"
        ? { message: exceptionResponse }
        : ((exceptionResponse as Record<string, unknown> | null) ?? {});

    const message =
      typeof errorBody.message === "string"
        ? errorBody.message
        : Array.isArray(errorBody.message)
          ? errorBody.message.join(", ")
          : status === HttpStatus.INTERNAL_SERVER_ERROR
            ? "Unexpected server error."
            : "Request failed.";

    const details = Array.isArray(errorBody.message)
      ? errorBody.message
      : errorBody.details;

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.originalUrl} failed with ${status}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`${request.method} ${request.originalUrl} failed with ${status}: ${message}`);
    }

    response.status(status).json({
      success: false,
      error: {
        statusCode: status,
        message,
        details,
        path: request.originalUrl,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
