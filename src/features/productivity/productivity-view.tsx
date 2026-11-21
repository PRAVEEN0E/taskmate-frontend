'use client';
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GlassCard, PageHeader, EmptyState, StatCard } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { FormModal } from '@/components/ui/dialog';
import {
  Play,
  Pause,
  RotateCcw,
  Target,
  Plus,
  Check,
  Clock,
  Flame,
  Volume2,
  VolumeX,
  CalendarCheck,
  Award,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export function ProductivityView() {
  const queryClient = useQueryClient();

  // Mode: 25 min Work, 5 min Short Break, 15 min Long Break
  const [timerMode, setTimerMode] = useState<'WORK' | 'SHORT' | 'LONG'>('WORK');
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Modals
  const [habitModal, setHabitModal] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [goalModal, setGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalMilestones, setGoalMilestones] = useState('');

  // 1. Fetch Habits
  const { data: habits = [] } = useQuery<any[]>({
    queryKey: ['habits'],
    queryFn: () => api<any[]>('/habits'),
  });

  // 2. Fetch Goals
  const { data: goals = [] } = useQuery<any[]>({
    queryKey: ['goals'],
    queryFn: () => api<any[]>('/goals'),
  });

  // 3. Fetch Analytics
  const { data: analytics = { totalTasks: 0, completedTasks: 0, totalFocusMinutes: 0 } } = useQuery<any>({
    queryKey: ['analytics'],
    queryFn: () => api<any>('/analytics'),
  });

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds((s) => s - 1);
        } else if (minutes > 0) {
          setMinutes((m) => m - 1);
          setSeconds(59);
        } else {
          setIsActive(false);
          const duration = timerMode === 'WORK' ? 25 * 60 : 5 * 60;
          recordFocusMutation.mutate({ durationSeconds: duration });
          toast.success(`${timerMode === 'WORK' ? 'Focus session' : 'Break'} finished!`);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds, timerMode]);

  function switchTimerMode(m: 'WORK' | 'SHORT' | 'LONG') {
    setIsActive(false);
    setTimerMode(m);
    if (m === 'WORK') {
      setMinutes(25);
      setSeconds(0);
    } else if (m === 'SHORT') {
      setMinutes(5);
      setSeconds(0);
    } else {
      setMinutes(15);
      setSeconds(0);
    }
  }

  const recordFocusMutation = useMutation({
    mutationFn: (data: any) =>
      api('/focus-sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['analytics'] }),
  });

  // Habit Toggle
  const todayStr = new Date().toISOString().slice(0, 10);
  const toggleHabitMutation = useMutation({
    mutationFn: (habitId: string) =>
      api(`/habits/${habitId}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ date: todayStr }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  const createHabitMutation = useMutation({
    mutationFn: (name: string) =>
      api('/habits', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setHabitModal(false);
      setHabitName('');
      toast.success('Habit tracked');
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: any) =>
      api('/goals', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setGoalModal(false);
      setGoalTitle('');
      setGoalMilestones('');
      toast.success('Goal roadmap defined');
    },
  });

  const toggleMilestoneMutation = useMutation({
    mutationFn: ({ goalId, milestoneId }: { goalId: string; milestoneId: string }) =>
      api(`/goals/${goalId}/milestones/${milestoneId}/toggle`, {
        method: 'POST',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  // Generate 14-day streak days
  const last14Days = useMemo(() => {
    const list = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push(d.toISOString().slice(0, 10));
    }
    return list;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Flow & Discipline"
        title="Productivity System"
        description="Interval Pomodoro timer, 14-day habit heatmaps, and target milestone roadmaps."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setGoalModal(true)} className="gap-2">
              <Award size={15} /> Define Goal
            </Button>
            <Button onClick={() => setHabitModal(true)} className="gap-2">
              <Plus size={16} /> Track Habit
            </Button>
          </div>
        }
      />

      {/* Top Metrics Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title="Total Focus"
          value={`${analytics.totalFocusMinutes || 0}m`}
          detail="Total deep work logged"
          icon={<Clock className="text-sky-400" size={18} />}
        />
        <StatCard
          title="Habits Tracked"
          value={habits.length}
          detail="Active routines"
          icon={<Flame className="text-amber-400" size={18} />}
        />
        <StatCard
          title="Task Ratio"
          value={`${analytics.taskCompletionRate || 0}%`}
          detail={`${analytics.completedTasks || 0} closed`}
          icon={<Check className="text-emerald-400" size={18} />}
        />
        <StatCard
          title="Active Goals"
          value={goals.length}
          detail="Strategic milestones"
          icon={<Target className="text-violet-400" size={18} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Pomodoro Timer (5 cols) */}
        <div className="lg:col-span-5">
          <GlassCard className="flex flex-col items-center justify-center p-8 text-center h-full">
            {/* Mode switch */}
            <div className="flex rounded-xl border border-border bg-black/30 p-1 text-xs mb-6">
              <button
                onClick={() => switchTimerMode('WORK')}
                className={`rounded-lg px-3 py-1 font-semibold transition ${
                  timerMode === 'WORK' ? 'bg-sky-500/20 text-sky-200' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Focus (25m)
              </button>
              <button
                onClick={() => switchTimerMode('SHORT')}
                className={`rounded-lg px-3 py-1 font-semibold transition ${
                  timerMode === 'SHORT' ? 'bg-emerald-500/20 text-emerald-200' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Short (5m)
              </button>
              <button
                onClick={() => switchTimerMode('LONG')}
                className={`rounded-lg px-3 py-1 font-semibold transition ${
                  timerMode === 'LONG' ? 'bg-violet-500/20 text-violet-200' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Long (15m)
              </button>
            </div>

            <div className="my-2 text-7xl font-mono font-bold tracking-tight text-foreground">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>

            <span className="text-xs text-muted-foreground uppercase tracking-widest mt-2 mb-8">
              {isActive ? 'Session In Progress' : 'Ready to start'}
            </span>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsActive(!isActive)}
                className={`gap-2 min-w-32 ${isActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-sky-500 hover:bg-sky-600'}`}
              >
                {isActive ? <Pause size={16} /> : <Play size={16} />}
                {isActive ? 'Pause' : 'Start Focus'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => switchTimerMode(timerMode)}
                title="Reset timer"
              >
                <RotateCcw size={16} />
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Habits Heatmap & List (7 cols) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Daily Habit Streaks (Last 14 Days)</h3>
            <span className="text-xs text-muted-foreground">Click to mark today</span>
          </div>

          <div className="space-y-3">
            {habits.length === 0 ? (
              <EmptyState title="No habits tracked" description="Add routines like reading, exercise, or meditation." />
            ) : (
              habits.map((habit) => {
                const doneToday = habit.logs?.some((l: any) => l.date === todayStr);

                return (
                  <GlassCard key={habit.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">{habit.name}</h4>
                        <span className="text-[11px] text-muted-foreground">{habit.logs?.length || 0} total days recorded</span>
                      </div>
                      <Button
                        size="sm"
                        variant={doneToday ? 'default' : 'outline'}
                        onClick={() => toggleHabitMutation.mutate(habit.id)}
                        className={`gap-1.5 text-xs ${doneToday ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                      >
                        <Check size={14} /> {doneToday ? 'Completed Today' : 'Mark Done'}
                      </Button>
                    </div>

                    {/* GitHub-style 14-day Heatmap Dots */}
                    <div className="flex items-center gap-1.5 border-t border-border pt-2.5">
                      <span className="text-[10px] text-muted-foreground mr-1">History:</span>
                      {last14Days.map((d) => {
                        const isLogged = habit.logs?.some((l: any) => l.date === d);
                        return (
                          <div
                            key={d}
                            title={`${d}: ${isLogged ? 'Completed' : 'Missed'}`}
                            className={`h-4 w-4 rounded-md transition ${
                              isLogged ? 'bg-emerald-400 shadow-sm' : 'bg-white/10'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </GlassCard>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Goal Milestones Section */}
      <div className="space-y-3 border-t border-border pt-6">
        <h3 className="text-base font-semibold">Strategic Goals & Milestones</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => {
            const total = goal.milestones?.length || 0;
            const completed = goal.milestones?.filter((m: any) => m.completed).length || 0;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <GlassCard key={goal.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-semibold">{goal.title}</h4>
                  <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-bold text-sky-300">
                    {pct}% Achieved
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-sky-400 transition-all duration-300" style={{ width: `${pct}%` }} />
                </div>
                <div className="space-y-1.5 pt-1">
                  {goal.milestones?.map((m: any) => (
                    <div
                      key={m.id}
                      onClick={() => toggleMilestoneMutation.mutate({ goalId: goal.id, milestoneId: m.id })}
                      className="flex items-center gap-2 text-xs cursor-pointer hover:text-sky-300"
                    >
                      <div className={`h-3 w-3 rounded border ${m.completed ? 'bg-sky-400 border-sky-400' : 'border-muted-foreground'}`} />
                      <span className={m.completed ? 'line-through text-muted-foreground' : ''}>{m.title}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Habit Modal */}
      <FormModal open={habitModal} onOpenChange={setHabitModal} title="Track Habit" description="Add a daily routine.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (habitName.trim()) createHabitMutation.mutate(habitName.trim());
          }}
          className="space-y-4"
        >
          <input
            type="text"
            required
            placeholder="e.g. Read 30 pages of engineering books"
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            className="w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setHabitModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Track Habit</Button>
          </div>
        </form>
      </FormModal>

      {/* Goal Modal */}
      <FormModal open={goalModal} onOpenChange={setGoalModal} title="Establish Strategic Goal" description="Define an objective with milestones.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const milestones = goalMilestones.split('\n').map((s) => s.trim()).filter(Boolean);
            createGoalMutation.mutate({ title: goalTitle, milestones });
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-muted-foreground">Goal Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Launch TaskMate AI Production Deployment"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Milestones (One per line)</label>
            <textarea
              placeholder="Database migration verified&#10;SSL configured&#10;Vercel deployed"
              rows={3}
              value={goalMilestones}
              onChange={(e) => setGoalMilestones(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setGoalModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Define Goal</Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
