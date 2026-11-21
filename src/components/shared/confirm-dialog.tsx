'use client';
import { FormModal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  pending = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  pending?: boolean;
}) {
  return (
    <FormModal open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={pending}>
          {pending ? 'Working…' : 'Confirm'}
        </Button>
      </div>
    </FormModal>
  );
}
