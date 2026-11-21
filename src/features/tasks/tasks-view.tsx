'use client';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GlassCard, PageHeader, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { FormModal } from '@/components/ui/dialog';
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Calendar,
  AlertTriangle,
  Sparkles,
  LayoutList,
  Kanban,
  CheckSquare,
  ArrowRight,
  X,
  ListFilter,
  Check,
  Flame,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  position: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueAt: string | null;
  completedAt?: string | null;
  category?: { id: string; name: string; color: string } | null;
  project?: { id: string; title: string } | null;
  subtasks: Subtask[];
}

export function TasksView() {
  const queryClient = useQueryClient();

  // Navigation & View state
  const [viewMode, setViewMode] = useState<'LIST' | 'BOARD'>('LIST');
  const [filterTab, setFilterTab] = useState<'ALL' | 'TODAY' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Selected Task for Slide-over Drawer
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Quick Add State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');

  // AI Task Breakdown State
  const [aiBreakdownTask, setAiBreakdownTask] = useState<Task | null>(null);
  const [aiSubtasksProposal, setAiSubtasksProposal] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // New Subtask in Drawer
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Full Task Modal (advanced fields)
  const [advancedModal, setAdvancedModal] = useState(false);
  const [advTitle, setAdvTitle] = useState('');
  const [advDesc, setAdvDesc] = useState('');
  const [advPriority, setAdvPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [advDueAt, setAdvDueAt] = useState('');
  const [advSubtasks, setAdvSubtasks] = useState('');

  // 1. Fetch All Tasks
  const { data: rawTasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', search],
    queryFn: () => api<Task[]>(`/tasks?${search ? `search=${encodeURIComponent(search)}` : ''}`),
  });

  // Calculate Dates & Metrics
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayEnd = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  const nextWeekEnd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  // Filter tasks based on tabs
  const filteredTasks = useMemo(() => {
    return rawTasks.filter((t) => {
      // Priority filter
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;

      // Tab filter
      if (filterTab === 'COMPLETED') return t.status === 'COMPLETED';
      if (t.status === 'COMPLETED' && filterTab !== 'ALL') return false;

      const due = t.dueAt ? new Date(t.dueAt) : null;

      if (filterTab === 'TODAY') {
        if (!due) return false;
        return due >= todayStart && due <= todayEnd;
      }
      if (filterTab === 'OVERDUE') {
        if (!due) return false;
        return due < todayStart && t.status !== 'COMPLETED';
      }
      if (filterTab === 'UPCOMING') {
        if (!due) return false;
        return due > todayEnd && due <= nextWeekEnd;
      }

      return true;
    });
  }, [rawTasks, filterTab, priorityFilter, todayStart, todayEnd, nextWeekEnd]);

  // Statistics Header Counts
  const stats = useMemo(() => {
    const total = rawTasks.length;
    const completed = rawTasks.filter((t) => t.status === 'COMPLETED').length;
    const dueToday = rawTasks.filter((t) => {
      if (t.status === 'COMPLETED' || !t.dueAt) return false;
      const d = new Date(t.dueAt);
      return d >= todayStart && d <= todayEnd;
    }).length;
    const overdue = rawTasks.filter((t) => {
      if (t.status === 'COMPLETED' || !t.dueAt) return false;
      return new Date(t.dueAt) < todayStart;
    }).length;

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, dueToday, overdue, rate };
  }, [rawTasks, todayStart, todayEnd]);

  // 2. Mutations
  const createTaskMutation = useMutation({
    mutationFn: (data: any) =>
      api('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setQuickTitle('');
      setAdvancedModal(false);
      toast.success('Task created');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleTaskStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task['status'] }) =>
      api(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: (updated: any) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (selectedTask && selectedTask.id === updated.data?.id) {
        setSelectedTask(updated.data);
      }
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/tasks/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (selectedTask) setSelectedTask(null);
      toast.success('Task deleted');
    },
  });

  const addSubtaskMutation = useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      api(`/tasks/${taskId}/subtasks`, {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewSubtaskTitle('');
      toast.success('Subtask added');
    },
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: ({ taskId, subtaskId, completed }: { taskId: string; subtaskId: string; completed: boolean }) =>
      api(`/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // AI Task Breakdown Trigger
  async function triggerAiBreakdown(task: Task) {
    setAiBreakdownTask(task);
    setIsAiLoading(true);
    setAiSubtasksProposal([]);

    try {
      const res = await api<any>('/ai/proposals', {
        method: 'POST',
        body: JSON.stringify({
          actionType: 'TASK_BREAKDOWN',
          prompt: `Break down the task "${task.title}" with description "${task.description}" into 4-6 concise actionable subtasks.`,
        }),
      });

      if (res?.payload?.subtasks && Array.isArray(res.payload.subtasks)) {
        setAiSubtasksProposal(res.payload.subtasks);
      } else {
        setAiSubtasksProposal(['Define requirements', 'Implement core steps', 'Test and verify', 'Review completion']);
      }
    } catch {
      setAiSubtasksProposal(['Define requirements', 'Implement core steps', 'Test and verify', 'Review completion']);
    } finally {
      setIsAiLoading(false);
    }
  }

  // Confirm AI Subtasks
  async function applyAiSubtasks() {
    if (!aiBreakdownTask) return;
    for (const title of aiSubtasksProposal) {
      await addSubtaskMutation.mutateAsync({ taskId: aiBreakdownTask.id, title });
    }
    setAiBreakdownTask(null);
    setAiSubtasksProposal([]);
    toast.success('AI Subtasks added to task!');
  }

  // Quick Add submit
  function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    createTaskMutation.mutate({
      title: quickTitle.trim(),
      priority: quickPriority,
      status: 'TODO',
    });
  }

  // Priority color styling
  const priorityTag = (p: Task['priority']) => {
    switch (p) {
      case 'URGENT':
        return 'border-rose-500/50 bg-rose-500/10 text-rose-300';
      case 'HIGH':
        return 'border-amber-500/50 bg-amber-500/10 text-amber-300';
      case 'LOW':
        return 'border-slate-500/50 bg-slate-500/10 text-slate-400';
      default:
        return 'border-sky-500/50 bg-sky-500/10 text-sky-300';
    }
  };

  // Sync selected task with latest data
  const liveSelected = useMemo(() => {
    if (!selectedTask) return null;
    return rawTasks.find((t) => t.id === selectedTask.id) || selectedTask;
  }, [rawTasks, selectedTask]);

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <PageHeader
        eyebrow="Execution Center"
        title="Tasks & Flow"
        description="Daily driver to plan, track, divide with AI, and complete what matters."
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-border bg-black/30 p-1">
              <button
                onClick={() => setViewMode('LIST')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  viewMode === 'LIST' ? 'bg-sky-500/20 text-sky-200 shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutList size={14} /> List
              </button>
              <button
                onClick={() => setViewMode('BOARD')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  viewMode === 'BOARD' ? 'bg-sky-500/20 text-sky-200 shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Kanban size={14} /> Board
              </button>
            </div>
            <Button onClick={() => setAdvancedModal(true)} className="gap-2">
              <Plus size={16} /> Advanced Task
            </Button>
          </div>
        }
      />

      {/* 2. Stats Dashboard Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-white/[0.025] p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>To Do</span>
            <CheckSquare size={16} className="text-sky-300" />
          </div>
          <div className="mt-2 text-2xl font-bold">{stats.total - stats.completed}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Items in progress</p>
        </div>

        <div className="rounded-2xl border border-border bg-white/[0.025] p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Due Today</span>
            <Flame size={16} className="text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-300">{stats.dueToday}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Focus for today</p>
        </div>

        <div className="rounded-2xl border border-border bg-white/[0.025] p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Overdue</span>
            <AlertTriangle size={16} className="text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-300">{stats.overdue}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Need urgent attention</p>
        </div>

        <div className="rounded-2xl border border-border bg-white/[0.025] p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="font-semibold text-emerald-400">{stats.rate}%</span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${stats.rate}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">{stats.completed} of {stats.total} closed</p>
        </div>
      </div>

      {/* 3. Inline Quick-Add Bar (Todoist Style) */}
      <GlassCard className="p-3.5">
        <form onSubmit={handleQuickAdd} className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2">
            <Plus size={16} className="text-sky-400 shrink-0" />
            <input
              type="text"
              placeholder="What needs to be done? Type and press Enter..."
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={quickPriority}
              onChange={(e) => setQuickPriority(e.target.value as any)}
              className="rounded-lg border border-border bg-black/30 px-2.5 py-1 text-xs focus:outline-none"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
            <Button size="sm" type="submit" disabled={!quickTitle.trim() || createTaskMutation.isPending}>
              Add
            </Button>
          </div>
        </form>
      </GlassCard>

      {/* 4. Smart Tabs & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ['ALL', 'All Tasks', stats.total],
              ['TODAY', 'Today', stats.dueToday],
              ['UPCOMING', 'Upcoming', null],
              ['OVERDUE', 'Overdue', stats.overdue],
              ['COMPLETED', 'Completed', stats.completed],
            ] as const
          ).map(([tab, label, count]) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                filterTab === tab
                  ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <span>{label}</span>
              {count !== null && count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                    tab === 'OVERDUE'
                      ? 'bg-rose-500/20 text-rose-300'
                      : tab === 'TODAY'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-white/10 text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-border bg-black/20 px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <input
            type="search"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-border bg-black/20 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* 5. Main Views (List or Kanban Board) */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-14 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-14 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-14 animate-pulse rounded-2xl bg-white/5" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title="No tasks in this view"
          description={
            filterTab === 'TODAY'
              ? 'No tasks due today. Enjoy your focus time or add a task.'
              : filterTab === 'OVERDUE'
              ? 'Great job! You have zero overdue tasks.'
              : 'Add a new task using the quick bar above.'
          }
        />
      ) : viewMode === 'LIST' ? (
        /* Compact Linear-Style List */
        <div className="space-y-2">
          {filteredTasks.map((task) => {
            const isDone = task.status === 'COMPLETED';
            const isOverdue = task.dueAt && new Date(task.dueAt) < todayStart && !isDone;
            const subtasksDone = task.subtasks.filter((s) => s.completed).length;

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`group flex items-center justify-between gap-3 rounded-xl border p-3 transition cursor-pointer ${
                  selectedTask?.id === task.id
                    ? 'border-sky-500/50 bg-sky-500/10'
                    : isOverdue
                    ? 'border-rose-500/30 bg-rose-500/[0.02] hover:bg-rose-500/[0.05]'
                    : 'border-border bg-white/[0.02] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskStatusMutation.mutate({
                        id: task.id,
                        status: isDone ? 'TODO' : 'COMPLETED',
                      });
                    }}
                    className="shrink-0 text-muted-foreground hover:text-sky-300 transition"
                  >
                    {isDone ? (
                      <CheckCircle2 size={19} className="text-emerald-400" />
                    ) : (
                      <Circle size={19} />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium line-clamp-1 ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </span>
                      {task.project && (
                        <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-300 font-medium shrink-0">
                          {task.project.title}
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Metadata Strip */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* AI Breakdown Button */}
                  {!isDone && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerAiBreakdown(task);
                      }}
                      title="AI Subtask Breakdown"
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-sky-500/20 hover:text-sky-300 transition opacity-80 group-hover:opacity-100"
                    >
                      <Sparkles size={15} />
                    </button>
                  )}

                  {/* Subtask count */}
                  {task.subtasks.length > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <CheckSquare size={13} /> {subtasksDone}/{task.subtasks.length}
                    </span>
                  )}

                  {/* Due date badge */}
                  {task.dueAt && (
                    <span
                      className={`flex items-center gap-1 text-[11px] font-medium ${
                        isOverdue ? 'text-rose-400 font-semibold' : 'text-muted-foreground'
                      }`}
                    >
                      <Calendar size={13} />
                      {new Date(task.dueAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  )}

                  {/* Priority Tag */}
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${priorityTag(task.priority)}`}>
                    {task.priority}
                  </span>

                  <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(
            [
              ['TODO', 'To Do'],
              ['IN_PROGRESS', 'In Progress'],
              ['COMPLETED', 'Completed'],
            ] as const
          ).map(([colStatus, colTitle]) => {
            const colTasks = filteredTasks.filter((t) => t.status === colStatus);
            return (
              <div key={colStatus} className="space-y-3 rounded-2xl border border-border bg-black/25 p-4">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {colTitle}
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {colTasks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">No tasks</div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="glass rounded-2xl p-3.5 cursor-pointer hover:border-sky-500/40 transition space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-semibold line-clamp-2">{task.title}</h4>
                          <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${priorityTag(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex items-center justify-between border-t border-border pt-2 text-[10px] text-muted-foreground">
                          {task.dueAt && (
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {new Date(task.dueAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                          <div className="flex gap-1 ml-auto">
                            {colStatus !== 'TODO' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTaskStatusMutation.mutate({ id: task.id, status: 'TODO' });
                                }}
                                className="hover:text-foreground text-[11px]"
                              >
                                ←
                              </button>
                            )}
                            {colStatus !== 'IN_PROGRESS' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTaskStatusMutation.mutate({ id: task.id, status: 'IN_PROGRESS' });
                                }}
                                className="hover:text-foreground text-[11px]"
                              >
                                {colStatus === 'TODO' ? '→' : '←'}
                              </button>
                            )}
                            {colStatus !== 'COMPLETED' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTaskStatusMutation.mutate({ id: task.id, status: 'COMPLETED' });
                                }}
                                className="hover:text-foreground text-[11px]"
                              >
                                →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Slide-Over Task Details Drawer */}
      {liveSelected && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-slate-950/95 p-6 backdrop-blur-xl shadow-2xl transition-all">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase ${priorityTag(liveSelected.priority)}`}>
                {liveSelected.priority}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                {liveSelected.status.replace('_', ' ')}
              </span>
            </div>
            <button
              onClick={() => setSelectedTask(null)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-5 py-5">
            <div>
              <h2 className="text-xl font-bold">{liveSelected.title}</h2>
              {liveSelected.dueAt && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar size={14} /> Due {new Date(liveSelected.dueAt).toLocaleString()}
                </div>
              )}
            </div>

            {liveSelected.description && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</span>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground bg-white/[0.02] p-3 rounded-xl border border-border">
                  {liveSelected.description}
                </p>
              </div>
            )}

            {/* Subtasks Checklist */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Checklist ({liveSelected.subtasks.filter((s) => s.completed).length}/{liveSelected.subtasks.length})
                </span>
                <button
                  onClick={() => triggerAiBreakdown(liveSelected)}
                  className="flex items-center gap-1 text-xs text-sky-400 hover:underline"
                >
                  <Sparkles size={13} /> AI Breakdown
                </button>
              </div>

              {/* Progress bar */}
              {liveSelected.subtasks.length > 0 && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-sky-400 transition-all duration-300"
                    style={{
                      width: `${(liveSelected.subtasks.filter((s) => s.completed).length / liveSelected.subtasks.length) * 100}%`,
                    }}
                  />
                </div>
              )}

              <div className="mt-3 space-y-2">
                {liveSelected.subtasks.map((st) => (
                  <div key={st.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-black/20 p-2 text-xs">
                    <button
                      onClick={() =>
                        toggleSubtaskMutation.mutate({
                          taskId: liveSelected.id,
                          subtaskId: st.id,
                          completed: !st.completed,
                        })
                      }
                    >
                      {st.completed ? (
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      ) : (
                        <Circle size={16} className="text-muted-foreground" />
                      )}
                    </button>
                    <span className={st.completed ? 'line-through text-muted-foreground' : 'text-foreground'}>
                      {st.title}
                    </span>
                  </div>
                ))}

                {/* Add Subtask */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newSubtaskTitle.trim()) {
                      addSubtaskMutation.mutate({ taskId: liveSelected.id, title: newSubtaskTitle.trim() });
                    }
                  }}
                  className="mt-2 flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="Add step..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-black/30 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <Button size="sm" type="submit" disabled={!newSubtaskTitle.trim()}>
                    Add
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteTaskMutation.mutate(liveSelected.id)}
              className="gap-1.5 text-rose-400 hover:text-rose-300"
            >
              <Trash2 size={15} /> Delete Task
            </Button>
            <Button
              size="sm"
              onClick={() =>
                toggleTaskStatusMutation.mutate({
                  id: liveSelected.id,
                  status: liveSelected.status === 'COMPLETED' ? 'TODO' : 'COMPLETED',
                })
              }
              className="gap-1.5"
            >
              {liveSelected.status === 'COMPLETED' ? (
                <>
                  <Circle size={15} /> Reopen Task
                </>
              ) : (
                <>
                  <Check size={15} /> Mark Complete
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* 7. AI Task Breakdown Modal Proposal */}
      <FormModal
        open={!!aiBreakdownTask}
        onOpenChange={() => setAiBreakdownTask(null)}
        title="AI Subtask Breakdown"
        description={`Gemini suggested the following execution steps for "${aiBreakdownTask?.title}".`}
      >
        <div className="space-y-4">
          {isAiLoading ? (
            <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-muted-foreground">
              <Sparkles className="animate-spin text-sky-400 mb-2" size={24} />
              Generating structured steps with Gemini AI...
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Proposed Steps
              </span>
              {aiSubtasksProposal.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-lg border border-border bg-white/[0.03] p-2.5 text-xs">
                  <span className="text-sky-300 font-bold">{idx + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setAiBreakdownTask(null)}>
              Cancel
            </Button>
            <Button
              onClick={applyAiSubtasks}
              disabled={isAiLoading || aiSubtasksProposal.length === 0}
              className="gap-1.5 bg-sky-500 hover:bg-sky-600 text-white"
            >
              <Check size={15} /> Confirm & Apply to Task
            </Button>
          </div>
        </div>
      </FormModal>

      {/* 8. Full Advanced Task Modal */}
      <FormModal
        open={advancedModal}
        onOpenChange={setAdvancedModal}
        title="Create Advanced Task"
        description="Add a task with detailed description, due dates and initial checklist."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!advTitle.trim()) return;
            const subtasks = advSubtasks
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean);

            createTaskMutation.mutate({
              title: advTitle.trim(),
              description: advDesc.trim(),
              priority: advPriority,
              dueAt: advDueAt ? new Date(advDueAt).toISOString() : null,
              subtasks: subtasks.length > 0 ? subtasks : undefined,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Architect Database Failover Strategy"
              value={advTitle}
              onChange={(e) => setAdvTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Description & Context</label>
            <textarea
              placeholder="Key specifications, links, or criteria..."
              rows={3}
              value={advDesc}
              onChange={(e) => setAdvDesc(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <select
                value={advPriority}
                onChange={(e) => setAdvPriority(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-sm focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Due Date & Time</label>
              <input
                type="datetime-local"
                value={advDueAt}
                onChange={(e) => setAdvDueAt(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Initial Checklist (One item per line)</label>
            <textarea
              placeholder="Draft runbook&#10;Configure replica health checks&#10;Simulate failover"
              rows={3}
              value={advSubtasks}
              onChange={(e) => setAdvSubtasks(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setAdvancedModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTaskMutation.isPending}>
              Create Task
            </Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
