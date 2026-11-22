'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GlassCard, PageHeader, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Send,
  Plus,
  CheckCircle,
  Bot,
  User,
  Calendar,
  CalendarCheck,
  TrendingUp,
  ListTodo,
  FileText,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

interface AIConversation {
  id: string;
  title: string;
}

interface AIMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  createdAt: string;
}

export function AIAssistantView() {
  const queryClient = useQueryClient();
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [proposal, setProposal] = useState<any | null>(null);

  // 1. Fetch Conversations
  const { data: conversations = [] } = useQuery<AIConversation[]>({
    queryKey: ['ai-conversations'],
    queryFn: () => api<AIConversation[]>('/ai/conversations'),
  });

  const activeId = selectedConv || (conversations.length > 0 ? conversations[0].id : null);

  // 2. Fetch Messages
  const { data: messages = [], isLoading: loadingMessages } = useQuery<AIMessage[]>({
    queryKey: ['ai-messages', activeId],
    queryFn: () => (activeId ? api<AIMessage[]>(`/ai/conversations/${activeId}/messages`) : Promise.resolve([])),
    enabled: !!activeId,
  });

  // Create Conversation
  const createConvMutation = useMutation({
    mutationFn: () =>
      api('/ai/conversations', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Assistant Session' }),
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      setSelectedConv(res.data.id);
    },
  });

  // Send Message
  const sendMessageMutation = useMutation({
    mutationFn: (text: string) =>
      api(`/ai/conversations/${activeId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: text }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-messages', activeId] });
      setInput('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Create Structured Proposal
  const proposeMutation = useMutation({
    mutationFn: ({ actionType, prompt }: { actionType: string; prompt: string }) =>
      api('/ai/proposals', {
        method: 'POST',
        body: JSON.stringify({ actionType, prompt }),
      }),
    onSuccess: (res: any) => {
      setProposal(res.data);
      toast.info('AI proposal generated. Please review and confirm.');
    },
  });

  // Confirm Proposal
  const confirmMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/ai/proposals/${id}/confirm`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setProposal(null);
      toast.success('Confirmed and saved to workspace!');
    },
  });

  // Quick Action Prompts
  const quickPrompts = [
    {
      label: '🗓️ Plan My Day',
      prompt: 'Review my pending tasks and calendar events, and build a structured daily schedule for today with time blocks.',
    },
    {
      label: '📊 Weekly Review',
      prompt: 'Generate an executive weekly review summarizing what was accomplished, what is pending, and 3 key priorities for next week.',
    },
    {
      label: '⚡ Prioritize Tasks',
      prompt: 'Analyze my active tasks and suggest which 3 items I should execute first based on urgency and priority.',
    },
    {
      label: '💡 Brainstorm Ideas',
      prompt: 'Give me 5 actionable productivity tips to improve my daily focus and avoid burnout.',
    },
  ];

  const handleSendPrompt = (text: string) => {
    if (!activeId) return;
    sendMessageMutation.mutate(text);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence & Planning"
        title="AI Assistant (Gemini 3.5)"
        description="Your context-aware AI partner with structured daily planning, executive weekly reviews, and verified actions."
        action={
          <Button onClick={() => createConvMutation.mutate()} className="gap-2">
            <Plus size={16} /> New Conversation
          </Button>
        }
      />

      {/* Suggested Prompt Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendPrompt(qp.prompt)}
            disabled={!activeId || sendMessageMutation.isPending}
            className="rounded-xl border border-border bg-white/[0.025] px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-sky-400/40 hover:bg-sky-500/10 hover:text-sky-200"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Mandatory Proposal Card */}
      {proposal && (
        <GlassCard className="border-sky-400/40 bg-sky-950/20 p-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-200 uppercase tracking-wider">
              <Sparkles size={16} /> Structured Proposal (Mandatory Confirmation)
            </div>
            <span className="text-[10px] text-muted-foreground">Action Type: {proposal.actionType}</span>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div><strong className="text-foreground">Title:</strong> {proposal.payload.title}</div>
            <div><strong className="text-foreground">Priority:</strong> {proposal.payload.priority}</div>
            {proposal.payload.description && (
              <div><strong className="text-foreground">Details:</strong> {proposal.payload.description}</div>
            )}
            {proposal.payload.subtasks && proposal.payload.subtasks.length > 0 && (
              <div className="mt-2">
                <strong className="text-foreground">Checklist:</strong>
                <ul className="list-disc list-inside mt-1 text-muted-foreground">
                  {proposal.payload.subtasks.map((st: string, idx: number) => (
                    <li key={idx}>{st}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setProposal(null)}>
              Reject
            </Button>
            <Button
              size="sm"
              onClick={() => confirmMutation.mutate(proposal.id)}
              disabled={confirmMutation.isPending}
              className="gap-1 bg-sky-500 hover:bg-sky-600 text-white"
            >
              <CheckCircle size={14} /> Confirm & Commit to Workspace
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Sessions (3 cols) */}
        <div className="space-y-2 lg:col-span-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conversations</span>
          <div className="max-h-[500px] space-y-1.5 overflow-y-auto pr-1">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedConv(c.id)}
                className={`w-full rounded-xl border p-3 text-left text-xs transition ${
                  activeId === c.id
                    ? 'border-sky-500/50 bg-sky-500/10 text-foreground font-semibold'
                    : 'border-border bg-white/[0.02] text-muted-foreground hover:bg-white/[0.05]'
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>

        {/* Message Stream (9 cols) */}
        <div className="lg:col-span-9">
          <GlassCard className="flex flex-col h-[560px] p-4">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.length === 0 ? (
                <EmptyState
                  icon={<Bot size={32} className="text-sky-300" />}
                  title="How can I assist you today?"
                  description="Ask Buddio about your agenda, plan out your schedule, or ask for deep summaries."
                />
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-3 text-xs leading-relaxed ${
                      m.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {m.role === 'model' && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-300">
                        <Bot size={15} />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 whitespace-pre-wrap ${
                        m.role === 'user'
                          ? 'bg-sky-600 text-white rounded-br-none'
                          : 'bg-white/[0.04] border border-border text-foreground/90 rounded-bl-none'
                      }`}
                    >
                      {m.content}
                    </div>
                    {m.role === 'user' && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-muted-foreground">
                        <User size={15} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim() && activeId) handleSendPrompt(input.trim());
              }}
              className="mt-4 flex gap-2 border-t border-border pt-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your workspace, plan schedule, or request advice..."
                className="flex-1 rounded-xl border border-border bg-black/30 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <Button type="submit" size="icon" disabled={sendMessageMutation.isPending || !input.trim()}>
                <Send size={15} />
              </Button>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
