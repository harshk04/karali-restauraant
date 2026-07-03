export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";

async function proxy(request: Request, context: any) {
  const params = await context.params;
  const { path = [] } = params ?? {};
  const targetUrl = new URL(`${backendUrl}/api/${path.join("/")}`);
  const incomingUrl = new URL(request.url);
  targetUrl.search = incomingUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.arrayBuffer();
  }

  const response = await fetch(targetUrl, init);
  const proxiedResponse = new Response(response.body, {
    status: response.status,
  });

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") {
      proxiedResponse.headers.set(key, value);
    }
  });

  const setCookies = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  for (const cookie of setCookies) {
    proxiedResponse.headers.append("set-cookie", cookie);
  }

  return proxiedResponse;
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE, proxy as OPTIONS };
