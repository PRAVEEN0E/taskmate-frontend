import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">This page isn&apos;t here.</h1>
        <Link className="mt-6 inline-block text-sky-300 underline" href="/dashboard">
          Return to your dashboard
        </Link>
      </div>
    </main>
  );
}
