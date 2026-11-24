'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useSession } from '@/hooks/use-session';
import { Sparkles, Mic, MicOff, Send, Loader2, Plus, Calendar, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function AiDailyBriefing() {
  const { owner } = useSession();
  const queryClient = useQueryClient();
  const [quickInput, setQuickInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  // 1. Fetch Today's Tasks
  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ['tasks'],
    queryFn: () => api<any[]>('/tasks'),
  });

  // 2. Fetch Events
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

  const { data: events = [] } = useQuery<any[]>({
    queryKey: ['calendar-events', startOfDay, endOfDay],
    queryFn: () => api<any[]>(`/calendar/events?start=${startOfDay}&end=${endOfDay}`),
  });

  // 3. Natural Language AI Proposal Mutation
  const aiProposalMutation = useMutation({
    mutationFn: (prompt: string) =>
      api('/ai/proposals', {
        method: 'POST',
        body: JSON.stringify({
          actionType: 'CREATE_TASK',
          prompt,
        }),
      }),
    onSuccess: async (res: any) => {
      if (res?.data?.id) {
        try {
          // Automatically confirm and execute the task creation
          await api(`/ai/proposals/${res.data.id}/confirm`, {
            method: 'POST',
            body: JSON.stringify({}),
          });
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          setQuickInput('');
          toast.success('Task created successfully with AI!');
        } catch (confirmErr: any) {
          toast.error(confirmErr?.message || 'Failed to confirm task.');
        }
      }
    },
    onError: (err: any) => {
      // Fallback: direct task creation if Gemini API is busy or unconfigured
      const title = quickInput.trim();
      if (title) {
        api('/tasks', {
          method: 'POST',
          body: JSON.stringify({
            title: title.replace(/^(create|add|schedule|remind me to)\s+/i, ''),
            priority: 'MEDIUM',
          }),
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          setQuickInput('');
          toast.success('Task created successfully!');
        }).catch(() => {
          toast.error(err?.message || 'Could not process request.');
        });
      }
    },
  });

  // Speech Recognition (Voice Input)
  const toggleListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        toast.info('Listening... Speak your task or schedule.');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuickInput(transcript);
        setIsListening(false);
        toast.success(`Heard: "${transcript}"`);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    aiProposalMutation.mutate(quickInput.trim());
  };

  // Metrics for briefing
  const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  const highPriorityTasks = pendingTasks.filter((t) => t.priority === 'HIGH' || t.priority === 'URGENT');
  const greeting = getGreeting();

  return (
    <div className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-br from-slate-900/90 via-purple-950/40 to-slate-950/90 p-5 backdrop-blur-xl shadow-2xl">
      {/* Decorative gradient glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Header Briefing */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/25">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {greeting}, {owner?.name?.split(' ')[0] || 'Friend'}!
              </h3>
              <p className="text-xs text-muted-foreground">
                Here is your AI productivity briefing for today.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
              <CheckCircle2 size={12} /> {pendingTasks.length} Pending
            </span>
            {events.length > 0 && (
              <span className="flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-300">
                <Calendar size={12} /> {events.length} Events
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Summary Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-3.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">Focus Priority</span>
              <span className="text-[10px] uppercase font-bold text-amber-400">
                {highPriorityTasks.length} Urgent
              </span>
            </div>
            <p className="mt-1.5 text-xs font-semibold text-foreground line-clamp-1">
              {highPriorityTasks.length > 0
                ? highPriorityTasks[0].title
                : pendingTasks.length > 0
                ? pendingTasks[0].title
                : 'All caught up! No pending tasks.'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-3.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">Today&apos;s Schedule</span>
              <span className="text-[10px] uppercase font-bold text-sky-400">
                {events.length > 0 ? `${events.length} on agenda` : 'Free Day'}
              </span>
            </div>
            <p className="mt-1.5 text-xs font-semibold text-foreground line-clamp-1">
              {events.length > 0
                ? `${events[0].title} (${new Date(events[0].startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                : 'No meetings scheduled for today.'}
            </p>
          </div>
        </div>

        {/* Natural Language & Voice Quick Capture */}
        <form onSubmit={handleQuickSubmit} className="relative mt-1">
          <div className="flex items-center overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-inner focus-within:border-sky-500/60 focus-within:ring-1 focus-within:ring-sky-500/40">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Ask Buddio or say 'Create task to review budget by 5 PM'..."
              className="flex-1 bg-transparent px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />

            <div className="flex items-center gap-1 pr-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`rounded-xl p-1.5 transition ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'
                }`}
                title={isListening ? 'Stop listening' : 'Voice input (Speech to text)'}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <button
                type="submit"
                disabled={aiProposalMutation.isPending || !quickInput.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-white shadow-md transition hover:bg-sky-400 disabled:opacity-40"
              >
                {aiProposalMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
