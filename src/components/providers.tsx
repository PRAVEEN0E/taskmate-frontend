'use client';
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useRouter } from 'next/navigation';
export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: true },
          mutations: { retry: false },
        },
      }),
  );
  useEffect(() => {
    const expired = () => {
      client.clear();
      router.replace('/login?expired=1');
      router.refresh();
    };
    window.addEventListener('taskmate:expired', expired);
    return () => window.removeEventListener('taskmate:expired', expired);
  }, [client, router]);
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster richColors theme="dark" position="bottom-right" />
    </QueryClientProvider>
  );
}
