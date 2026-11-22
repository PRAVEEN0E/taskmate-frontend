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
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[#19183B]/35 backdrop-blur-sm transition-opacity duration-200" />
        <DialogPrimitive.Content className="clay-card fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[32px] border-2 border-white bg-[#F5F3FF] p-8 shadow-[16px_16px_36px_#c2bfdf,-12px_-12px_28px_#ffffff]">
          <DialogPrimitive.Title className="pr-8 text-xl font-bold tracking-tight text-[#19183B]">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1.5 text-xs text-[#666584] leading-relaxed font-medium">
            {description ?? 'Manage your personal workspace.'}
          </DialogPrimitive.Description>
          <DialogPrimitive.Close
            className="absolute right-6 top-6 rounded-2xl border border-white bg-[#E9E8FF] p-2 text-[#666584] shadow-[3px_3px_8px_#cecced,-2px_-2px_6px_#ffffff] transition hover:text-[#19183B] hover:-translate-y-0.5"
            aria-label="Close dialog"
          >
            <X size={16} />
          </DialogPrimitive.Close>
          <div className="mt-6">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
