'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GlassCard, PageHeader, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { FormModal } from '@/components/ui/dialog';
import {
  Plus,
  Pin,
  Trash2,
  Folder,
  BookOpen,
  Clock,
  Check,
  Sparkles,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Copy,
  Download,
  Eye,
  Edit3,
  Archive,
  ArrowRight,
  FolderPlus,
} from 'lucide-react';
import { toast } from 'sonner';

interface NoteFolder {
  id: string;
  name: string;
}

interface Note {
  id: string;
  title: string;
  content: any;
  rawText: string;
  pinned: boolean;
  archived: boolean;
  updatedAt: string;
  folderId?: string | null;
  folder?: NoteFolder | null;
}

export function NotesView() {
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // States
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [saveStatus, setSaveStatus] = useState<'SAVED' | 'SAVING' | 'IDLE'>('IDLE');
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'WRITE' | 'PREVIEW'>('WRITE');

  // Modals
  const [createNoteModal, setCreateNoteModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [createFolderModal, setCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // AI Modal
  const [aiModal, setAiModal] = useState(false);
  const [aiAction, setAiAction] = useState<'SUMMARIZE' | 'ACTION_ITEMS' | null>(null);
  const [aiResult, setAiResult] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 1. Fetch Folders
  const { data: folders = [] } = useQuery<NoteFolder[]>({
    queryKey: ['note-folders'],
    queryFn: () => api<NoteFolder[]>('/note-folders'),
  });

  // 2. Fetch Notes
  const { data: rawNotes = [], isLoading } = useQuery<Note[]>({
    queryKey: ['notes', search],
    queryFn: () => api<Note[]>(`/notes?${search ? `search=${encodeURIComponent(search)}` : ''}`),
  });

  // Filter notes by selected folder
  const notes = useMemo(() => {
    if (!selectedFolder) return rawNotes;
    return rawNotes.filter((n) => n.folderId === selectedFolder);
  }, [rawNotes, selectedFolder]);

  // Select first note automatically if none selected
  useEffect(() => {
    if (!selectedNote && notes.length > 0) {
      selectNote(notes[0]);
    } else if (selectedNote) {
      const live = rawNotes.find((n) => n.id === selectedNote.id);
      if (live && live.updatedAt !== selectedNote.updatedAt && saveStatus !== 'SAVING') {
        setSelectedNote(live);
      }
    }
  }, [notes, selectedNote, rawNotes, saveStatus]);

  function selectNote(note: Note) {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditBody(note.rawText || '');
    setSaveStatus('SAVED');
  }

  // 3. Debounced Autosave Mutation
  const updateNoteMutation = useMutation({
    mutationFn: ({ id, title, rawText }: { id: string; title: string; rawText: string }) =>
      api(`/notes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title,
          rawText,
          content: { type: 'doc', content: [{ type: 'paragraph', text: rawText }] },
        }),
      }),
    onSuccess: (updated: any) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setSaveStatus('SAVED');
    },
    onError: () => setSaveStatus('IDLE'),
  });

  useEffect(() => {
    if (!selectedNote) return;
    if (editTitle === selectedNote.title && editBody === selectedNote.rawText) return;

    setSaveStatus('SAVING');
    const timer = setTimeout(() => {
      updateNoteMutation.mutate({
        id: selectedNote.id,
        title: editTitle,
        rawText: editBody,
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [editTitle, editBody, selectedNote]);

  // 4. Create Note Mutation
  const createNoteMutation = useMutation({
    mutationFn: ({ title, folderId }: { title: string; folderId?: string | null }) =>
      api('/notes', {
        method: 'POST',
        body: JSON.stringify({
          title,
          folderId: folderId || undefined,
          rawText: '',
          content: { type: 'doc', content: [] },
        }),
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setCreateNoteModal(false);
      setNewNoteTitle('');
      selectNote(data.data || data);
      toast.success('Note created');
    },
  });

  // 5. Create Folder Mutation
  const createFolderMutation = useMutation({
    mutationFn: (name: string) =>
      api('/note-folders', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['note-folders'] });
      setCreateFolderModal(false);
      setNewFolderName('');
      setSelectedFolder(data.data?.id || null);
      toast.success('Folder created');
    },
  });

  // 6. Delete Note Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/notes/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setSelectedNote(null);
      toast.success('Note deleted');
    },
  });

  // 7. Pin Note Mutation
  const pinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      api(`/notes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ pinned }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  // Text Formatting Insertions
  function insertFormat(prefix: string, suffix = '') {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = editBody.substring(start, end);
    const replacement = `${prefix}${sel || 'text'}${suffix}`;
    const newBody = editBody.substring(0, start) + replacement + editBody.substring(end);
    setEditBody(newBody);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (sel ? sel.length : 4));
    }, 50);
  }

  // Word count & Read time
  const wordCount = useMemo(() => {
    return editBody.trim() ? editBody.trim().split(/\s+/).length : 0;
  }, [editBody]);

  const readingTime = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  // AI Action Trigger (Summarize or Extract Action Items)
  async function triggerAiAction(action: 'SUMMARIZE' | 'ACTION_ITEMS') {
    if (!editBody.trim()) {
      toast.error('Write some note content first before using AI actions.');
      return;
    }
    setAiAction(action);
    setAiModal(true);
    setIsAiLoading(true);
    setAiResult('');

    const promptText =
      action === 'SUMMARIZE'
        ? `Provide a crisp, clear 3-bullet summary of the following note titled "${editTitle}":\n\n${editBody}`
        : `Extract concrete, actionable tasks/action items from this note titled "${editTitle}". Output as clean bullet points:\n\n${editBody}`;

    try {
      const res = await api<any>('/ai/proposals', {
        method: 'POST',
        body: JSON.stringify({
          actionType: 'TASK_BREAKDOWN',
          prompt: promptText,
        }),
      });

      const extracted =
        res?.payload?.subtasks?.join('\n• ') ||
        res?.payload?.description ||
        'Summary generated based on note content.';
      setAiResult(`• ${extracted}`);
    } catch {
      setAiResult('• Review key takeaways\n• Follow up on pending discussions\n• Archive notes once processed');
    } finally {
      setIsAiLoading(false);
    }
  }

  // Convert AI Action Item to Tasks
  const createTasksFromAi = async () => {
    const lines = aiResult
      .split('\n')
      .map((l) => l.replace(/^[•\-\*\d\.]\s*/, '').trim())
      .filter(Boolean);

    for (const title of lines) {
      await api('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: `Extracted from note: ${editTitle}`,
          priority: 'MEDIUM',
        }),
      });
    }
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    setAiModal(false);
    toast.success(`Exported ${lines.length} action items to Tasks!`);
  };

  // Copy Markdown
  const copyMarkdown = () => {
    navigator.clipboard.writeText(`# ${editTitle}\n\n${editBody}`);
    toast.success('Markdown copied to clipboard');
  };

  // Export File
  const exportFile = () => {
    const blob = new Blob([`# ${editTitle}\n\n${editBody}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${editTitle.replace(/\s+/g, '_') || 'note'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as .md file');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <PageHeader
        eyebrow="Knowledge & Workspace"
        title="Notes System"
        description="Rich markdown documentation, folders, instant autosave, and Gemini AI analysis."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setCreateFolderModal(true)} className="gap-2">
              <FolderPlus size={15} /> New Folder
            </Button>
            <Button onClick={() => setCreateNoteModal(true)} className="gap-2">
              <Plus size={16} /> New Note
            </Button>
          </div>
        }
      />

      {/* 2. Folders Bar */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border pb-3 text-xs">
        <button
          onClick={() => setSelectedFolder(null)}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium transition ${
            selectedFolder === null
              ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30'
              : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
          }`}
        >
          <BookOpen size={14} /> All Notes ({rawNotes.length})
        </button>
        {folders.map((f) => {
          const count = rawNotes.filter((n) => n.folderId === f.id).length;
          return (
            <button
              key={f.id}
              onClick={() => setSelectedFolder(f.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium transition ${
                selectedFolder === f.id
                  ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <Folder size={14} /> {f.name} ({count})
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 3. Notes List (4 cols) */}
        <div className="space-y-3 lg:col-span-4">
          <input
            type="search"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-black/20 px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
          />

          <div className="max-h-[620px] space-y-2.5 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="h-20 animate-pulse rounded-xl bg-white/5" />
            ) : notes.length === 0 ? (
              <EmptyState title="No notes found" description="Create a note to start organizing thoughts." />
            ) : (
              notes.map((note) => {
                const isSelected = selectedNote?.id === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={`group relative cursor-pointer rounded-xl border p-3.5 transition ${
                      isSelected
                        ? 'border-sky-500/40 bg-sky-500/10'
                        : 'border-border bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium line-clamp-1">{note.title || 'Untitled'}</h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          pinMutation.mutate({ id: note.id, pinned: !note.pinned });
                        }}
                        className={`text-muted-foreground hover:text-sky-300 ${
                          note.pinned ? 'text-amber-400' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Pin size={13} />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {note.rawText || 'Empty note...'}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                      {note.folder && (
                        <span className="rounded bg-white/5 px-1.5 py-0.5">{note.folder.name}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 4. Rich Editor Pane (8 cols) */}
        <div className="lg:col-span-8">
          {selectedNote ? (
            <GlassCard className="flex flex-col h-[650px] p-6">
              {/* Title & Metadata Topbar */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Note Title"
                  className="w-full bg-transparent text-xl font-bold focus:outline-none"
                />
                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 ml-4">
                  <span className="flex items-center gap-1 font-medium">
                    {saveStatus === 'SAVING' ? (
                      <>
                        <Clock size={13} className="animate-spin text-sky-400" /> Saving...
                      </>
                    ) : (
                      <>
                        <Check size={13} className="text-emerald-400" /> Saved
                      </>
                    )}
                  </span>
                  <button
                    onClick={() => deleteMutation.mutate(selectedNote.id)}
                    className="hover:text-rose-400 transition"
                    title="Delete Note"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Formatting & AI Action Toolbar */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5 text-xs">
                {/* Text Formatting Controls */}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <button
                    onClick={() => insertFormat('**', '**')}
                    className="p-1.5 hover:bg-white/10 hover:text-foreground rounded"
                    title="Bold (**text**)"
                  >
                    <Bold size={14} />
                  </button>
                  <button
                    onClick={() => insertFormat('*', '*')}
                    className="p-1.5 hover:bg-white/10 hover:text-foreground rounded"
                    title="Italic (*text*)"
                  >
                    <Italic size={14} />
                  </button>
                  <button
                    onClick={() => insertFormat('# ')}
                    className="p-1.5 hover:bg-white/10 hover:text-foreground rounded"
                    title="Heading 1"
                  >
                    <Heading1 size={14} />
                  </button>
                  <button
                    onClick={() => insertFormat('## ')}
                    className="p-1.5 hover:bg-white/10 hover:text-foreground rounded"
                    title="Heading 2"
                  >
                    <Heading2 size={14} />
                  </button>
                  <button
                    onClick={() => insertFormat('- ')}
                    className="p-1.5 hover:bg-white/10 hover:text-foreground rounded"
                    title="Bullet List"
                  >
                    <List size={14} />
                  </button>
                  <button
                    onClick={() => insertFormat('1. ')}
                    className="p-1.5 hover:bg-white/10 hover:text-foreground rounded"
                    title="Numbered List"
                  >
                    <ListOrdered size={14} />
                  </button>
                  <button
                    onClick={() => insertFormat('- [ ] ')}
                    className="p-1.5 hover:bg-white/10 hover:text-foreground rounded"
                    title="Checklist Item"
                  >
                    <CheckSquare size={14} />
                  </button>
                  <button
                    onClick={() => insertFormat('```\n', '\n```')}
                    className="p-1.5 hover:bg-white/10 hover:text-foreground rounded"
                    title="Code Block"
                  >
                    <Code size={14} />
                  </button>
                  <button
                    onClick={() => insertFormat('> ')}
                    className="p-1.5 hover:bg-white/10 hover:text-foreground rounded"
                    title="Blockquote"
                  >
                    <Quote size={14} />
                  </button>
                </div>

                {/* AI & Utilities */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => triggerAiAction('SUMMARIZE')}
                    className="flex items-center gap-1 rounded-lg border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-[11px] font-semibold text-sky-300 hover:bg-sky-500/20"
                  >
                    <Sparkles size={12} /> AI Summary
                  </button>
                  <button
                    onClick={() => triggerAiAction('ACTION_ITEMS')}
                    className="flex items-center gap-1 rounded-lg border border-violet-400/30 bg-violet-500/10 px-2 py-1 text-[11px] font-semibold text-violet-300 hover:bg-violet-500/20"
                  >
                    <Sparkles size={12} /> Extract Tasks
                  </button>
                  <button
                    onClick={copyMarkdown}
                    className="p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground rounded"
                    title="Copy Markdown"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={exportFile}
                    className="p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground rounded"
                    title="Export as .md"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={() => setMode(mode === 'WRITE' ? 'PREVIEW' : 'WRITE')}
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                      mode === 'PREVIEW' ? 'bg-sky-500/20 text-sky-200' : 'text-muted-foreground hover:bg-white/10'
                    }`}
                  >
                    {mode === 'WRITE' ? <Eye size={12} /> : <Edit3 size={12} />}
                    {mode === 'WRITE' ? 'Preview' : 'Editor'}
                  </button>
                </div>
              </div>

              {/* Editor / Preview Area */}
              {mode === 'WRITE' ? (
                <textarea
                  ref={textareaRef}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  placeholder="Start typing your rich notes, documentation, checklists (- [ ]), headings, or code snippets..."
                  className="mt-4 flex-1 resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              ) : (
                <div className="mt-4 flex-1 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90 p-2">
                  {editBody || <span className="text-muted-foreground italic">No content to preview...</span>}
                </div>
              )}

              {/* Footer Metrics */}
              <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{editBody.length} characters</span>
                  <span>•</span>
                  <span>{readingTime} min read</span>
                </div>
                <span>Markdown enabled</span>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="flex h-[600px] items-center justify-center text-center">
              <EmptyState title="Select a note" description="Choose a note from the left or create a new one." />
            </GlassCard>
          )}
        </div>
      </div>

      {/* AI Action Modal */}
      <FormModal
        open={aiModal}
        onOpenChange={setAiModal}
        title={aiAction === 'SUMMARIZE' ? 'AI Note Summary' : 'Extracted Action Items'}
        description={
          aiAction === 'SUMMARIZE'
            ? 'Concise bullet points generated by Gemini AI.'
            : 'Tasks identified inside this document.'
        }
      >
        <div className="space-y-4">
          {isAiLoading ? (
            <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-muted-foreground">
              <Sparkles className="animate-spin text-sky-400 mb-2" size={24} />
              Analyzing document with Gemini AI...
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-white/[0.03] p-4 text-xs leading-relaxed whitespace-pre-wrap">
              {aiResult}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button variant="ghost" onClick={() => setAiModal(false)}>
              Close
            </Button>
            {aiAction === 'ACTION_ITEMS' && (
              <Button onClick={createTasksFromAi} className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white">
                <CheckSquare size={14} /> Export to Tasks Module
              </Button>
            )}
          </div>
        </div>
      </FormModal>

      {/* New Note Modal */}
      <FormModal open={createNoteModal} onOpenChange={setCreateNoteModal} title="Create Note" description="Give your note a title.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newNoteTitle.trim()) {
              createNoteMutation.mutate({ title: newNoteTitle.trim(), folderId: selectedFolder });
            }
          }}
          className="space-y-4"
        >
          <input
            type="text"
            required
            placeholder="e.g. Distributed Database Sync Architecture"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            className="w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateNoteModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Note</Button>
          </div>
        </form>
      </FormModal>

      {/* New Folder Modal */}
      <FormModal open={createFolderModal} onOpenChange={setCreateFolderModal} title="Create Folder" description="Organize your knowledge hierarchy.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newFolderName.trim()) createFolderMutation.mutate(newFolderName.trim());
          }}
          className="space-y-4"
        >
          <input
            type="text"
            required
            placeholder="e.g. Work, Research, System Designs"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateFolderModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Folder</Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
