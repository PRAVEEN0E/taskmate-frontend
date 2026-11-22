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
  const [session, setSession] = useState(initialSession);

  // Initialize and synchronize CSRF token across page refreshes and navigations
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
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-20 bg-[#19183B]/30 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 3D Soft Clay Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <Link
          className="mb-6 flex items-center gap-3 px-2 shrink-0 group"
          href="/dashboard"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-2xl shadow-[4px_4px_10px_#c8c4e8,-3px_-3px_8px_#ffffff] border border-white/80 group-hover:scale-105 transition-transform">
            <Image
              src="/buddio-icon.png"
              alt="Buddio"
              fill
              className="object-cover"
              priority
            />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-[#19183B]">
            Buddio
          </span>
        </Link>

        <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[.22em] text-[#7864F6] shrink-0">
          Your workspace
        </div>

        <nav aria-label="Main navigation" className="space-y-1">
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

        <div className="mt-auto pt-6 border-t border-[#7864F6]/15 shrink-0">
          <Link
            href="/settings"
            onClick={() => setSidebarOpen(false)}
            className={`nav-item ${pathname === '/settings' ? 'selected' : ''}`}
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
          <button
            className="nav-item w-full text-[#F47C91] hover:text-[#e05b74] hover:bg-[#F47C91]/10"
            onClick={() => {
              setSidebarOpen(false);
              setLogout(true);
            }}
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="workspace">
        {/* Soft 3D Clay Topbar */}
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
            <Search size={16} className="text-[#7864F6]" />
            <span className="hidden sm:inline">Search pages, tasks, notes…</span>
            <span className="sm:hidden">Search</span>
            <kbd className="hidden sm:inline-block ml-4 rounded-lg border border-white bg-[#E9E8FF] px-2 py-0.5 text-[10px] text-[#666584] shadow-sm font-semibold">
              ⌘K
            </kbd>
          </button>

          <div className="ml-auto hidden text-xs font-semibold text-[#666584] md:block">
            {new Intl.DateTimeFormat('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              timeZone: session.settings.timezone,
            }).format(new Date())}
          </div>

          <Button
            size="icon"
            variant="glass"
            aria-label="Notifications"
            onClick={() => setNotifications(true)}
            className="rounded-2xl"
          >
            <Bell size={18} className="text-[#666584]" />
          </Button>

          <Link href="/settings" className="profile-link" aria-label="Open profile settings">
            <span className="avatar">{session.owner.name.slice(0, 1).toUpperCase()}</span>
            <span className="hidden text-xs font-bold text-[#19183B] sm:block">{session.owner.name}</span>
            <ChevronDown size={14} className="text-[#666584]" />
          </Link>
        </header>

        {/* Workspace Children Content */}
        <main id="main" className="main-content pb-24 lg:pb-12">
          {children}
          <footer className="mt-14 hidden sm:flex justify-between border-t border-[#7864F6]/15 pt-6 text-xs font-medium text-[#666584]">
            <span>A little clarity. A little progress.</span>
            <span>Buddio · Soft 3D Claymorphism Suite</span>
          </footer>
        </main>

        {/* Mobile PWA Bottom Clay Navigation Bar */}
        <nav
          aria-label="Mobile navigation"
          className="fixed bottom-3 inset-x-3 z-40 flex h-16 items-center justify-around rounded-[24px] border-2 border-white bg-[#F3F1FF] px-3 shadow-[6px_6px_20px_#c7c4e6,-6px_-6px_20px_#ffffff] lg:hidden"
        >
          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
              pathname === '/dashboard' ? 'text-[#7864F6]' : 'text-[#666584]'
            }`}
          >
            <LayoutDashboard size={18} />
            <span>Home</span>
          </Link>
          <Link
            href="/tasks"
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
              pathname === '/tasks' ? 'text-[#7864F6]' : 'text-[#666584]'
            }`}
          >
            <CheckSquare size={18} />
            <span>Tasks</span>
          </Link>
          <Link
            href="/calendar"
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
              pathname === '/calendar' ? 'text-[#7864F6]' : 'text-[#666584]'
            }`}
          >
            <CalendarDays size={18} />
            <span>Calendar</span>
          </Link>
          <Link
            href="/assistant"
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
              pathname === '/assistant' ? 'text-[#7864F6]' : 'text-[#666584]'
            }`}
          >
            <Sparkles size={18} />
            <span>AI</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-1 text-[10px] font-bold text-[#666584]"
          >
            <Menu size={18} />
            <span>More</span>
          </button>
        </nav>
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
        <div className="mt-4 grid gap-2">
          {[
            ['Dashboard', '/dashboard'],
            ['Tasks & Checklist', '/tasks'],
            ['Notes & Markdown', '/notes'],
            ['Calendar & Reminders', '/calendar'],
            ['Gemini AI Assistant', '/assistant'],
            ['Productivity & Habits', '/productivity'],
            ['Expense Tracker', '/expenses'],
            ['Bookmarks Library', '/bookmarks'],
            ['Learning Roadmaps', '/learning'],
            ['Private Journal', '/journal'],
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
                className="flex items-center justify-between rounded-2xl border border-white bg-[#E9E8FF] p-3.5 text-sm font-semibold text-[#19183B] shadow-[2px_2px_6px_#cecced,-2px_-2px_6px_#ffffff] transition hover:-translate-y-0.5"
              >
                <span>{label}</span>
                <span className="text-xs text-[#7864F6]">Jump →</span>
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
        <p className="text-sm text-[#666584]">Loading notifications…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-[#F47C91]">{error.message}</p>
      ) : !data?.length ? (
        <p className="py-8 text-center text-sm font-medium text-[#666584]">
          You&apos;re all caught up. No notifications yet.
        </p>
      ) : (
        data.map((n) => (
          <div className="rounded-2xl border border-white bg-[#E9E8FF] p-4 space-y-2 shadow-[2px_2px_6px_#cecced,-2px_-2px_6px_#ffffff]" key={n.id}>
            <h3 className="font-bold text-[#19183B] text-sm">{n.title}</h3>
            <p className="text-xs text-[#666584] leading-relaxed font-medium">{n.body}</p>
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
