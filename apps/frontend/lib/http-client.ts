import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

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

type RetryableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export function createHttpClient(refreshPath?: string) {
  const client = axios.create({
    baseURL: resolveApiBaseUrl(),
    withCredentials: true,
    timeout: 15000,
  });

  const refreshClient = axios.create({
    baseURL: resolveApiBaseUrl(),
    withCredentials: true,
    timeout: 15000,
  });

  let refreshPromise: Promise<void> | null = null;

  client.interceptors.response.use(
    (response) => {
      if (
        response.data &&
        typeof response.data === "object" &&
        response.data.success === true &&
        "data" in response.data
      ) {
        response.data = response.data.data;
      }

      return response;
    },
    async (error: AxiosError<{ error?: { message?: string } }>) => {
      const config = error.config as RetryableConfig | undefined;
      const message = error.response?.data?.error?.message;

      if (message) {
        error.message = message;
      }

      if (
        refreshPath &&
        error.response?.status === 401 &&
        config &&
        !config._retry &&
        !config.url?.includes(refreshPath)
      ) {
        config._retry = true;

        refreshPromise =
          refreshPromise ||
          refreshClient.post(refreshPath).then(() => undefined).finally(() => {
            refreshPromise = null;
          });

        try {
          await refreshPromise;
          return client(config);
        } catch {
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
}
