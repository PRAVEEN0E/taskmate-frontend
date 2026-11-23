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
  Award,
  Wallet,
  HardDrive,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Brain,
  Timer,
  Bookmark,
  FileUp,
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
      <GlassCard className="text-center py-12">
        <h1 className="text-xl font-medium text-foreground">Your dashboard couldn&apos;t load.</h1>
        <p role="alert" className="my-4 text-sm text-muted-foreground">
          {error?.message ?? 'No response from your workspace.'}
        </p>
        <Button variant="default" onClick={() => void refetch()}>Try again</Button>
      </GlassCard>
    );

  const date = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: settings.timezone,
  }).format(new Date());

  const progressPct =
    data.completed + data.pending > 0
      ? Math.round((data.completed / (data.completed + data.pending)) * 100)
      : 0;

  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
      {/* Page Header */}
      <PageHeader
        eyebrow={date}
        title={`A little more clarity, ${owner.name.split(' ')[0]}.`}
        description="Your day, your priorities. All in one calm, translucent workspace."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()}>
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </Button>
            <Button asChild variant="default" size="sm">
              <Link href="/tasks">
                <Plus size={14} />
                <span>Quick Add</span>
              </Link>
            </Button>
          </div>
        }
      />

      {/* Featured AI Daily Briefing Glass Card */}
      <GlassCard className="relative overflow-hidden border-white/20 bg-gradient-to-br from-white/[0.09] via-white/[0.04] to-[#8ea9e8]/[0.08] p-7 shadow-[0_16px_48px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-medium text-[#8ea9e8]">
              <Sparkles size={13} className="text-[#8ea9e8]" />
              <span>AI Daily Briefing</span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Focus on 3 high-impact deliverables today.
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              You have <span className="font-medium text-foreground">{data.pending} pending tasks</span> and{' '}
              <span className="font-medium text-foreground">{data.todayTasks.length} scheduled</span> for today.{' '}
              {data.overdue > 0 ? (
                <span className="text-amber-300 font-medium">{data.overdue} task is overdue. </span>
              ) : (
                'All deadlines are on track. '
              )}
              Maintain your daily cadence with a 25-minute Pomodoro focus block.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="glass" size="sm">
              <Link href="/assistant">
                <Brain size={14} className="text-[#b8a9dd]" />
                <span>Ask Assistant</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/productivity">
                <Timer size={14} className="text-[#8ea9e8]" />
                <span>Start Focus</span>
              </Link>
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Quick Action Dock */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Add Task', href: '/tasks', icon: CheckSquare, color: 'text-sky-300' },
          { label: 'New Note', href: '/notes', icon: NotebookPen, color: 'text-purple-300' },
          { label: 'Log Expense', href: '/expenses', icon: Wallet, color: 'text-emerald-300' },
          { label: 'Add Project', href: '/projects', icon: Layers, color: 'text-amber-300' },
          { label: 'Save Link', href: '/bookmarks', icon: Bookmark, color: 'text-pink-300' },
          { label: 'Upload File', href: '/files', icon: FileUp, color: 'text-blue-300' },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center transition-all duration-200 hover:border-white/25 hover:bg-white/[0.09] hover:shadow-lg active:scale-95"
          >
            <div className="rounded-xl border border-white/15 bg-white/[0.05] p-2.5 transition group-hover:scale-110">
              <action.icon size={18} className={action.color} />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
              {action.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Primary Productivity Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pending Tasks"
          value={data.pending}
          detail={`${data.overdue} overdue`}
          icon={<CheckSquare size={18} />}
          trend={data.overdue > 0 ? 'Needs attention' : 'On track'}
        />
        <StatCard
          title="Completed Today"
          value={data.completed}
          detail={`${progressPct}% daily completion rate`}
          icon={<CheckCheck size={18} />}
          trend={`${progressPct}% done`}
        />
        <StatCard
          title="Focus Time"
          value={`${Math.floor(data.focusSeconds / 60)} min`}
          detail="Target: 120 mins / day"
          icon={<Clock size={18} />}
          trend="Pomodoro logged"
        />
        <StatCard
          title="Monthly Spend"
          value={`${data.currency} ${data.monthExpense}`}
          detail="Financial budget tracker"
          icon={<Wallet size={18} />}
          trend="Active cycle"
        />
      </div>

      {/* Multi-Column Main Dashboard Widgets */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Left Column: Today's Tasks Checklist (2 Spanning Columns) */}
        <GlassCard className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-[#8ea9e8]">
                <CheckSquare size={16} />
              </div>
              <h2 className="text-base font-semibold text-foreground">Today&apos;s Priority Checklist</h2>
            </div>
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#8ea9e8] hover:text-[#b8a9dd] transition"
            >
              <span>View All</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          {!data.todayTasks.length ? (
            <EmptyState
              title="A clear page for today"
              description="No tasks due today. Use Quick Add or visit the Tasks module to plan your milestones."
              icon={<CheckSquare size={26} />}
            />
          ) : (
            <ul className="divide-y divide-white/10">
              {data.todayTasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-4 py-3 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-4 w-4 shrink-0 rounded-full border border-white/30 group-hover:border-[#8ea9e8] transition" />
                    <span className="truncate text-sm text-foreground">{task.title}</span>
                  </div>
                  <span className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs capitalize text-muted-foreground">
                    {task.status.replaceAll('_', ' ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        {/* Right Column Widget: Circular Focus Mode Ring */}
        <GlassCard className="space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-[#8ea9e8]">
                <Timer size={16} />
              </div>
              <h2 className="text-base font-semibold text-foreground">Focus Mode</h2>
            </div>
            <Link
              href="/productivity"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#8ea9e8] hover:text-[#b8a9dd] transition"
            >
              <span>Timer</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="py-4 text-center space-y-4">
            <div className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/10 bg-white/[0.03] shadow-[0_0_32px_rgba(142,169,232,0.15)]">
              <div className="text-center">
                <span className="text-3xl font-light tracking-tight text-foreground">
                  {settings.focusMinutes}:00
                </span>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Session
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Deep work cycle configured for <span className="text-foreground">{settings.focusMinutes} minutes</span>.
            </p>
          </div>

          <Button asChild variant="default" className="w-full">
            <Link href="/productivity">
              <Clock size={15} />
              <span>Launch Focus Session</span>
            </Link>
          </Button>
        </GlassCard>
      </div>

      {/* Secondary Dashboard Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {/* Active Projects */}
        <GlassCard hover className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 text-xs font-semibold text-foreground">
            <span className="flex items-center gap-2">
              <Layers size={15} className="text-[#8ea9e8]" />
              Active Projects
            </span>
            <Link href="/projects" className="text-muted-foreground hover:text-foreground">
              <ArrowUpRight size={13} />
            </Link>
          </div>
          {data.projects.length ? (
            <ul className="space-y-2">
              {data.projects.slice(0, 3).map((p) => (
                <li key={p.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-foreground truncate">
                  {p.title}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No active projects"
              description="Create a project board to organize strategic goals."
              icon={<Layers size={20} />}
            />
          )}
        </GlassCard>

        {/* Recent Notes */}
        <GlassCard hover className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 text-xs font-semibold text-foreground">
            <span className="flex items-center gap-2">
              <NotebookPen size={15} className="text-[#b8a9dd]" />
              Recent Notes
            </span>
            <Link href="/notes" className="text-muted-foreground hover:text-foreground">
              <ArrowUpRight size={13} />
            </Link>
          </div>
          {data.notes.length ? (
            <ul className="space-y-2">
              {data.notes.slice(0, 3).map((n) => (
                <li key={n.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-foreground truncate">
                  {n.title}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No notes yet"
              description="Capture your thoughts with the rich markdown notes editor."
              icon={<NotebookPen size={20} />}
            />
          )}
        </GlassCard>

        {/* Productivity System */}
        <GlassCard hover className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 text-xs font-semibold text-foreground">
            <span className="flex items-center gap-2">
              <Timer size={15} className="text-emerald-300" />
              Productivity Flow
            </span>
            <Link href="/productivity" className="text-muted-foreground hover:text-foreground">
              <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="py-2">
            <p className="text-2xl font-semibold text-foreground">
              {Math.round((data.focusSeconds || 0) / 60)}{' '}
              <span className="text-xs font-normal text-muted-foreground">mins focused</span>
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Pomodoro interval timer, habit streaks, and goal roadmap milestones.
            </p>
          </div>
        </GlassCard>

        {/* Cloud Storage Usage */}
        <GlassCard hover className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 text-xs font-semibold text-foreground">
            <span className="flex items-center gap-2">
              <HardDrive size={15} className="text-sky-300" />
              Private Storage
            </span>
            <Link href="/files" className="text-muted-foreground hover:text-foreground">
              <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="py-2">
            <p className="text-2xl font-semibold text-foreground">
              {String(BigInt(data.storageBytes) / 1024n)}{' '}
              <span className="text-xs font-normal text-muted-foreground">KB used</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {data.fileCount} attachments safely backed up.
            </p>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}
