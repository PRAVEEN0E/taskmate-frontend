'use client';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GlassCard, PageHeader, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { FormModal } from '@/components/ui/dialog';
import {
  Plus,
  GraduationCap,
  CheckCircle2,
  Circle,
  BookOpen,
  Award,
  Link2,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export function LearningView() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Add Curriculum Step
  const [topicModal, setTopicModal] = useState(false);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [topicTitle, setTopicTitle] = useState('');

  const { data: paths = [] } = useQuery<any[]>({
    queryKey: ['learning-paths'],
    queryFn: () => api<any[]>('/learning-paths'),
  });

  const createPathMutation = useMutation({
    mutationFn: (data: any) =>
      api('/learning-paths', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-paths'] });
      setModalOpen(false);
      setTitle('');
      setDescription('');
      toast.success('Learning path started');
    },
  });

  const addTopicMutation = useMutation({
    mutationFn: ({ pathId, title }: { pathId: string; title: string }) =>
      api(`/learning-paths/${pathId}/topics`, {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-paths'] });
      setTopicModal(false);
      setTopicTitle('');
      toast.success('Curriculum milestone added');
    },
  });

  const toggleTopicMutation = useMutation({
    mutationFn: (topicId: string) =>
      api(`/learning-topics/${topicId}/toggle`, {
        method: 'POST',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['learning-paths'] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Skill Mastery & Growth"
        title="Learning & Skills Tracker"
        description="Curriculum roadmaps, certification milestones, and structured progress tracking."
        action={
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus size={16} /> New Learning Roadmap
          </Button>
        }
      />

      {paths.length === 0 ? (
        <EmptyState title="No active learning paths" description="Define a skill, certification, or domain you are mastering." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {paths.map((p) => {
            const total = p.topics?.length || 0;
            const completed = p.topics?.filter((t: any) => t.completed).length || 0;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <GlassCard key={p.id} className="flex flex-col justify-between p-6 space-y-4">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold">{p.title}</h3>
                      {p.description && <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>}
                    </div>
                    <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-bold text-sky-300">
                      {pct}% Done
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-sky-400 transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>

                  {/* Curriculum Checklist */}
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-1.5">
                      <span className="font-semibold uppercase tracking-wider text-[10px]">
                        Curriculum Steps ({completed}/{total})
                      </span>
                      <button
                        onClick={() => {
                          setSelectedPathId(p.id);
                          setTopicModal(true);
                        }}
                        className="text-sky-300 hover:underline font-semibold"
                      >
                        + Add Milestone
                      </button>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {p.topics?.map((t: any) => (
                        <div
                          key={t.id}
                          onClick={() => toggleTopicMutation.mutate(t.id)}
                          className="flex items-center gap-2 text-xs cursor-pointer p-1.5 rounded-lg hover:bg-white/[0.03] transition"
                        >
                          {t.completed ? (
                            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                          ) : (
                            <Circle size={15} className="text-muted-foreground shrink-0" />
                          )}
                          <span className={t.completed ? 'line-through text-muted-foreground' : 'text-foreground'}>
                            {t.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Award size={13} className="text-amber-400" /> Self-paced certification
                  </span>
                  <span>{completed === total && total > 0 ? '🏆 Mastered' : 'In Progress'}</span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Path Modal */}
      <FormModal open={modalOpen} onOpenChange={setModalOpen} title="New Learning Roadmap" description="Define a domain or technology.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createPathMutation.mutate({ title, description });
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-muted-foreground">Skill / Topic Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Systems in Go & Raft Consensus"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Goal & Objective</label>
            <textarea
              placeholder="What core competencies will you gain..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Start Roadmap</Button>
          </div>
        </form>
      </FormModal>

      {/* Topic Modal */}
      <FormModal open={topicModal} onOpenChange={setTopicModal} title="Add Curriculum Milestone" description="Add a step to your learning journey.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedPathId && topicTitle.trim()) {
              addTopicMutation.mutate({ pathId: selectedPathId, title: topicTitle.trim() });
            }
          }}
          className="space-y-4"
        >
          <input
            type="text"
            required
            placeholder="e.g. Build an in-memory Key-Value store with Raft replication"
            value={topicTitle}
            onChange={(e) => setTopicTitle(e.target.value)}
            className="w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setTopicModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Milestone</Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
