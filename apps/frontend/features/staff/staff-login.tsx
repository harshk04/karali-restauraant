"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@karali/ui";
import { staffApi } from "../../lib/staff-api";

export function StaffLogin({ redirectTo = "/staff/dashboard" }: { redirectTo?: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    staffApi
      .get("/staff/auth/me")
      .then(() => router.replace("/staff/dashboard"))
      .catch(() => undefined);
  }, [router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await staffApi.post("/staff/auth/login", { username, password });
      await staffApi.get("/staff/auth/me");
      router.replace(redirectTo as never);
    } catch (value) {
      const status =
        value && typeof value === "object" && "response" in value
          ? (value as { response?: { status?: number } }).response?.status
          : undefined;
      setError(
        status === 401
          ? "Invalid staff credentials."
          : "Unable to sign in right now. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-[#8f4a00]">
          Staff access
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[#231a13] sm:text-4xl">
          Sign in to the staff portal
        </h1>
        <p className="mt-2 text-sm text-[#554336]">
          Use your staff username and password to access scanner and check-in tools.
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          value={username}
          onChange={(event: { target: { value: string } }) =>
            setUsername(event.target.value)
          }
          placeholder="Username"
        />
        <Input
          value={password}
          onChange={(event: { target: { value: string } }) =>
            setPassword(event.target.value)
          }
          placeholder="Password"
          type="password"
        />
        {error ? <p className="text-sm text-[#b54646]">{error}</p> : null}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </Button>
      </form>
    </Card>
  );
}
