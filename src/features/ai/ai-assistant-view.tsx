'use client';
import { useState, useRef, useEffect } from 'react';
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
  MessagesSquare,
  MessageSquare,
  Calendar,
  CalendarCheck,
  TrendingUp,
  ListTodo,
  FileText,
  Copy,
  ChevronDown,
  X,
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
  const [mobileSessionsOpen, setMobileSessionsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Conversations
  const { data: conversations = [] } = useQuery<AIConversation[]>({
    queryKey: ['ai-conversations'],
    queryFn: () => api<AIConversation[]>('/ai/conversations'),
  });

  const activeId = selectedConv || (conversations.length > 0 ? conversations[0].id : null);
  const activeConversation = conversations.find((c) => c.id === activeId);

  // 2. Fetch Messages
  const { data: messages = [], isLoading: loadingMessages } = useQuery<AIMessage[]>({
    queryKey: ['ai-messages', activeId],
    queryFn: () => (activeId ? api<AIMessage[]>(`/ai/conversations/${activeId}/messages`) : Promise.resolve([])),
    enabled: !!activeId,
  });

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingMessages]);

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
      setMobileSessionsOpen(false);
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
        body: JSON.stringify({}),
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

    // Detect if user is asking AI to create/schedule a task
    const lower = text.toLowerCase();
    const isTaskCreation =
      lower.startsWith('create task') ||
      lower.startsWith('add task') ||
      lower.includes('create a task') ||
      lower.includes('add a task') ||
      lower.includes('schedule a task');

    if (isTaskCreation) {
      proposeMutation.mutate({ actionType: 'CREATE_TASK', prompt: text });
    }

    sendMessageMutation.mutate(text);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Intelligence & Planning"
        title="Buddio AI Assistant"
        description="Your context-aware AI partner with structured daily planning, executive weekly reviews, and verified actions."
        action={
          <Button onClick={() => createConvMutation.mutate()} className="gap-2 w-full sm:w-auto">
            <Plus size={16} /> New Chat
          </Button>
        }
      />

      {/* Suggested Prompt Chips (Horizontal scrollable on mobile) */}
      <div className="-mx-3 sm:mx-0 flex overflow-x-auto px-3 sm:px-0 py-1 gap-2 no-scrollbar scroll-smooth">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendPrompt(qp.prompt)}
            disabled={!activeId || sendMessageMutation.isPending}
            className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-[#8ea9e8]/50 hover:bg-[#8ea9e8]/10 hover:text-white disabled:opacity-50 active:scale-95"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Mandatory Proposal Card */}
      {proposal && (
        <GlassCard className="border-sky-400/40 bg-sky-950/20 p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-200 uppercase tracking-wider">
              <Sparkles size={16} /> Structured Proposal
            </div>
            <span className="text-[10px] text-muted-foreground">{proposal.actionType}</span>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div><strong className="text-foreground">Title:</strong> {proposal.payload.title}</div>
            <div><strong className="text-foreground">Priority:</strong> {proposal.payload.priority}</div>
            {proposal.payload.description && (
              <div className="break-words"><strong className="text-foreground">Details:</strong> {proposal.payload.description}</div>
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
          <div className="mt-4 flex flex-wrap gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setProposal(null)}>
              Reject
            </Button>
            <Button
              size="sm"
              onClick={() => confirmMutation.mutate(proposal.id)}
              disabled={confirmMutation.isPending}
              className="gap-1 bg-sky-500 hover:bg-sky-600 text-white"
            >
              <CheckCircle size={14} /> Confirm
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Mobile Conversation Selector Bar */}
      <div className="lg:hidden flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <button
          type="button"
          onClick={() => setMobileSessionsOpen((prev) => !prev)}
          className="flex items-center gap-2 text-xs font-medium text-foreground hover:text-white"
        >
          <MessagesSquare size={16} className="text-[#8ea9e8]" />
          <span className="truncate max-w-[200px]">
            {activeConversation?.title || 'Select Conversation'}
          </span>
          <ChevronDown
            size={14}
            className={`text-muted-foreground transition-transform ${mobileSessionsOpen ? 'rotate-180' : ''}`}
          />
        </button>
        <button
          type="button"
          onClick={() => createConvMutation.mutate()}
          className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[11px] font-semibold text-[#8ea9e8]"
        >
          <Plus size={13} /> New
        </button>
      </div>

      {/* Mobile Conversations Drawer / Dropdown */}
      {mobileSessionsOpen && (
        <div className="lg:hidden rounded-2xl border border-white/15 bg-[#121c2d] p-3 shadow-xl space-y-1.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span>All Conversations</span>
            <button onClick={() => setMobileSessionsOpen(false)}>
              <X size={15} />
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedConv(c.id);
                  setMobileSessionsOpen(false);
                }}
                className={`w-full rounded-xl border p-2.5 text-left text-xs transition ${
                  activeId === c.id
                    ? 'border-[#8ea9e8]/50 bg-[#8ea9e8]/15 text-white font-semibold'
                    : 'border-white/5 bg-white/[0.02] text-muted-foreground hover:bg-white/[0.06]'
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Desktop Sessions (3 cols) */}
        <div className="hidden lg:block space-y-2 lg:col-span-3">
          <div className="flex items-center justify-between pr-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Conversations
            </span>
            <span className="text-[11px] text-[#8ea9e8]">{conversations.length} total</span>
          </div>
          <div className="max-h-[560px] space-y-1.5 overflow-y-auto pr-1">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedConv(c.id)}
                className={`w-full rounded-xl border p-3 text-left text-xs transition ${
                  activeId === c.id
                    ? 'border-[#8ea9e8]/50 bg-[#8ea9e8]/15 text-white font-semibold'
                    : 'border-white/5 bg-white/[0.02] text-muted-foreground hover:bg-white/[0.05]'
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>

        {/* Message Stream (9 cols) */}
        <div className="lg:col-span-9">
          <GlassCard className="flex flex-col h-[75dvh] min-h-[460px] max-h-[720px] p-3 sm:p-5">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3 px-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-foreground truncate max-w-[220px] sm:max-w-md">
                  {activeConversation?.title || 'Buddio Assistant'}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">Gemini 3.5 Pro</span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain space-y-3.5 pr-1 sm:pr-2" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
              {messages.length === 0 ? (
                <EmptyState
                  icon={<Bot size={32} className="text-[#8ea9e8]" />}
                  title="How can I assist you today?"
                  description="Ask Buddio about your agenda, plan out your schedule, or ask for deep summaries."
                />
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-2 sm:gap-3 text-xs leading-relaxed ${
                      m.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {m.role === 'model' && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#8ea9e8]/20 text-[#8ea9e8]">
                        <Bot size={15} />
                      </div>
                    )}
                    <div
                      className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 whitespace-pre-wrap break-words ${
                        m.role === 'user'
                          ? 'bg-[#7864F6] text-white rounded-br-none shadow-sm'
                          : 'bg-white/[0.05] border border-white/10 text-foreground/90 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {m.content}
                    </div>
                    {m.role === 'user' && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-muted-foreground">
                        <User size={15} />
                      </div>
                    )}
                  </div>
                ))
              )}
              {sendMessageMutation.isPending && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Bot size={14} className="animate-spin text-[#8ea9e8]" />
                  <span>Buddio is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim() && activeId) handleSendPrompt(input.trim());
              }}
              className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Buddio anything..."
                className="flex-1 min-w-0 rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#8ea9e8]"
              />
              <Button
                type="submit"
                size="icon"
                disabled={sendMessageMutation.isPending || !input.trim()}
                className="shrink-0 h-9 w-9 bg-[#7864F6] text-white hover:bg-[#6c56f5]"
              >
                <Send size={15} />
              </Button>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
