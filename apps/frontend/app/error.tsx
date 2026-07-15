"use client";

import { Button, Card } from "@karali/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-10">
      <Card className="space-y-4 p-8 text-center">
        <h1 className="text-3xl font-semibold text-[#231a13]">Something went wrong</h1>
        <p className="text-sm text-[#554336]">
          We couldn&apos;t finish loading this screen. Please try again.
        </p>
        <p className="text-xs text-[#7b6658]">{error.digest ? `Reference: ${error.digest}` : "Reference unavailable"}</p>
        <div className="flex justify-center">
          <Button type="button" onClick={reset}>
            Retry
          </Button>
        </div>
      </Card>
    </main>
  );
}
