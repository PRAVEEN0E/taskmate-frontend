'use client';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GlassCard, PageHeader, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { FormModal } from '@/components/ui/dialog';
import {
  Plus,
  Bell,
  Calendar as CalIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckSquare,
  Trash2,
  CalendarDays,
  Grid,
} from 'lucide-react';
import { toast } from 'sonner';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  color: string;
  allDay: boolean;
}

interface Reminder {
  id: string;
  title: string;
  remindAt: string;
  status: 'PENDING' | 'TRIGGERED' | 'SNOOZED' | 'DISMISSED';
  sentEmail: boolean;
}

export function CalendarView() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK' | 'LIST'>('MONTH');

  // Modals
  const [eventModal, setEventModal] = useState(false);
  const [reminderModal, setReminderModal] = useState(false);

  // Form State Event
  const [title, setTitle] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [color, setColor] = useState('#38bdf8');
  const [description, setDescription] = useState('');

  // Form State Reminder
  const [remTitle, setRemTitle] = useState('');
  const [remAt, setRemAt] = useState('');

  // Fetch window
  const startWindow = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString();
  const endWindow = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0).toISOString();

  // 1. Fetch Events
  const { data: events = [] } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar-events', startWindow, endWindow],
    queryFn: () => api<CalendarEvent[]>(`/calendar/events?start=${startWindow}&end=${endWindow}`),
  });

  // 2. Fetch Tasks with Due Dates to Sync
  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ['tasks'],
    queryFn: () => api<any[]>('/tasks'),
  });

  // 3. Fetch Reminders
  const { data: reminders = [] } = useQuery<Reminder[]>({
    queryKey: ['reminders'],
    queryFn: () => api<Reminder[]>('/reminders'),
  });

  // Create Event Mutation
  const createEventMutation = useMutation({
    mutationFn: (newEvent: any) =>
      api('/calendar/events', {
        method: 'POST',
        body: JSON.stringify(newEvent),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setEventModal(false);
      resetEventForm();
      toast.success('Calendar event scheduled');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Delete Event
  const deleteEventMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/calendar/events/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Event deleted');
    },
  });

  // Create Reminder Mutation
  const createReminderMutation = useMutation({
    mutationFn: (newRem: any) =>
      api('/reminders', {
        method: 'POST',
        body: JSON.stringify(newRem),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setReminderModal(false);
      setRemTitle('');
      setRemAt('');
      toast.success('Reminder created');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Dismiss Reminder
  const dismissMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/reminders/${id}/dismiss`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Reminder dismissed');
    },
  });

  function resetEventForm() {
    setTitle('');
    setDescription('');
    setStartAt('');
    setEndAt('');
    setColor('#38bdf8');
  }

  // Generate Month Grid Matrix
  const monthMatrix = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);
    return days;
  }, [currentDate]);

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Map tasks that have due dates
  const taskEvents = useMemo(() => {
    return tasks
      .filter((t) => t.dueAt)
      .map((t) => ({
        id: `task-${t.id}`,
        title: `Task: ${t.title}`,
        startAt: t.dueAt,
        color: '#10b981',
        isTask: true,
        completed: t.status === 'COMPLETED',
      }));
  }, [tasks]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Schedule & Time"
        title="Calendar & Timeline"
        description="Interactive monthly grid, task deadline synchronization, and durable reminder queues."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setReminderModal(true)} className="gap-2">
              <Bell size={15} /> Set Reminder
            </Button>
            <Button onClick={() => setEventModal(true)} className="gap-2">
              <Plus size={16} /> Schedule Event
            </Button>
          </div>
        }
      />

      {/* Navigation Topbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-border bg-black/20 p-1">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="rounded-lg p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold hover:bg-white/10"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="rounded-lg p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <h2 className="text-lg font-bold">{monthName}</h2>
        </div>

        <div className="flex rounded-xl border border-border bg-black/30 p-1 text-xs">
          <button
            onClick={() => setViewMode('MONTH')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
              viewMode === 'MONTH' ? 'bg-sky-500/20 text-sky-200' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Grid size={13} /> Month Grid
          </button>
          <button
            onClick={() => setViewMode('LIST')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
              viewMode === 'LIST' ? 'bg-sky-500/20 text-sky-200' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CalendarDays size={13} /> Schedule Agenda
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main Calendar View (8 cols) */}
        <div className="lg:col-span-8">
          {viewMode === 'MONTH' ? (
            <GlassCard className="p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-border pb-2 text-center text-xs font-semibold text-muted-foreground">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1 pt-2">
                {monthMatrix.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-24 rounded-lg bg-white/[0.01]" />;
                  }

                  const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  const isToday = new Date().toDateString() === cellDate.toDateString();

                  // Events for this day
                  const dayEvents = events.filter((e) => {
                    const st = new Date(e.startAt);
                    return (
                      st.getFullYear() === cellDate.getFullYear() &&
                      st.getMonth() === cellDate.getMonth() &&
                      st.getDate() === day
                    );
                  });

                  // Tasks for this day
                  const dayTasks = taskEvents.filter((t) => {
                    const st = new Date(t.startAt);
                    return (
                      st.getFullYear() === cellDate.getFullYear() &&
                      st.getMonth() === cellDate.getMonth() &&
                      st.getDate() === day
                    );
                  });

                  return (
                    <div
                      key={day}
                      onClick={() => {
                        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T09:00`;
                        const endDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T10:00`;
                        setStartAt(dateStr);
                        setEndAt(endDateStr);
                        setEventModal(true);
                      }}
                      className={`h-24 overflow-hidden rounded-xl border p-1.5 transition cursor-pointer flex flex-col justify-between ${
                        isToday
                          ? 'border-sky-500/60 bg-sky-500/10'
                          : 'border-border/50 bg-white/[0.015] hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className={`text-xs font-semibold ${isToday ? 'text-sky-300' : 'text-muted-foreground'}`}>
                        {day}
                      </span>

                      <div className="space-y-1 overflow-hidden">
                        {dayEvents.slice(0, 2).map((e) => (
                          <div
                            key={e.id}
                            style={{ borderLeftColor: e.color }}
                            className="rounded border-l-2 bg-black/40 px-1 py-0.5 text-[10px] font-medium text-foreground line-clamp-1"
                          >
                            {e.title}
                          </div>
                        ))}
                        {dayTasks.slice(0, 1).map((t) => (
                          <div
                            key={t.id}
                            className={`rounded border-l-2 border-emerald-400 bg-emerald-500/10 px-1 py-0.5 text-[9px] font-medium text-emerald-300 line-clamp-1 ${
                              t.completed ? 'line-through opacity-60' : ''
                            }`}
                          >
                            {t.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          ) : (
            /* Agenda List View */
            <div className="space-y-3">
              {events.length === 0 ? (
                <EmptyState title="No scheduled events" description="Click 'Schedule Event' to add to your agenda." />
              ) : (
                events.map((ev) => (
                  <GlassCard key={ev.id} className="flex items-center justify-between p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 self-stretch rounded-full" style={{ backgroundColor: ev.color }} />
                      <div>
                        <h4 className="text-sm font-semibold">{ev.title}</h4>
                        {ev.description && <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>}
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock size={13} />
                          <span>
                            {new Date(ev.startAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            –{' '}
                            {new Date(ev.endAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteEventMutation.mutate(ev.id)}
                      className="text-muted-foreground hover:text-rose-400 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </GlassCard>
                ))
              )}
            </div>
          )}
        </div>

        {/* Reminders Queue Panel (4 cols) */}
        <div className="space-y-4 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Active Reminders Queue</h3>
            <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-bold text-sky-300">
              {reminders.filter((r) => r.status === 'PENDING').length} Due
            </span>
          </div>

          <div className="space-y-2.5">
            {reminders.length === 0 ? (
              <EmptyState title="No active reminders" description="Set custom time alerts." />
            ) : (
              reminders.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-white/[0.02] p-3 text-xs"
                >
                  <div>
                    <h4 className="font-semibold text-foreground line-clamp-1">{r.title}</h4>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(r.remindAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {r.status === 'PENDING' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => dismissMutation.mutate(r.id)}
                      className="text-xs gap-1"
                    >
                      <Check size={14} /> Dismiss
                    </Button>
                  ) : (
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{r.status}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* New Event Modal */}
      <FormModal open={eventModal} onOpenChange={setEventModal} title="Schedule Calendar Event" description="Define an appointment or meeting.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createEventMutation.mutate({
              title,
              description,
              startAt: new Date(startAt).toISOString(),
              endAt: new Date(endAt).toISOString(),
              color,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-muted-foreground">Event Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Quarterly Strategic Planning"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Description / Agenda</label>
            <textarea
              placeholder="Meeting link, agenda, or location..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Start Time</label>
              <input
                type="datetime-local"
                required
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">End Time</label>
              <input
                type="datetime-local"
                required
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setEventModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Schedule Event</Button>
          </div>
        </form>
      </FormModal>

      {/* Reminder Modal */}
      <FormModal open={reminderModal} onOpenChange={setReminderModal} title="Set Server Reminder" description="Trigger alarms and notifications.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createReminderMutation.mutate({
              title: remTitle,
              remindAt: new Date(remAt).toISOString(),
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-muted-foreground">Reminder Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Call tax advisor before 5 PM"
              value={remTitle}
              onChange={(e) => setRemTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Trigger At</label>
            <input
              type="datetime-local"
              required
              value={remAt}
              onChange={(e) => setRemAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setReminderModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Set Alert</Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
