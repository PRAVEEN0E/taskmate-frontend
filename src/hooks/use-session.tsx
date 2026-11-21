'use client';
import { createContext, useContext } from 'react';
import type { Session } from '@/lib/types';
export const SessionContext = createContext<Session | null>(null);
export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('Session provider is required');
  return session;
}
