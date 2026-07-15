import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";

type Bucket = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const buckets = new Map<string, Bucket>();

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      ip?: string;
      originalUrl?: string;
      method?: string;
    }>();

    const key = `${request.ip || "unknown"}:${request.method || "GET"}:${request.originalUrl || ""}`;
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return true;
    }

    if (current.count >= MAX_ATTEMPTS) {
      throw new HttpException("Too many authentication attempts. Please try again later.", HttpStatus.TOO_MANY_REQUESTS);
    }

    current.count += 1;
    buckets.set(key, current);
    return true;
  }
}
