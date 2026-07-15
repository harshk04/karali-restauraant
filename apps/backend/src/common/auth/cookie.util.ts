import type { Request } from "express";

export function isSecureRequest(request: Request) {
  const forwardedProto = request.headers["x-forwarded-proto"];
  const protoValue = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto;

  return request.secure || protoValue?.split(",")[0]?.trim() === "https";
}

export function buildSessionCookieOptions(request: Request, maxAgeMs: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production" && isSecureRequest(request),
    path: "/",
    maxAge: maxAgeMs,
  };
}

export function buildCookieClearOptions() {
  return {
    path: "/",
  };
}
