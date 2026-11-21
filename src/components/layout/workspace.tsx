'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Sparkles,
  Timer,
  Wallet,
  Bookmark,
  GraduationCap,
  BookHeart,
  Layers,
  Folder,
  Settings,
  LogOut,
  Search,
  Menu,
  ShieldCheck,
  ChevronDown,
  X,
  Bell,
} from 'lucide-react';
import { api, setCsrf } from '@/lib/api';
import type { Session } from '@/lib/types';
import { SessionContext } from '@/hooks/use-session';
import { useUI } from '@/store/ui';
import { Button } from '@/components/ui/button';
import { FormModal } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { toast } from 'sonner';
const modules = [
  ['Tasks', CheckSquare, '/tasks'],
  ['Notes', BookHeart, '/notes'],
  ['Calendar', CalendarDays, '/calendar'],
  ['AI Assistant', Sparkles, '/assistant'],
  ['Productivity', Timer, '/productivity'],
  ['Expenses', Wallet, '/expenses'],
  ['Bookmarks', Bookmark, '/bookmarks'],
  ['Learning', GraduationCap, '/learning'],
  ['Journal', BookHeart, '/journal'],
  ['Projects', Layers, '/projects'],
  ['Files', Folder, '/files'],
] as const;
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
  const { sidebarOpen, setSidebarOpen } = useUI();
  const [planned, setPlanned] = useState(''),
    [search, setSearch] = useState(false),
    [term, setTerm] = useState(''),
    [logout, setLogout] = useState(false),
    [busy, setBusy] = useState(false),
    [notifications, setNotifications] = useState(false);
  const { data: session = initialSession } = useQuery({
    queryKey: ['session'],
    queryFn: () => api<Session>('/auth/me'),
    initialData: initialSession,
    refetchInterval: 60000,
    retry: false,
  });
  useEffect(() => setCsrf(session.csrfToken), [session.csrfToken]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      document.documentElement.dataset.theme =
        session.settings.theme === 'system'
          ? media.matches
            ? 'light'
            : 'dark'
          : session.settings.theme;
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [session.settings.theme]);
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);
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
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="ambient" aria-hidden="true" />
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <Link className="mb-6 flex items-center gap-3 px-2 shrink-0" href="/dashboard" onClick={() => setSidebarOpen(false)}>
          <span className="brand-icon">
            <Layers size={22} />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            TaskMate<span className="ml-1 text-sky-200">AI</span>
          </span>
        </Link>
        <div className="mb-2 px-3 text-[11px] uppercase tracking-[.2em] text-muted-foreground shrink-0">
          Your workspace
        </div>
        <nav aria-label="Main navigation" className="space-y-0.5">
          <Link
            href="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className={`nav-item ${pathname === '/dashboard' ? 'selected' : ''}`}
            aria-current={pathname === '/dashboard' ? 'page' : undefined}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          {modules.map(([title, Icon, path]) => (
            <Link
              key={title}
              href={path}
              onClick={() => setSidebarOpen(false)}
              className={`nav-item ${pathname === path ? 'selected' : ''}`}
              aria-current={pathname === path ? 'page' : undefined}
            >
              <Icon size={18} />
              <span>{title}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-6 pt-4 border-t border-border shrink-0">
          <Link
            href="/settings"
            onClick={() => setSidebarOpen(false)}
            className={`nav-item ${pathname === '/settings' ? 'selected' : ''}`}
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
          <button className="nav-item w-full text-red-300 hover:text-red-200" onClick={() => { setSidebarOpen(false); setLogout(true); }}>
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <Button
            size="icon"
            variant="ghost"
            className="lg:hidden"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </Button>
          <button className="search-trigger" onClick={() => setSearch(true)}>
            <Search size={17} />
            <span className="hidden sm:inline">Find a workspace page</span>
            <span className="sm:hidden">Search</span>
          </button>
          <div className="ml-auto hidden text-sm text-muted-foreground md:block">
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
          >
            <Bell size={19} />
          </Button>
          <Link href="/settings" className="profile-link" aria-label="Open profile settings">
            <span className="avatar">{session.owner.name.slice(0, 1).toUpperCase()}</span>
            <span className="hidden text-sm sm:block">{session.owner.name}</span>
            <ChevronDown size={14} />
          </Link>
        </header>
        <main id="main" className="main-content pb-24 lg:pb-10">
          {children}
          <footer className="mt-10 hidden sm:flex justify-between border-t border-border pt-6 text-xs text-muted-foreground">
            <span>A little clarity. A little progress.</span>
            <span>TaskMate AI · Single Owner System</span>
          </footer>
        </main>

        {/* Mobile PWA Bottom Navigation Bar */}
        <nav
          aria-label="Mobile navigation"
          className="fixed bottom-0 inset-x-0 z-40 flex h-16 items-center justify-around border-t border-border bg-slate-950/90 px-2 backdrop-blur-xl lg:hidden shadow-2xl"
        >
          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-1 text-[10px] font-medium transition ${
              pathname === '/dashboard' ? 'text-sky-300' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutDashboard size={18} />
            <span>Home</span>
          </Link>
          <Link
            href="/tasks"
            className={`flex flex-col items-center gap-1 text-[10px] font-medium transition ${
              pathname === '/tasks' ? 'text-sky-300' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckSquare size={18} />
            <span>Tasks</span>
          </Link>
          <Link
            href="/calendar"
            className={`flex flex-col items-center gap-1 text-[10px] font-medium transition ${
              pathname === '/calendar' ? 'text-sky-300' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CalendarDays size={18} />
            <span>Calendar</span>
          </Link>
          <Link
            href="/assistant"
            className={`flex flex-col items-center gap-1 text-[10px] font-medium transition ${
              pathname === '/assistant' ? 'text-sky-300' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles size={18} />
            <span>AI</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition"
          >
            <Menu size={18} />
            <span>More</span>
          </button>
        </nav>
      </div>
      <FormModal
        open={!!planned}
        onOpenChange={() => setPlanned('')}
        title={planned}
        description="Your workspace is being built one complete feature at a time."
      >
        <ol className="space-y-3 text-sm text-muted-foreground">
          {[
            'Foundation, secure login & dashboard — current',
            'Tasks, notes, calendar & reliable reminders',
            'Gemini assistant, focus sessions, habits & goals',
            'Expenses, bookmarks, learning, journal & projects',
            'Private files & attachments',
            'End-to-end testing, hardening & deployment',
          ].map((item, i) => (
            <li key={item} className="flex gap-3">
              <span className="text-sky-200">{i + 1}.</span>
              {item}
            </li>
          ))}
        </ol>
        <p className="mt-6 rounded-lg bg-white/5 p-3 text-xs text-muted-foreground">
          Only foundation features are available in this version. No sample records are added to
          your workspace.
        </p>
      </FormModal>
      <FormModal
        open={search}
        onOpenChange={setSearch}
        title="Find a page"
        description="Search the available workspace pages. Record search arrives with the core modules."
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
          placeholder="Dashboard, settings…"
        />
        <div className="mt-4 grid gap-2">
          {[
            ['Dashboard', '/dashboard'],
            ['Settings', '/settings'],
          ]
            .filter(([label]) => label.toLowerCase().includes(term.toLowerCase()))
            .map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setSearch(false)}
                className="rounded-lg p-3 hover:bg-white/10"
              >
                {label}
              </Link>
            ))}
          {!['dashboard', 'settings'].some((x) => x.includes(term.toLowerCase())) && (
            <p className="py-4 text-sm text-muted-foreground">No matching pages.</p>
          )}
        </div>
      </FormModal>
      <FormModal
        open={notifications}
        onOpenChange={setNotifications}
        title="Notifications"
        description="Your private notification inbox."
      >
        <NotificationList />
      </FormModal>
      <ConfirmDialog
        open={logout}
        onOpenChange={setLogout}
        title="Log out of your workspace?"
        description="This session will be revoked immediately. Your saved data stays safe."
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
        <p>Loading notifications…</p>
      ) : error ? (
        <p role="alert">{error.message}</p>
      ) : !data?.length ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          You&apos;re all caught up. No notifications yet.
        </p>
      ) : (
        data.map((n) => (
          <div className="rounded-xl border border-border p-4" key={n.id}>
            <h3 className="font-medium">{n.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
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
