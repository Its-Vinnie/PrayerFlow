import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function RootNotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <FileQuestion className="size-7 text-accent" />
        </div>
        <h1 className="mb-2 text-lg font-semibold text-foreground">
          Page not found
        </h1>
        <p className="mb-6 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/sessions"
          className="inline-block rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Go to Sessions
        </Link>
      </div>
    </div>
  );
}
