'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import {
  CheckCheck,
  CheckSquare,
  Clock,
  CalendarDays,
  Layers,
  NotebookPen,
  GraduationCap,
  Wallet,
  HardDrive,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Dashboard } from '@/lib/types';
import { useSession } from '@/hooks/use-session';
import { GlassCard, StatCard, EmptyState, PageHeader, LoadingSkeleton } from '@/components/shared';
import { Button } from '@/components/ui/button';
export function DashboardView() {
  const { owner, settings } = useSession(),
    reduce = useReducedMotion();
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<Dashboard>('/dashboard'),
  });
  if (isLoading) return <LoadingSkeleton />;
  if (error || !data)
    return (
      <GlassCard>
        <h1 className="text-xl">Your dashboard couldn&apos;t load.</h1>
        <p role="alert" className="my-4 text-muted-foreground">
          {error?.message ?? 'No response from your workspace.'}
        </p>
        <Button onClick={() => void refetch()}>Try again</Button>
      </GlassCard>
    );
  const date = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: settings.timezone,
  }).format(new Date());
  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        eyebrow={date}
        title={`A little more clarity, ${owner.name.split(' ')[0]}.`}
        description="Your day, your priorities. All in one calm space."
        action={
          <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </Button>
        }
      />
      <GlassCard className="hero-panel mb-7 flex flex-wrap items-center justify-between gap-6">
        <div className="flex max-w-2xl items-start gap-4">
          <div className="rounded-xl border border-border bg-white/5 p-3 text-sky-200">
            <ShieldCheck size={23} />
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-[.16em] text-sky-200">
              A fresh beginning
            </p>
            <h2 className="text-lg font-medium">Your private workspace is taking shape.</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Start by making it yours. Set your timezone, choose your theme, and adjust your focus
              preferences.
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/settings">
            <SlidersHorizontal size={16} />
            Personalize workspace
          </Link>
        </Button>
      </GlassCard>
      <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pending tasks"
          value={data.pending}
          detail={`${data.overdue} overdue`}
          icon={<CheckSquare size={18} />}
        />
        <StatCard
          title="Completed today"
          value={data.completed}
          detail="Every small win counts"
          icon={<CheckCheck size={18} />}
        />
        <StatCard
          title="Focus time"
          value={`${Math.floor(data.focusSeconds / 60)} min`}
          detail="Completed sessions today"
          icon={<Clock size={18} />}
        />
        <StatCard
          title="This month's spending"
          value={`${data.currency} ${data.monthExpense}`}
          detail="Recorded expenses in your currency"
          icon={<Wallet size={18} />}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <GlassCard className="xl:col-span-2">
          <div className="card-heading">
            <h2>Today&apos;s tasks</h2>
            <CheckSquare />
          </div>
          {!data.todayTasks.length ? (
            <EmptyState
              title="A clear page for today"
              description="No tasks due today. Task creation arrives with the core productivity phase."
              icon={<CheckSquare size={27} />}
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.todayTasks.map((task) => (
                <li key={task.id} className="flex items-center gap-3 py-4">
                  <span className="h-4 w-4 rounded-full border border-slate-400" />
                  <span className="flex-1 text-sm">{task.title}</span>
                  <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-muted-foreground">
                    {task.status.replaceAll('_', ' ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
        <GlassCard>
          <div className="card-heading">
            <h2>Your focus rhythm</h2>
            <Clock />
          </div>
          <div className="py-5 text-center">
            <div className="mx-auto grid h-28 w-28 place-content-center rounded-full border-4 border-sky-200/15">
              <span className="text-3xl font-light">{settings.focusMinutes}:00</span>
              <span className="text-xs text-muted-foreground">focus duration</span>
            </div>
            <p className="mb-4 mt-4 text-sm text-muted-foreground">
              Timer & session tracking · Phase 3
            </p>
            <Link href="/settings" className="text-sm text-sky-200 underline underline-offset-4">
              Adjust your rhythm
            </Link>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="card-heading">
            <h2>AI daily briefing</h2>
            <Sparkles />
          </div>
          <EmptyState
            title="A thoughtful start to your day"
            description="Gemini briefings arrive in Phase 3. Your data stays here until you enable AI features."
            icon={<Sparkles size={26} />}
          />
        </GlassCard>
        <GlassCard>
          <div className="card-heading">
            <h2>Active projects</h2>
            <Layers />
          </div>
          {data.projects.length ? (
            <ul className="space-y-4">
              {data.projects.map((p) => (
                <li key={p.id} className="rounded-lg bg-white/5 p-3 text-sm">
                  {p.title}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Room for your next idea"
              description="Your active projects will appear here once you create them in Phase 4."
              icon={<Layers size={26} />}
            />
          )}
        </GlassCard>
        <GlassCard>
          <div className="card-heading">
            <h2>Recent notes</h2>
            <NotebookPen />
          </div>
          {data.notes.length ? (
            <ul className="space-y-4">
              {data.notes.map((n) => (
                <li key={n.id} className="rounded-lg bg-white/5 p-3 text-sm">
                  {n.title}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Keep a little inspiration"
              description="Your recent notes will live here. The rich text editor arrives in Phase 2."
              icon={<NotebookPen size={26} />}
            />
          )}
        </GlassCard>
        <GlassCard>
          <div className="card-heading">
            <h2>Learning journey</h2>
            <GraduationCap />
          </div>
          <p className="text-2xl font-medium">
            {data.learningPaths}{' '}
            <span className="text-sm text-muted-foreground">learning paths</span>
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            A small step toward the person you want to become. Learning tools arrive in Phase 4.
          </p>
        </GlassCard>
        <GlassCard>
          <div className="card-heading">
            <h2>Calendar preview</h2>
            <CalendarDays />
          </div>
          <p className="text-sm text-muted-foreground">Your timezone</p>
          <p className="mt-1 text-lg">{data.timezone.replaceAll('_', ' ')}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Events and server-delivered reminders arrive in Phase 2.
          </p>
        </GlassCard>
        <GlassCard>
          <div className="card-heading">
            <h2>Your cloud storage</h2>
            <HardDrive />
          </div>
          <p className="text-2xl font-medium">
            {String(BigInt(data.storageBytes) / 1024n)}{' '}
            <span className="text-sm text-muted-foreground">KB recorded</span>
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {data.fileCount} files · Uploads and private Cloudinary delivery arrive in Phase 5.
          </p>
        </GlassCard>
      </div>
    </motion.div>
  );
}
