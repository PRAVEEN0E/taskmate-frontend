import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Session } from './types';
export async function requireOwner(): Promise<Session> {
  const jar = await cookies();
  const response = await fetch(
    `${process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:4000'}/api/v1/auth/me`,
    { headers: { cookie: jar.toString() }, cache: 'no-store', signal: AbortSignal.timeout(10000) },
  );
  if (response.status === 401) redirect('/login');
  if (!response.ok) throw new Error('Your workspace is temporarily unavailable.');
  return ((await response.json()) as { data: Session }).data;
}
