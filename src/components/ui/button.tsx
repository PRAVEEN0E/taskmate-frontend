import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const variants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[18px] text-sm font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7864F6] disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-[#7864F6] text-white border border-white/40 shadow-[5px_5px_14px_#c4c0e9,-4px_-4px_10px_#ffffff] hover:-translate-y-0.5 hover:bg-[#6c56f5] active:translate-y-0 active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)]',
        glass:
          'bg-[#F5F3FF] text-[#19183B] border border-white/80 shadow-[4px_4px_12px_#cfcde9,-4px_-4px_12px_#ffffff] hover:-translate-y-0.5 hover:bg-[#ECE8FF] active:translate-y-0 active:shadow-[inset_2px_2px_4px_#d2d0eb]',
        outline:
          'bg-[#F3F1FF] text-[#19183B] border border-white shadow-[3px_3px_10px_#d2d0ec,-3px_-3px_10px_#ffffff] hover:-translate-y-0.5 hover:bg-[#EAE8FF] active:translate-y-0',
        ghost:
          'text-[#666584] hover:text-[#19183B] hover:bg-[#EAE8FF] rounded-2xl',
        secondary:
          'bg-[#A69AF8] text-white border border-white/40 shadow-[4px_4px_12px_#c8c3e8,-4px_-4px_10px_#ffffff] hover:-translate-y-0.5 active:translate-y-0',
        danger:
          'bg-[#F47C91] text-white border border-white/40 shadow-[4px_4px_12px_#e5bac2,-4px_-4px_10px_#ffffff] hover:-translate-y-0.5 active:translate-y-0',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3.5 text-xs rounded-xl',
        lg: 'h-11 px-7 text-base rounded-2xl',
        icon: 'h-9 w-9 rounded-xl',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof variants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(variants({ variant, size, className }))} {...props} />;
}
