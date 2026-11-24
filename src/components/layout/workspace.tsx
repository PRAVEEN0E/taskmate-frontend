'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Sparkles,
  Timer,
  Wallet,
  Bookmark,
  BookHeart,
  Layers,
  Folder,
  Settings,
  Users,
  LogOut,
  Search,
  ChevronDown,
  Bell,
} from 'lucide-react';
import { api, setCsrf } from '@/lib/api';
import type { Session } from '@/lib/types';
import { SessionContext } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { FormModal } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { MacDock, type DockItemData } from './mac-dock';
import { toast } from 'sonner';

const navItems: DockItemData[] = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { title: 'Tasks', icon: CheckSquare, href: '/tasks' },
  { title: 'Notes', icon: BookHeart, href: '/notes' },
  { title: 'Calendar', icon: CalendarDays, href: '/calendar' },
  { title: 'AI Assistant', icon: Sparkles, href: '/assistant' },
  { title: 'Productivity', icon: Timer, href: '/productivity' },
  { title: 'Expenses', icon: Wallet, href: '/expenses' },
  { title: 'Bookmarks', icon: Bookmark, href: '/bookmarks' },
  { title: 'Projects', icon: Layers, href: '/projects' },
  { title: 'Groups', icon: Users, href: '/groups' },
  { title: 'Files', icon: Folder, href: '/files' },
  { title: 'Settings', icon: Settings, href: '/settings' },
];

export function Workspace({
  initialSession,
  children,
}: {
  initialSession: Session;
  children: React.ReactNode;
}) {
  const router = useRouter(),
    pathname = usePathname(),
    client = useQueryClient();
  const [search, setSearch] = useState(false),
    [term, setTerm] = useState(''),
    [logout, setLogout] = useState(false),
    [busy, setBusy] = useState(false),
    [notifications, setNotifications] = useState(false);
  const [session, setSession] = useState(initialSession);

  useEffect(() => {
    if (initialSession?.csrfToken) {
      setCsrf(initialSession.csrfToken);
    }
  }, [initialSession]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearch((prev) => !prev);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  async function signOut() {
    setBusy(true);
    try {
      await api('/auth/logout', { method: 'POST' });
      setCsrf('');
      client.clear();
      router.replace('/login');
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SessionContext.Provider value={session}>
      <a href="#main" className="skip-link sr-only focus:not-sr-only">
        Skip to content
      </a>
      <div className="ambient" aria-hidden="true" />

      {/* Main Workspace Frame (Full Width Layout without fixed sidebar) */}
      <div className="workspace">
        {/* Minimal Glassmorphic Top Navbar */}
        <header className="topbar">
          <Link
            className="flex items-center gap-3 shrink-0 group mr-2 sm:mr-4"
            href="/dashboard"
          >
            <div className="relative h-8 w-8 sm:h-9 sm:w-9 shrink-0 overflow-hidden rounded-xl border border-white/20 shadow-md group-hover:scale-105 transition-transform">
              <Image
                src="/buddio-icon.png"
                alt="Buddio"
                fill
                className="object-cover"
                priority
              />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Buddio
            </span>
          </Link>

          <button className="search-trigger" onClick={() => setSearch(true)}>
            <Search size={16} className="text-[#8ea9e8]" />
            <span className="hidden sm:inline">Search pages, tasks, notes…</span>
            <span className="sm:hidden text-xs">Search…</span>
            <kbd className="hidden sm:inline-block ml-4 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </button>

          <div className="ml-auto hidden text-xs font-medium text-muted-foreground md:block">
            {new Intl.DateTimeFormat('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              timeZone: session.settings.timezone,
            }).format(new Date())}
          </div>

          <Button
            size="icon"
            variant="ghost"
            aria-label="Notifications"
            onClick={() => setNotifications(true)}
            className="rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
          >
            <Bell size={18} className="text-muted-foreground hover:text-foreground" />
          </Button>

          <div className="flex items-center gap-2">
            <Link href="/settings" className="profile-link" aria-label="Open profile settings">
              <span className="avatar">{session.owner.name.slice(0, 1).toUpperCase()}</span>
              <span className="hidden text-xs font-semibold text-foreground sm:block">{session.owner.name}</span>
              <ChevronDown size={13} className="text-muted-foreground" />
            </Link>

            <button
              onClick={() => setLogout(true)}
              className="rounded-xl p-2 text-muted-foreground hover:text-red-300 hover:bg-red-500/10 transition"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Workspace Children Content with bottom clearance for floating macOS Dock */}
        <main id="main" className="main-content pb-28 sm:pb-32">
          {children}
          <footer className="mt-14 hidden sm:flex justify-between border-t border-white/10 pt-6 text-xs text-muted-foreground">
            <span>A little clarity. A little progress.</span>
            <span>Buddio AI · Modern macOS Dock Suite</span>
          </footer>
        </main>

        {/* macOS-inspired Magnified Floating Bottom Dock */}
        <MacDock items={navItems} />
      </div>

      {/* Global Quick Search Modal */}
      <FormModal
        open={search}
        onOpenChange={setSearch}
        title="Find a page or view"
        description="Quick jump to any module or setting in your workspace."
      >
        <label className="sr-only" htmlFor="page-search">
          Search pages
        </label>
        <input
          autoFocus
          id="page-search"
          className="field"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Dashboard, tasks, notes, calendar, settings…"
        />
        <div className="mt-4 grid gap-2 max-h-72 overflow-y-auto pr-1">
          {[
            ['Dashboard', '/dashboard'],
            ['Tasks & Checklist', '/tasks'],
            ['Notes & Markdown', '/notes'],
            ['Calendar & Reminders', '/calendar'],
            ['Gemini AI Assistant', '/assistant'],
            ['Productivity & Habits', '/productivity'],
            ['Expense Tracker', '/expenses'],
            ['Bookmarks Library', '/bookmarks'],
            ['Project Boards', '/projects'],
            ['Cloud File Assets', '/files'],
            ['Settings & Preferences', '/settings'],
          ]
            .filter(([label]) => label.toLowerCase().includes(term.toLowerCase()))
            .map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setSearch(false)}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-3 text-sm text-foreground transition hover:border-white/15 hover:bg-white/[0.08]"
              >
                <span>{label}</span>
                <span className="text-xs text-muted-foreground">Jump</span>
              </Link>
            ))}
        </div>
      </FormModal>

      {/* Notifications Inbox Modal */}
      <FormModal
        open={notifications}
        onOpenChange={setNotifications}
        title="Notifications"
        description="Your private system notification inbox."
      >
        <NotificationList />
      </FormModal>

      {/* Confirm Logout Modal */}
      <ConfirmDialog
        open={logout}
        onOpenChange={setLogout}
        title="Log out of your workspace?"
        description="This session will be revoked immediately. Your saved data stays secure."
        onConfirm={signOut}
        pending={busy}
      />
    </SessionContext.Provider>
  );
}

function NotificationList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      api<{ id: string; title: string; body: string; readAt: string | null }[]>('/notifications'),
  });
  const client = useQueryClient();

  return (
    <div className="space-y-3">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading notifications…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-red-300">{error.message}</p>
      ) : !data?.length ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          You&apos;re all caught up. No notifications yet.
        </p>
      ) : (
        data.map((n) => (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2" key={n.id}>
            <h3 className="font-medium text-foreground text-sm">{n.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{n.body}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await api(`/notifications/${n.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ read: !n.readAt }),
                  });
                  await client.invalidateQueries({ queryKey: ['notifications'] });
                  await client.invalidateQueries({ queryKey: ['dashboard'] });
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              {n.readAt ? 'Mark unread' : 'Mark read'}
            </Button>
          </div>
        ))
      )}
    </div>
  );
}
