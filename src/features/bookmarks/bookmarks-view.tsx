'use client';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GlassCard, PageHeader, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { FormModal } from '@/components/ui/dialog';
import {
  Plus,
  Bookmark as BmIcon,
  ExternalLink,
  Star,
  Trash2,
  Copy,
  Globe,
  Tag,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

export function BookmarksView() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDomain, setFilterDomain] = useState<string | null>(null);

  // Form State
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { data: rawBookmarks = [], isLoading } = useQuery<any[]>({
    queryKey: ['bookmarks'],
    queryFn: () => api<any[]>('/bookmarks'),
  });

  // Extract unique domains for quick filtering
  const domains = useMemo(() => {
    const set = new Set<string>();
    rawBookmarks.forEach((b) => {
      try {
        const u = new URL(b.url);
        set.add(u.hostname.replace('www.', ''));
      } catch {}
    });
    return Array.from(set);
  }, [rawBookmarks]);

  const bookmarks = useMemo(() => {
    return rawBookmarks.filter((b) => {
      if (filterDomain) {
        try {
          const u = new URL(b.url);
          if (u.hostname.replace('www.', '') !== filterDomain) return false;
        } catch {
          return false;
        }
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q);
      }
      return true;
    });
  }, [rawBookmarks, filterDomain, search]);

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      api('/bookmarks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      setModalOpen(false);
      setUrl('');
      setTitle('');
      setDescription('');
      toast.success('Bookmark saved');
    },
  });

  const toggleFavMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/bookmarks/${id}/favorite`, {
        method: 'POST',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/bookmarks/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('Bookmark removed');
    },
  });

  const copyLink = (u: string) => {
    navigator.clipboard.writeText(u);
    toast.success('Link copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Web Intelligence"
        title="Bookmark Vault"
        description="Organize key documentation, research resources, and tools with domain filtering."
        action={
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus size={16} /> Add Bookmark
          </Button>
        }
      />

      {/* Domain Quick Filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setFilterDomain(null)}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
            filterDomain === null
              ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30'
              : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
          }`}
        >
          <Globe size={13} /> All Domains ({rawBookmarks.length})
        </button>
        {domains.map((d) => (
          <button
            key={d}
            onClick={() => setFilterDomain(d === filterDomain ? null : d)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              filterDomain === d
                ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {bookmarks.length === 0 ? (
        <EmptyState title="No bookmarks found" description="Add key resources you reference often." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bm) => {
            let hostname = '';
            try {
              hostname = new URL(bm.url).hostname.replace('www.', '');
            } catch {}

            return (
              <GlassCard key={bm.id} className="flex flex-col justify-between p-5 space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                      {hostname || 'web'}
                    </span>
                    <button
                      onClick={() => toggleFavMutation.mutate(bm.id)}
                      className={bm.favorite ? 'text-amber-400' : 'text-muted-foreground hover:text-amber-400'}
                    >
                      <Star size={16} />
                    </button>
                  </div>
                  <h4 className="mt-2 text-sm font-bold line-clamp-1">{bm.title}</h4>
                  {bm.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{bm.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyLink(bm.url)}
                      className="p-1 text-muted-foreground hover:text-foreground transition"
                      title="Copy link"
                    >
                      <Copy size={13} />
                    </button>
                    <a
                      href={bm.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sky-400 hover:underline font-medium"
                    >
                      <ExternalLink size={12} /> Visit
                    </a>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(bm.id)}
                    className="text-muted-foreground hover:text-rose-400 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <FormModal open={modalOpen} onOpenChange={setModalOpen} title="Save Web Resource" description="Bookmark a link.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({ url, title, description });
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-muted-foreground">Resource URL</label>
            <input
              type="url"
              required
              placeholder="https://github.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Prisma 7 Documentation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Key Notes / Description</label>
            <textarea
              placeholder="Why this bookmark is important..."
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
            <Button type="submit">Save Resource</Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
