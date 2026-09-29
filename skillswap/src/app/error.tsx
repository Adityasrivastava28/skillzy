"use client";

import { Button } from "@/components/ui/Button";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-5 py-24 text-center">
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="mt-3 text-muted">
        We couldn&apos;t load this page. This is usually temporary. Try again in a moment.
      </p>
      <Button onClick={reset} className="mt-6">Try again</Button>
    </div>
  );
}
