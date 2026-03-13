'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[PrayerFlow Error]', error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="size-7 text-red-400" />
        </div>
        <h1 className="mb-2 text-lg font-semibold text-foreground">
          Something went wrong
        </h1>
        <p className="mb-6 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
