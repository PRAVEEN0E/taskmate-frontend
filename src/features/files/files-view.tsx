'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
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
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  Eye,
  X,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'device' | 'url'>('device');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [bytes, setBytes] = useState(250000);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileAsset | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  // Convert base64 data:application/pdf to a clean object/blob URL to bypass browser iframe restrictions
  useEffect(() => {
    if (!previewFile) {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
      return;
    }

    const isPdf = previewFile.mimeType === 'application/pdf' || previewFile.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) return;

    if (previewFile.url.startsWith('data:')) {
      try {
        const parts = previewFile.url.split(';base64,');
        const contentType = parts[0].split(':')[1] || 'application/pdf';
        const raw = atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(blobUrl);
      } catch (err) {
        console.error('Failed to convert base64 to blob URL:', err);
      }
    } else {
      setPdfBlobUrl(previewFile.url);
    }

    return () => {
      if (pdfBlobUrl && pdfBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [previewFile]);

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
      resetForm();
      toast.success('Asset stored successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to upload asset');
    },
    onSettled: () => {
      setIsProcessing(false);
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

  function resetForm() {
    setName('');
    setUrl('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsProcessing(false);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    setSelectedFile(file);
    if (!name) {
      setName(file.name);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsProcessing(true);

    if (activeTab === 'device') {
      if (!selectedFile) {
        toast.error('Please choose a file from your device.');
        setIsProcessing(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        uploadRecordMutation.mutate({
          name: name || selectedFile.name,
          url: base64Data,
          publicId: `device_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          bytes: selectedFile.size,
          resourceType: selectedFile.type.startsWith('image/') ? 'image' : 'raw',
          mimeType: selectedFile.type || 'application/octet-stream',
        });
      };
      reader.onerror = () => {
        toast.error('Failed to read file from device.');
        setIsProcessing(false);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      if (!url) {
        toast.error('Please enter a valid URL.');
        setIsProcessing(false);
        return;
      }

      uploadRecordMutation.mutate({
        name,
        url,
        publicId: `upload_${Date.now()}`,
        bytes: Number(bytes),
        resourceType: 'raw',
        mimeType: name.endsWith('.png') || name.endsWith('.jpg') ? 'image/png' : 'application/pdf',
      });
    }
  }

  // File Icon helper
  const getFileIcon = (mime: string) => {
    if (mime.includes('image')) return <ImageIcon size={20} className="text-emerald-400" />;
    if (mime.includes('code') || mime.includes('json')) return <FileCode size={20} className="text-violet-400" />;
    if (mime.includes('spreadsheet') || mime.includes('csv') || mime.includes('excel'))
      return <FileSpreadsheet size={20} className="text-emerald-400" />;
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
          <EmptyState
            title="No files stored"
            description="Upload files from your device or save web URLs to keep your workspace organized."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-white/[0.02] p-4 transition hover:bg-white/[0.04]"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getFileIcon(f.mimeType)}
                      <span className="text-xs font-bold truncate" title={f.name}>
                        {f.name}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate(f.id)}
                      className="text-muted-foreground hover:text-rose-400 transition shrink-0"
                      title="Delete asset"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-2.5 text-[11px] text-muted-foreground">
                  <span>{(Number(f.bytes) / 1024).toFixed(1)} KB</span>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setPreviewFile(f)}
                      className="flex items-center gap-1 text-[#8ea9e8] hover:text-white transition font-medium cursor-pointer"
                      title="View file"
                    >
                      <Eye size={13} /> View
                    </button>
                    {f.url.startsWith('data:') ? (
                      <a
                        href={f.url}
                        download={f.name}
                        className="flex items-center gap-1 text-emerald-400 hover:underline font-medium"
                      >
                        <Download size={12} /> Download
                      </a>
                    ) : (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sky-400 hover:underline font-medium"
                      >
                        <ExternalLink size={12} /> Open
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Modal */}
      <FormModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) resetForm();
        }}
        title="Upload Asset"
        description="Choose a file from your computer/device or save a file URL."
      >
        <div className="mb-4 flex gap-2 border-b border-border/50 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('device')}
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'device'
                ? 'bg-[#7864F6] text-white shadow-sm'
                : 'bg-white/5 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Upload size={14} /> From Device
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'url'
                ? 'bg-[#7864F6] text-white shadow-sm'
                : 'bg-white/5 text-muted-foreground hover:text-foreground'
            }`}
          >
            <LinkIcon size={14} /> From Web URL
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'device' ? (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Select File</label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id="device-file-input"
              />
              <label
                htmlFor="device-file-input"
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.03] p-6 text-center cursor-pointer transition hover:border-[#7864F6]/50 hover:bg-white/[0.06]"
              >
                {selectedFile ? (
                  <>
                    <CheckCircle2 size={32} className="text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-foreground">{selectedFile.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB · Click to change file
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <UploadCloud size={32} className="text-[#8ea9e8]" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Click or browse from your device</p>
                      <p className="text-[11px] text-muted-foreground">Images, PDFs, documents, audio (up to 10MB)</p>
                    </div>
                  </>
                )}
              </label>

              <div className="mt-3">
                <label className="text-xs font-medium text-muted-foreground">Custom Display Name (optional)</label>
                <input
                  type="text"
                  placeholder={selectedFile ? selectedFile.name : 'e.g. project_report.pdf'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
          ) : (
            <>
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
                  placeholder="https://example.com/file.pdf"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? 'Uploading...' : 'Save File'}
            </Button>
          </div>
        </form>
      </FormModal>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-white/20 bg-[#101827]/95 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.03]">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                {getFileIcon(previewFile.mimeType)}
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate" title={previewFile.name}>
                    {previewFile.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {(Number(previewFile.bytes) / 1024).toFixed(1)} KB · {previewFile.mimeType || 'Unknown format'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {previewFile.url.startsWith('data:') ? (
                  <a
                    href={previewFile.url}
                    download={previewFile.name}
                    className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-white/20 transition"
                  >
                    <Download size={13} /> Download
                  </a>
                ) : (
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-white/20 transition"
                  >
                    <ExternalLink size={13} /> Open Original
                  </a>
                )}
                <button
                  onClick={() => setPreviewFile(null)}
                  className="rounded-xl p-2 text-muted-foreground hover:bg-white/10 hover:text-white transition"
                  aria-label="Close Preview"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px] max-h-[calc(90vh-80px)] bg-black/40">
              {previewFile.mimeType.startsWith('image/') ||
              previewFile.name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-lg"
                />
              ) : previewFile.mimeType === 'application/pdf' || previewFile.name.endsWith('.pdf') ? (
                <div className="w-full h-[75vh] flex flex-col rounded-xl overflow-hidden border border-white/10 bg-slate-900">
                  {pdfBlobUrl ? (
                    <object
                      data={pdfBlobUrl}
                      type="application/pdf"
                      className="w-full h-full"
                    >
                      <iframe
                        src={pdfBlobUrl}
                        title={previewFile.name}
                        className="w-full h-full"
                      />
                      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                        <FileText size={48} className="text-[#8ea9e8] mb-3" />
                        <p className="text-sm font-semibold text-foreground mb-1">{previewFile.name}</p>
                        <p className="text-xs text-muted-foreground mb-4">
                          Your browser cannot display this embedded PDF directly.
                        </p>
                        <div className="flex gap-3">
                          <a
                            href={pdfBlobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#7864F6] px-4 py-2 text-xs font-semibold text-white shadow hover:bg-[#6c56f5]"
                          >
                            <ExternalLink size={14} /> Open PDF in New Tab
                          </a>
                          <a
                            href={previewFile.url}
                            download={previewFile.name}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20"
                          >
                            <Download size={14} /> Download PDF
                          </a>
                        </div>
                      </div>
                    </object>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-400 border-t-transparent mb-3" />
                      <p className="text-xs text-muted-foreground">Preparing PDF document...</p>
                    </div>
                  )}
                </div>
              ) : previewFile.mimeType.startsWith('audio/') ||
                previewFile.name.match(/\.(mp3|wav|ogg|m4a)$/i) ? (
                <div className="flex flex-col items-center gap-4 p-8">
                  <div className="h-16 w-16 rounded-2xl bg-sky-500/20 flex items-center justify-center text-sky-400 shadow-inner">
                    <FileText size={32} />
                  </div>
                  <p className="text-sm font-medium text-foreground">{previewFile.name}</p>
                  <audio controls className="w-full max-w-md">
                    <source src={previewFile.url} type={previewFile.mimeType} />
                    Your browser does not support audio playback.
                  </audio>
                </div>
              ) : previewFile.mimeType.startsWith('video/') ||
                previewFile.name.match(/\.(mp4|webm|mov)$/i) ? (
                <video controls className="max-h-[70vh] max-w-full rounded-xl shadow-lg">
                  <source src={previewFile.url} type={previewFile.mimeType} />
                  Your browser does not support video playback.
                </video>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground border border-white/10">
                    {getFileIcon(previewFile.mimeType)}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{previewFile.name}</p>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Preview is not supported directly in-browser for this format ({previewFile.mimeType || 'Binary'}). Click download or open original to view.
                  </p>
                  {previewFile.url.startsWith('data:') ? (
                    <a
                      href={previewFile.url}
                      download={previewFile.name}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#7864F6] px-4 py-2 text-xs font-semibold text-white shadow hover:bg-[#6c56f5]"
                    >
                      <Download size={14} /> Download File
                    </a>
                  ) : (
                    <a
                      href={previewFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#7864F6] px-4 py-2 text-xs font-semibold text-white shadow hover:bg-[#6c56f5]"
                    >
                      <ExternalLink size={14} /> Open in New Tab
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
