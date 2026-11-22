import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const variants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#8ea9e8] disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-[#8ea9e8] to-[#b8a9dd] text-[#0e1726] font-semibold shadow-[0_4px_20px_rgba(142,169,232,0.25)] hover:brightness-105 hover:shadow-[0_6px_24px_rgba(142,169,232,0.35)] border border-white/20',
        glass:
          'border border-white/15 bg-white/[0.08] backdrop-blur-md text-foreground hover:bg-white/[0.14] hover:border-white/25 shadow-sm',
        outline:
          'border border-white/14 bg-white/[0.04] text-foreground hover:bg-white/[0.09] hover:border-white/20 backdrop-blur-sm',
        ghost:
          'text-muted-foreground hover:text-foreground hover:bg-white/[0.08] rounded-xl',
        secondary:
          'bg-white/10 text-foreground border border-white/10 hover:bg-white/15 backdrop-blur-md',
        danger:
          'bg-red-500/20 text-red-200 border border-red-500/30 hover:bg-red-500/30',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs rounded-lg',
        lg: 'h-11 px-6 text-base rounded-xl',
        icon: 'h-9 w-9 rounded-xl',
      },
    },
    defaultVariants: { variant: 'glass', size: 'default' },
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
