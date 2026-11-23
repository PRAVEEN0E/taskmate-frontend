'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
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
  Award,
  Sparkles,
  Trash2,
  CheckCircle2,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

export function ProductivityView() {
  const queryClient = useQueryClient();

  // Mode: 25 min Focus, 5 min Short Break, 15 min Long Break
  const [timerMode, setTimerMode] = useState<'WORK' | 'SHORT' | 'LONG'>('WORK');
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Audio beep synthesized via Web Audio API (zero external assets needed)
  const playSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
  };

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
  const { data: analytics = { totalTasks: 0, completedTasks: 0, totalFocusMinutes: 0, taskCompletionRate: 0 } } = useQuery<any>({
    queryKey: ['analytics'],
    queryFn: () => api<any>('/analytics'),
  });

  // Pomodoro Progress calculation
  const totalModeSeconds = useMemo(() => {
    if (timerMode === 'WORK') return 25 * 60;
    if (timerMode === 'SHORT') return 5 * 60;
    return 15 * 60;
  }, [timerMode]);

  const remainingSeconds = minutes * 60 + seconds;
  const progressPercent = Math.min(100, Math.max(0, ((totalModeSeconds - remainingSeconds) / totalModeSeconds) * 100));

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
          playSound();
          const duration = timerMode === 'WORK' ? 25 * 60 : 5 * 60;
          recordFocusMutation.mutate({ durationSeconds: duration });
          toast.success(`${timerMode === 'WORK' ? 'Focus session' : 'Break'} finished! 🎉`);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds, timerMode, soundEnabled]);

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

  // Habit Mutations
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

  const deleteHabitMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/habits/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit removed');
    },
  });

  // Goal Mutations
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

  const deleteGoalMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/goals/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal removed');
    },
  });

  const toggleMilestoneMutation = useMutation({
    mutationFn: ({ goalId, milestoneId }: { goalId: string; milestoneId: string }) =>
      api(`/goals/${goalId}/milestones/${milestoneId}/toggle`, {
        method: 'POST',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  // 14-day streak days with weekday labels
  const last14Days = useMemo(() => {
    const list = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push({
        date: d.toISOString().slice(0, 10),
        dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        dayNum: d.getDate(),
      });
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
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setGoalModal(true)} className="gap-2 flex-1 sm:flex-initial">
              <Award size={15} /> Define Goal
            </Button>
            <Button onClick={() => setHabitModal(true)} className="gap-2 flex-1 sm:flex-initial">
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
          detail={`${analytics.completedTasks || 0} tasks done`}
          icon={<Check className="text-emerald-400" size={18} />}
        />
        <StatCard
          title="Active Goals"
          value={goals.length}
          detail="Strategic roadmaps"
          icon={<Target className="text-violet-400" size={18} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Modern Circular / Progress Pomodoro Timer (5 cols) */}
        <div className="lg:col-span-5">
          <GlassCard className="flex flex-col items-center justify-center p-6 sm:p-8 text-center h-full relative overflow-hidden">
            {/* Top Sound Control */}
            <div className="w-full flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8ea9e8]">
                <Zap size={14} />
                <span>Deep Focus Engine</span>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-muted-foreground hover:text-foreground transition p-1"
                title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-rose-400" />}
              </button>
            </div>

            {/* Mode switch */}
            <div className="flex rounded-xl border border-white/10 bg-white/[0.04] p-1 text-xs mb-6 w-full max-w-xs justify-between">
              <button
                onClick={() => switchTimerMode('WORK')}
                className={`flex-1 rounded-lg py-1.5 font-semibold transition ${
                  timerMode === 'WORK'
                    ? 'bg-[#8ea9e8]/20 text-white border border-[#8ea9e8]/30 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Focus (25m)
              </button>
              <button
                onClick={() => switchTimerMode('SHORT')}
                className={`flex-1 rounded-lg py-1.5 font-semibold transition ${
                  timerMode === 'SHORT'
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Short (5m)
              </button>
              <button
                onClick={() => switchTimerMode('LONG')}
                className={`flex-1 rounded-lg py-1.5 font-semibold transition ${
                  timerMode === 'LONG'
                    ? 'bg-violet-500/20 text-violet-200 border border-violet-400/30 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Long (15m)
              </button>
            </div>

            {/* Progress Circular Visualizer */}
            <div className="relative my-4 flex items-center justify-center">
              <svg className="w-48 h-48 sm:w-56 sm:h-56 -rotate-90 transform" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-white/10"
                  strokeWidth="5"
                  fill="transparent"
                />
                {/* Active Progress Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeDasharray={264}
                  strokeDashoffset={264 - (264 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className={`transition-all duration-1000 ease-linear ${
                    timerMode === 'WORK'
                      ? 'text-[#8ea9e8]'
                      : timerMode === 'SHORT'
                      ? 'text-emerald-400'
                      : 'text-violet-400'
                  }`}
                />
              </svg>

              {/* Digital Countdown Inside Ring */}
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-foreground">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mt-1">
                  {isActive ? 'Session Active' : 'Ready to Start'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <Button
                onClick={() => setIsActive(!isActive)}
                className={`gap-2 min-w-32 shadow-lg transition-all ${
                  isActive
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-[#7864F6] hover:bg-[#6c56f5] text-white'
                }`}
              >
                {isActive ? <Pause size={16} /> : <Play size={16} />}
                {isActive ? 'Pause' : 'Start Focus'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => switchTimerMode(timerMode)}
                title="Reset timer"
                className="h-10 w-10 p-0 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw size={16} />
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Habits Heatmap & List (7 cols) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Flame size={16} className="text-amber-400" />
              <span>Daily Habit Streaks</span>
            </h3>
            <span className="text-xs text-muted-foreground">Last 14 days</span>
          </div>

          <div className="space-y-3">
            {habits.length === 0 ? (
              <EmptyState title="No habits tracked" description="Add daily routines like reading, exercise, or meditation." />
            ) : (
              habits.map((habit) => {
                const doneToday = habit.logs?.some((l: any) => l.date === todayStr);

                // Calculate current streak
                let streakCount = 0;
                for (let i = 0; i < 30; i++) {
                  const checkD = new Date();
                  checkD.setDate(checkD.getDate() - i);
                  const str = checkD.toISOString().slice(0, 10);
                  if (habit.logs?.some((l: any) => l.date === str)) {
                    streakCount++;
                  } else if (i > 0) {
                    break;
                  }
                }

                return (
                  <GlassCard key={habit.id} className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-foreground">{habit.name}</h4>
                          {streakCount > 0 && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                              🔥 {streakCount}d streak
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {habit.logs?.length || 0} total days checked in
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={doneToday ? 'default' : 'outline'}
                          onClick={() => toggleHabitMutation.mutate(habit.id)}
                          className={`gap-1.5 text-xs font-semibold ${
                            doneToday
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                              : 'border-white/20 hover:border-emerald-400 hover:text-emerald-300'
                          }`}
                        >
                          <Check size={14} /> {doneToday ? 'Done Today' : 'Mark Done'}
                        </Button>
                        <button
                          onClick={() => deleteHabitMutation.mutate(habit.id)}
                          className="text-muted-foreground/60 hover:text-rose-400 transition p-1"
                          title="Delete habit"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Heatmap Dots with Day Labels */}
                    <div className="border-t border-white/10 pt-3">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5 px-0.5">
                        <span>14 days ago</span>
                        <span>Today</span>
                      </div>
                      <div className="grid grid-cols-14 gap-1 sm:gap-1.5">
                        {last14Days.map((d) => {
                          const isLogged = habit.logs?.some((l: any) => l.date === d.date);
                          const isToday = d.date === todayStr;
                          return (
                            <div
                              key={d.date}
                              title={`${d.date}: ${isLogged ? 'Completed' : 'Missed'}`}
                              className={`group relative flex flex-col items-center justify-center rounded-lg py-1.5 transition ${
                                isLogged
                                  ? 'bg-emerald-500/80 text-white shadow-sm'
                                  : 'bg-white/[0.05] text-muted-foreground hover:bg-white/[0.09]'
                              } ${isToday ? 'ring-1 ring-sky-400' : ''}`}
                            >
                              <span className="text-[9px] font-mono leading-none">{d.dayName}</span>
                              <span className="text-[8px] font-mono leading-none opacity-80 mt-0.5">{d.dayNum}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </GlassCard>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Goal Milestones Section */}
      <div className="space-y-4 border-t border-white/10 pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Target size={18} className="text-sky-400" />
            <span>Strategic Goals & Milestones</span>
          </h3>
          <span className="text-xs text-muted-foreground">Click milestone to toggle completion</span>
        </div>

        {goals.length === 0 ? (
          <EmptyState
            title="No strategic goals defined"
            description="Break down your long-term objectives into trackable milestones."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {goals.map((goal) => {
              const total = goal.milestones?.length || 0;
              const completed = goal.milestones?.filter((m: any) => m.completed).length || 0;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <GlassCard key={goal.id} className="p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{goal.title}</h4>
                      <span className="text-[11px] text-muted-foreground">
                        {completed} of {total} milestones finished
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          pct === 100
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-sky-500/10 text-sky-300'
                        }`}
                      >
                        {pct}%
                      </span>
                      <button
                        onClick={() => deleteGoalMutation.mutate(goal.id)}
                        className="text-muted-foreground/60 hover:text-rose-400 transition p-1"
                        title="Delete goal"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full transition-all duration-500 ${
                        pct === 100 ? 'bg-emerald-400' : 'bg-gradient-to-r from-sky-400 to-[#8ea9e8]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Milestones checklist */}
                  <div className="space-y-1.5 pt-1">
                    {goal.milestones?.map((m: any) => (
                      <div
                        key={m.id}
                        onClick={() => toggleMilestoneMutation.mutate({ goalId: goal.id, milestoneId: m.id })}
                        className="flex items-center gap-2.5 text-xs cursor-pointer p-1.5 rounded-lg hover:bg-white/[0.04] transition group"
                      >
                        <div
                          className={`h-4 w-4 rounded flex items-center justify-center transition border ${
                            m.completed
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-white/20 group-hover:border-sky-400'
                          }`}
                        >
                          {m.completed && <Check size={11} strokeWidth={3} />}
                        </div>
                        <span
                          className={`flex-1 break-words ${
                            m.completed ? 'line-through text-muted-foreground/70' : 'text-foreground'
                          }`}
                        >
                          {m.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
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
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Habit Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Read 30 pages of engineering books"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#8ea9e8]"
            />
          </div>
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
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Goal Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Master System Design and Microservices"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#8ea9e8]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Milestones (One per line)</label>
            <textarea
              placeholder="Read Designing Data-Intensive Applications&#10;Implement distributed lock with Redis&#10;Deploy Kafka event broker"
              rows={3}
              value={goalMilestones}
              onChange={(e) => setGoalMilestones(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#8ea9e8]"
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
