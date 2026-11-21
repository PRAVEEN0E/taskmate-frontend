'use client';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GlassCard, PageHeader, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { FormModal } from '@/components/ui/dialog';
import {
  Plus,
  Layers,
  Calendar,
  CheckSquare,
  Clock,
  Kanban,
  LayoutGrid,
  Check,
  ChevronRight,
  TrendingUp,
  CircleDot,
} from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  title: string;
  description: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  startAt?: string | null;
  targetAt?: string | null;
  tasks: { id: string; title: string; status: string; priority: string }[];
  milestones: { id: string; title: string; completed: boolean }[];
}

export function ProjectsView() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAt, setTargetAt] = useState('');

  // 1. Fetch Projects
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api<Project[]>('/projects'),
  });

  // Create Project Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) =>
      api('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setModalOpen(false);
      setTitle('');
      setDescription('');
      setTargetAt('');
      toast.success('Project created');
    },
  });

  // Update Status
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/projects/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const columns: { label: string; status: Project['status']; color: string }[] = [
    { label: 'Planned & Scoped', status: 'PLANNED', color: 'border-slate-500' },
    { label: 'In Execution', status: 'ACTIVE', color: 'border-sky-500' },
    { label: 'Completed / Shipped', status: 'COMPLETED', color: 'border-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Initiatives & Delivery"
        title="Project Management"
        description="Linear-style Kanban boards, scoped project deliverables, and delivery timelines."
        action={
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus size={16} /> New Project
          </Button>
        }
      />

      {/* Kanban Board */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {columns.map((col) => {
          const colProjects = projects.filter((p) => p.status === col.status);

          return (
            <div key={col.status} className="space-y-3 rounded-2xl border border-border bg-black/25 p-4">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {col.label}
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold">
                  {colProjects.length}
                </span>
              </div>

              <div className="space-y-3 min-h-[500px]">
                {colProjects.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">No projects here</div>
                ) : (
                  colProjects.map((p) => {
                    const doneTasks = p.tasks?.filter((t) => t.status === 'COMPLETED').length || 0;
                    const totalTasks = p.tasks?.length || 0;
                    const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

                    return (
                      <GlassCard key={p.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-bold">{p.title}</h4>
                        </div>
                        {p.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                        )}

                        {/* Progress */}
                        {totalTasks > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Tasks Progress</span>
                              <span>{doneTasks}/{totalTasks} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                              <div className="h-full bg-sky-400 transition-all duration-300" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
                          {p.targetAt && (
                            <span className="flex items-center gap-1">
                              <Calendar size={12} /> {new Date(p.targetAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                          <div className="flex gap-1.5 ml-auto font-bold">
                            {col.status !== 'PLANNED' && (
                              <button
                                onClick={() => statusMutation.mutate({ id: p.id, status: 'PLANNED' })}
                                className="hover:text-foreground text-xs"
                                title="Move to Planned"
                              >
                                ←
                              </button>
                            )}
                            {col.status !== 'ACTIVE' && (
                              <button
                                onClick={() => statusMutation.mutate({ id: p.id, status: 'ACTIVE' })}
                                className="hover:text-foreground text-xs"
                                title="Move to Active"
                              >
                                {col.status === 'PLANNED' ? '→' : '←'}
                              </button>
                            )}
                            {col.status !== 'COMPLETED' && (
                              <button
                                onClick={() => statusMutation.mutate({ id: p.id, status: 'COMPLETED' })}
                                className="hover:text-foreground text-xs"
                                title="Move to Completed"
                              >
                                →
                              </button>
                            )}
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <FormModal open={modalOpen} onOpenChange={setModalOpen} title="New Initiative" description="Scope a project.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              title,
              description,
              status: 'PLANNED',
              targetAt: targetAt ? new Date(targetAt).toISOString() : null,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-muted-foreground">Project Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Mobile App Redesign & API Modernization"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Objective & Scope</label>
            <textarea
              placeholder="What deliverables define this project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Target Deadline</label>
            <input
              type="date"
              value={targetAt}
              onChange={(e) => setTargetAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Initiative</Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
