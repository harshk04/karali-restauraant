"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, PasswordInput } from "@karali/ui";
import { api } from "../../lib/api";

export function AdminLogin({ redirectTo = "/admin" }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get("/admin/auth/me")
      .then(() => router.replace("/admin"))
      .catch(() => undefined);
  }, [router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const loginResponse = await api.post("/admin/auth/login", { email, password });
      const token = loginResponse.data?.token as string | undefined;
      if (token) {
        window.localStorage.setItem("karali_admin_token", token);
        document.cookie = "admin_session_hint=1; path=/; samesite=lax";
      }
      await api.get("/admin/auth/me");
      router.replace(redirectTo as never);
    } catch (error) {
      const status = error && typeof error === "object" && "response" in error ? (error as { response?: { status?: number } }).response?.status : undefined;
      if (status === 401) {
        setError("Invalid admin credentials.");
      } else {
        setError("Unable to sign in right now. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-5 lg:col-span-5">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-[#8f4a00]">
          Admin access
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[#231a13] sm:text-4xl">
          Sign in to the admin panel
        </h1>
        <p className="mt-2 text-sm text-[#554336]">
          Use the fixed admin credentials to access bookings, availability, and coupons.
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input value={email} onChange={(event: { target: { value: string } }) => setEmail(event.target.value)} placeholder="Admin email" />
        <PasswordInput value={password} onChange={(event: { target: { value: string } }) => setPassword(event.target.value)} placeholder="Password" />
        {error ? <p className="text-sm text-[#b54646]">{error}</p> : null}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </Button>
      </form>
    </Card>
  );
}
