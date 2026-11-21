import { requireOwner } from '@/lib/session';
import { Workspace } from '@/components/layout/workspace';
export const dynamic = 'force-dynamic';
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await requireOwner();
  return <Workspace initialSession={session}>{children}</Workspace>;
}
