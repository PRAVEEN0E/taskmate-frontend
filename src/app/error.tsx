'use client';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="glass max-w-lg rounded-2xl p-10">
        <h1 className="text-2xl font-semibold">Let&apos;s try that again.</h1>
        <p className="my-5 text-muted-foreground">
          Your workspace couldn&apos;t be loaded. Check that the API and database are available,
          then retry.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
