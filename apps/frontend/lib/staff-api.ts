import axios from "axios";

function resolveApiBaseUrl() {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "/api";
  }

  const backendUrl =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:4000";
  return backendUrl.replace(/\/$/, "") + "/api";
}

export const staffApi = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
});
