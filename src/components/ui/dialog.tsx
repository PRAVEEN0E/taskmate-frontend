'use client';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-md transition-opacity duration-200" />
        <DialogPrimitive.Content className="glass fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-white/20 bg-[#141d2e]/85 p-7 shadow-[0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          <DialogPrimitive.Title className="pr-8 text-xl font-semibold tracking-tight text-foreground">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            {description ?? 'Manage your personal workspace.'}
          </DialogPrimitive.Description>
          <DialogPrimitive.Close
            className="absolute right-5 top-5 rounded-xl border border-white/10 bg-white/5 p-1.5 text-muted-foreground transition hover:bg-white/15 hover:text-foreground"
            aria-label="Close dialog"
          >
            <X size={18} />
          </DialogPrimitive.Close>
          <div className="mt-6">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
