'use client';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GlassCard, PageHeader, EmptyState, StatCard } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { FormModal } from '@/components/ui/dialog';
import {
  Folder,
  FileText,
  HardDrive,
  Plus,
  Trash2,
  ExternalLink,
  UploadCloud,
  Image as ImageIcon,
  FileCode,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

interface FileAsset {
  id: string;
  name: string;
  url: string;
  bytes: string;
  mimeType: string;
  resourceType: string;
  createdAt: string;
}

export function FilesView() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [bytes, setBytes] = useState(250000);
  const [filterType, setFilterType] = useState<string>('ALL');

  // 1. Fetch Files
  const { data: rawFiles = [], isLoading } = useQuery<FileAsset[]>({
    queryKey: ['files'],
    queryFn: () => api<FileAsset[]>('/files'),
  });

  // 2. Fetch Storage
  const { data: storage = { totalMegabytes: '0.00', fileCount: 0 } } = useQuery<any>({
    queryKey: ['file-storage'],
    queryFn: () => api<any>('/files/storage'),
  });

  const files = useMemo(() => {
    if (filterType === 'ALL') return rawFiles;
    if (filterType === 'IMAGES') return rawFiles.filter((f) => f.mimeType.includes('image'));
    if (filterType === 'DOCS') return rawFiles.filter((f) => f.mimeType.includes('pdf') || f.mimeType.includes('doc'));
    return rawFiles;
  }, [rawFiles, filterType]);

  const uploadRecordMutation = useMutation({
    mutationFn: (data: any) =>
      api('/files', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['file-storage'] });
      setModalOpen(false);
      setName('');
      setUrl('');
      toast.success('Asset stored successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/files/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['file-storage'] });
      toast.success('Asset deleted');
    },
  });

  // File Icon helper
  const getFileIcon = (mime: string) => {
    if (mime.includes('image')) return <ImageIcon size={20} className="text-emerald-400" />;
    if (mime.includes('code') || mime.includes('json')) return <FileCode size={20} className="text-violet-400" />;
    return <FileText size={20} className="text-sky-400" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Storage & Documents"
        title="File Manager"
        description="Private cloud asset repository, metadata tracking, and storage consumption overview."
        action={
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <UploadCloud size={16} /> Upload Asset
          </Button>
        }
      />

      {/* Storage Overview Strip */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Storage Consumption"
          value={`${storage.totalMegabytes} MB`}
          detail="Calculated from verified asset records"
          icon={<HardDrive className="text-sky-400" size={18} />}
        />
        <StatCard
          title="Indexed Files"
          value={storage.fileCount}
          detail="Active documents, assets and images"
          icon={<FileText className="text-violet-400" size={18} />}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 border-b border-border pb-3 text-xs">
        {(
          [
            ['ALL', 'All Assets'],
            ['IMAGES', 'Images'],
            ['DOCS', 'Documents'],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`rounded-xl px-3 py-1.5 font-medium transition ${
              filterType === tab
                ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Assets Grid */}
      <GlassCard className="p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Asset Repository</h3>
        {files.length === 0 ? (
          <EmptyState title="No files stored" description="Upload document or image references to keep your workspace organized." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-white/[0.02] p-4 transition hover:bg-white/[0.04]"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {getFileIcon(f.mimeType)}
                      <span className="text-xs font-bold line-clamp-1">{f.name}</span>
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate(f.id)}
                      className="text-muted-foreground hover:text-rose-400 transition"
                      title="Delete asset"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-2.5 text-[11px] text-muted-foreground">
                  <span>{(Number(f.bytes) / 1024).toFixed(1)} KB</span>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sky-400 hover:underline font-medium"
                  >
                    <ExternalLink size={12} /> Open
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Modal */}
      <FormModal open={modalOpen} onOpenChange={setModalOpen} title="Upload Asset" description="Record a file link or asset.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            uploadRecordMutation.mutate({
              name,
              url,
              publicId: `upload_${Date.now()}`,
              bytes: Number(bytes),
              resourceType: 'raw',
              mimeType: name.endsWith('.png') || name.endsWith('.jpg') ? 'image/png' : 'application/pdf',
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-muted-foreground">File Name</label>
            <input
              type="text"
              required
              placeholder="e.g. system_architecture_diagram.png"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Asset URL</label>
            <input
              type="url"
              required
              placeholder="https://res.cloudinary.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Store Asset</Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
