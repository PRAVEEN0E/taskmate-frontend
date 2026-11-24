'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useSession } from '@/hooks/use-session';
import { GlassCard, PageHeader, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { FormModal } from '@/components/ui/dialog';
import {
  Users,
  Plus,
  UserPlus,
  BookOpen,
  CheckSquare,
  Clock,
  Copy,
  Check,
  Shield,
  Trash2,
  Calendar,
  Share2,
  Activity,
  Pin,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface GroupSummary {
  id: string;
  name: string;
  description: string;
  code: string;
  myRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
  owner: { id: string; name: string; username: string };
  _count: { members: number; notes: number; tasks: number };
}

interface GroupNote {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  author: { id: string; name: string; username: string };
}

interface GroupTask {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueAt?: string;
  creator: { id: string; name: string; username: string };
  assignee?: { id: string; name: string; username: string };
}

interface GroupActivityItem {
  id: string;
  action: string;
  target: string;
  createdAt: string;
  user: { id: string; name: string; username: string };
}

export function GroupsView() {
  const queryClient = useQueryClient();
  const { owner } = useSession();

  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'tasks' | 'members' | 'activity'>('notes');

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [joinModal, setJoinModal] = useState(false);
  const [newNoteModal, setNewNoteModal] = useState(false);
  const [newTaskModal, setNewTaskModal] = useState(false);

  // Forms
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [taskDueAt, setTaskDueAt] = useState('');

  // 1. Fetch user's groups
  const { data: groups = [], isLoading: loadingGroups } = useQuery<GroupSummary[]>({
    queryKey: ['groups'],
    queryFn: () => api<GroupSummary[]>('/groups'),
  });

  const selectedGroupId = activeGroupId || (groups.length > 0 ? groups[0].id : null);
  const activeGroup = groups.find((g) => g.id === selectedGroupId);

  // 2. Fetch Group Details (Members, etc.)
  const { data: groupDetails } = useQuery<any>({
    queryKey: ['group-details', selectedGroupId],
    queryFn: () => (selectedGroupId ? api(`/groups/${selectedGroupId}`) : null),
    enabled: !!selectedGroupId,
  });

  // 3. Fetch Group Notes
  const { data: notes = [] } = useQuery<GroupNote[]>({
    queryKey: ['group-notes', selectedGroupId],
    queryFn: () => (selectedGroupId ? api<GroupNote[]>(`/groups/${selectedGroupId}/notes`) : Promise.resolve([])),
    enabled: !!selectedGroupId && activeTab === 'notes',
  });

  // 4. Fetch Group Tasks
  const { data: tasks = [] } = useQuery<GroupTask[]>({
    queryKey: ['group-tasks', selectedGroupId],
    queryFn: () => (selectedGroupId ? api<GroupTask[]>(`/groups/${selectedGroupId}/tasks`) : Promise.resolve([])),
    enabled: !!selectedGroupId && activeTab === 'tasks',
  });

  // 5. Fetch Group Activity
  const { data: activities = [] } = useQuery<GroupActivityItem[]>({
    queryKey: ['group-activity', selectedGroupId],
    queryFn: () =>
      selectedGroupId ? api<GroupActivityItem[]>(`/groups/${selectedGroupId}/activity`) : Promise.resolve([]),
    enabled: !!selectedGroupId && activeTab === 'activity',
  });

  // Mutations
  const createGroupMutation = useMutation({
    mutationFn: () =>
      api('/groups', {
        method: 'POST',
        body: JSON.stringify({ name: groupName, description: groupDesc }),
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setActiveGroupId(res.data.id);
      setCreateModal(false);
      setGroupName('');
      setGroupDesc('');
      toast.success('Group created successfully!');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const joinGroupMutation = useMutation({
    mutationFn: () =>
      api('/groups/join', {
        method: 'POST',
        body: JSON.stringify({ code: joinCode }),
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setActiveGroupId(res.data.id);
      setJoinModal(false);
      setJoinCode('');
      toast.success('Joined group successfully!');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createNoteMutation = useMutation({
    mutationFn: () =>
      api(`/groups/${selectedGroupId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ title: noteTitle, content: noteContent }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-notes', selectedGroupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setNewNoteModal(false);
      setNoteTitle('');
      setNoteContent('');
      toast.success('Group note published');
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) =>
      api(`/groups/${selectedGroupId}/notes/${noteId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-notes', selectedGroupId] });
      toast.success('Note deleted');
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: () =>
      api(`/groups/${selectedGroupId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({
          title: taskTitle,
          priority: taskPriority,
          dueAt: taskDueAt ? new Date(taskDueAt).toISOString() : undefined,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-tasks', selectedGroupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setNewTaskModal(false);
      setTaskTitle('');
      setTaskDueAt('');
      toast.success('Shared task created');
    },
  });

  const toggleTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' }) =>
      api(`/groups/${selectedGroupId}/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-tasks', selectedGroupId] });
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Invite code copied: ${code}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Collaboration & Teams"
        title="Groups & Shared Spaces"
        description="Collaborate with friends, project teams, or study partners with shared notes, team tasks, and member feeds."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setJoinModal(true)} className="gap-2">
              <UserPlus size={16} /> Join with Code
            </Button>
            <Button onClick={() => setCreateModal(true)} className="gap-2">
              <Plus size={16} /> Create Group
            </Button>
          </div>
        }
      />

      {groups.length === 0 ? (
        <GlassCard className="text-center py-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400">
            <Users size={28} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">No Groups Yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            Create a group for team projects or join an existing workspace using a 6-digit invite code.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => setJoinModal(true)}>
              Join Group
            </Button>
            <Button onClick={() => setCreateModal(true)}>
              Create First Group
            </Button>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Groups Sidebar List (4 cols) */}
          <div className="space-y-3 lg:col-span-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">My Workspaces</h3>
            <div className="space-y-2">
              {groups.map((g) => {
                const isSelected = g.id === selectedGroupId;
                return (
                  <div
                    key={g.id}
                    onClick={() => setActiveGroupId(g.id)}
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                      isSelected
                        ? 'border-sky-500/60 bg-sky-500/10 shadow-lg shadow-sky-500/5'
                        : 'border-white/10 bg-black/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{g.name}</h4>
                        {g.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{g.description}</p>
                        )}
                      </div>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                        {g.myRole}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-white/5 pt-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Users size={12} /> {g._count.members}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen size={12} /> {g._count.notes}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckSquare size={12} /> {g._count.tasks}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-foreground/70">{g.code}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Group Content (8 cols) */}
          <div className="space-y-4 lg:col-span-8">
            {activeGroup && (
              <GlassCard className="p-5">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-foreground">{activeGroup.name}</h2>
                      <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] font-bold text-sky-300">
                        {activeGroup.myRole}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Created by {activeGroup.owner.name} • {activeGroup._count.members} Members
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyCode(activeGroup.code)}
                      className="gap-1.5 text-xs h-8 border-sky-500/30 text-sky-300"
                    >
                      <Share2 size={13} /> Code: {activeGroup.code}
                    </Button>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex items-center gap-1 border-b border-white/10 pt-3 pb-3 text-xs">
                  {[
                    { id: 'notes', label: 'Group Notes', icon: BookOpen, count: activeGroup._count.notes },
                    { id: 'tasks', label: 'Shared Tasks', icon: CheckSquare, count: activeGroup._count.tasks },
                    { id: 'members', label: 'Members', icon: Users, count: activeGroup._count.members },
                    { id: 'activity', label: 'Activity', icon: Activity },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium transition ${
                          isActive
                            ? 'bg-sky-500/20 text-sky-200'
                            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                        }`}
                      >
                        <Icon size={14} />
                        <span>{tab.label}</span>
                        {tab.count !== undefined && (
                          <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.2 text-[10px] font-bold">
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Tab 1: Group Notes */}
                {activeTab === 'notes' && (
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Collaborative Notes</span>
                      <Button size="sm" onClick={() => setNewNoteModal(true)} className="gap-1.5 text-xs h-8">
                        <Plus size={14} /> New Note
                      </Button>
                    </div>

                    {notes.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        No shared notes yet. Click &apos;New Note&apos; to write project documentation or meeting summaries.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {notes.map((n) => (
                          <div
                            key={n.id}
                            className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs transition hover:border-white/20"
                          >
                            <div>
                              <div className="flex items-start justify-between">
                                <h4 className="font-semibold text-foreground text-sm line-clamp-1">{n.title}</h4>
                                {n.pinned && <Pin size={13} className="text-amber-400 rotate-45" />}
                              </div>
                              <p className="mt-2 text-muted-foreground line-clamp-4 whitespace-pre-line leading-relaxed">
                                {n.content}
                              </p>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-2 text-[11px] text-muted-foreground">
                              <span>By {n.author.name}</span>
                              <button
                                onClick={() => deleteNoteMutation.mutate(n.id)}
                                className="text-muted-foreground hover:text-rose-400 transition"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Shared Tasks */}
                {activeTab === 'tasks' && (
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Team Deliverables</span>
                      <Button size="sm" onClick={() => setNewTaskModal(true)} className="gap-1.5 text-xs h-8">
                        <Plus size={14} /> Assign Task
                      </Button>
                    </div>

                    {tasks.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        No shared tasks yet. Create and track deliverables with your group.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {tasks.map((t) => {
                          const isDone = t.status === 'COMPLETED';
                          return (
                            <div
                              key={t.id}
                              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() =>
                                    toggleTaskStatusMutation.mutate({
                                      taskId: t.id,
                                      status: isDone ? 'TODO' : 'COMPLETED',
                                    })
                                  }
                                  className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                                    isDone
                                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                                      : 'border-white/30 hover:border-white/60'
                                  }`}
                                >
                                  {isDone && <Check size={11} />}
                                </button>
                                <div>
                                  <p className={`font-semibold ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                    {t.title}
                                  </p>
                                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                                    <span className="capitalize">{t.priority.toLowerCase()} priority</span>
                                    <span>•</span>
                                    <span>By {t.creator.name}</span>
                                    {t.assignee && (
                                      <>
                                        <span>•</span>
                                        <span className="text-sky-300">Assigned: {t.assignee.name}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isDone
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : t.status === 'IN_PROGRESS'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-white/10 text-muted-foreground'
                                }`}
                              >
                                {t.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Members */}
                {activeTab === 'members' && (
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-semibold text-muted-foreground">Workspace Members</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyCode(activeGroup.code)}
                        className="gap-1 text-xs h-7 text-sky-400"
                      >
                        <Copy size={12} /> Invite Link
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {groupDetails?.data?.members?.map((m: any) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 text-white font-bold text-xs">
                              {m.user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{m.user.name}</p>
                              <p className="text-[11px] text-muted-foreground">@{m.user.username}</p>
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              m.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-muted-foreground'
                            }`}
                          >
                            {m.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 4: Activity Log */}
                {activeTab === 'activity' && (
                  <div className="space-y-3 pt-4">
                    <span className="text-xs font-semibold text-muted-foreground">Group Audit Trail</span>
                    {activities.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground">No recorded activity yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {activities.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.015] p-2.5 text-xs text-muted-foreground"
                          >
                            <div>
                              <strong className="text-foreground">{a.user.name}</strong> {a.action}{' '}
                              <span className="text-sky-300">&quot;{a.target}&quot;</span>
                            </div>
                            <span className="text-[10px]">
                              {new Date(a.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </GlassCard>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Group */}
      <FormModal open={createModal} onOpenChange={setCreateModal} title="Create Collaborative Group" description="Start a shared space for teamwork or projects.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createGroupMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-muted-foreground">Group Name</label>
            <input
              type="text"
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Frontend Core Team, CS Study Group"
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Description (Optional)</label>
            <textarea
              value={groupDesc}
              onChange={(e) => setGroupDesc(e.target.value)}
              placeholder="Describe group goals and focus..."
              rows={2}
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createGroupMutation.isPending || !groupName.trim()}>
              Create Group
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Modal: Join Group */}
      <FormModal open={joinModal} onOpenChange={setJoinModal} title="Join Group with Code" description="Enter the 6 to 8 digit invite code provided by your team.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            joinGroupMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-muted-foreground">Invite Code</label>
            <input
              type="text"
              required
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. BUDD-XXXX"
              className="mt-1 w-full font-mono uppercase tracking-widest rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setJoinModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={joinGroupMutation.isPending || !joinCode.trim()}>
              Join Group
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Modal: New Note */}
      <FormModal open={newNoteModal} onOpenChange={setNewNoteModal} title="Publish Group Note" description="Share notes, docs, and summaries with all group members.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createNoteMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <input
              type="text"
              required
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="e.g. Q4 Sprint Architecture & Objectives"
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Content</label>
            <textarea
              required
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write your note, agenda, or documentation..."
              rows={5}
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setNewNoteModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createNoteMutation.isPending || !noteTitle.trim()}>
              Publish Note
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Modal: New Shared Task */}
      <FormModal open={newTaskModal} onOpenChange={setNewTaskModal} title="Create Group Task" description="Assign deliverables across team members.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createTaskMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-muted-foreground">Task Title</label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Set up deployment pipeline on Vercel"
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-xs focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Due Date</label>
              <input
                type="datetime-local"
                value={taskDueAt}
                onChange={(e) => setTaskDueAt(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setNewTaskModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTaskMutation.isPending || !taskTitle.trim()}>
              Create Task
            </Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
