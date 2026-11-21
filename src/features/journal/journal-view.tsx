'use client';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GlassCard, PageHeader, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Check,
  Flame,
  Sparkles,
  BookHeart,
  Smile,
  Frown,
  Meh,
  Sun,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

export function JournalView() {
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [mood, setMood] = useState<'GREAT' | 'GOOD' | 'NEUTRAL' | 'LOW' | 'BAD'>('GOOD');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // 1. Fetch Today's or Selected Date's Entry
  const { data: entry } = useQuery<any>({
    queryKey: ['journal', selectedDate],
    queryFn: async () => {
      try {
        const res = await api<any>(`/journal/${selectedDate}`);
        if (res) {
          setTitle(res.title || '');
          setContent(res.rawText || '');
          setMood(res.mood || 'GOOD');
        } else {
          setTitle('');
          setContent('');
        }
        return res;
      } catch {
        return null;
      }
    },
  });

  // 2. Fetch Recent History
  const { data: history = [] } = useQuery<any[]>({
    queryKey: ['journal-history'],
    queryFn: () => api<any[]>('/journal'),
  });

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: () =>
      api('/journal', {
        method: 'POST',
        body: JSON.stringify({
          date: selectedDate,
          mood,
          title,
          rawText: content,
          content: { type: 'doc', content: [{ type: 'paragraph', text: content }] },
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['journal-history'] });
      toast.success('Journal reflection saved');
    },
  });

  // Clickable Prompt Inserts
  const prompts = [
    'What was my most meaningful win today?',
    'What challenged my patience or drained my energy?',
    '3 things I am genuinely grateful for today:',
    'Key lesson learned that will help me tomorrow:',
  ];

  function insertPrompt(p: string) {
    setContent((prev) => (prev ? `${prev}\n\n**${p}**\n` : `**${p}**\n`));
  }

  // Word count & streak count
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const writingStreak = history.length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Introspection & Clarity"
        title="Personal Journal"
        description="Private daily reflections, mood tracking, and thought prompts."
      />

      {/* Top Reflection Strip */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <span className="text-xs font-semibold text-muted-foreground mr-1">Daily Prompts:</span>
        {prompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => insertPrompt(p)}
            className="rounded-xl border border-border bg-white/[0.02] px-3 py-1.5 text-xs text-muted-foreground transition hover:border-sky-400/40 hover:bg-sky-500/10 hover:text-sky-200"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Editor Area (8 cols) */}
        <div className="lg:col-span-8">
          <GlassCard className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-sky-300" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-xl border border-border bg-black/20 px-3 py-1 text-xs focus:outline-none"
                />
              </div>

              {/* Mood selector buttons */}
              <div className="flex items-center gap-1.5">
                {(['GREAT', 'GOOD', 'NEUTRAL', 'LOW', 'BAD'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={`rounded-xl px-2.5 py-1 text-[11px] font-bold uppercase transition ${
                      mood === m
                        ? 'bg-sky-500/20 text-sky-200 border border-sky-400/40'
                        : 'text-muted-foreground hover:bg-white/5'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              placeholder="Headline / One-line summary of your day"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-lg font-bold placeholder:text-muted-foreground focus:outline-none"
            />

            <textarea
              placeholder="Start reflecting on your day... write openly, this is completely private to you."
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
            />

            <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
              <span>{wordCount} words written</span>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-2">
                <Check size={16} /> Save Daily Entry
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* History & Reflection Streak (4 cols) */}
        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-2xl border border-border bg-white/[0.025] p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-semibold">Reflections Logged</span>
              <div className="text-xl font-bold mt-1 text-amber-300">{writingStreak} Entries</div>
            </div>
            <Flame size={24} className="text-amber-400" />
          </div>

          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Past Reflections</h3>
          <div className="max-h-[500px] space-y-2 overflow-y-auto pr-1">
            {history.length === 0 ? (
              <EmptyState title="No past entries" description="Your journal history will appear here." />
            ) : (
              history.map((h) => (
                <div
                  key={h.id}
                  onClick={() => setSelectedDate(h.date)}
                  className={`cursor-pointer rounded-xl border p-3.5 text-xs transition ${
                    selectedDate === h.date
                      ? 'border-sky-500/50 bg-sky-500/10'
                      : 'border-border bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>{h.date}</span>
                    <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-300 uppercase">
                      {h.mood}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground line-clamp-2">{h.title || h.rawText || 'Reflection...'}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
