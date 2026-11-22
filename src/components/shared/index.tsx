import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export function GlassCard({
  children,
  className,
  hover = false,
  highlight = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  highlight?: boolean;
}) {
  return (
    <section
      className={cn(
        'glass rounded-2xl p-6 transition-all duration-200',
        hover && 'hover:border-white/25 hover:bg-white/[0.09] hover:shadow-[0_12px_40px_rgba(0,0,0,0.22)]',
        highlight && 'border-white/20 bg-gradient-to-br from-white/[0.09] via-white/[0.05] to-sky-500/[0.06]',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[.22em] text-[#8ea9e8]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base leading-relaxed">{description}</p>
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center">
      <div className="mb-3 text-[#8ea9e8]/75">{icon ?? <Sparkles size={24} />}</div>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

export function StatCard({
  title,
  value,
  detail,
  icon,
  trend,
}: {
  title: string;
  value: string | number;
  detail: string;
  icon: ReactNode;
  trend?: string;
}) {
  return (
    <GlassCard hover className="relative overflow-hidden">
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span>{title}</span>
        <span className="rounded-xl border border-white/15 bg-white/[0.05] p-2 text-[#8ea9e8] shadow-sm">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{detail}</span>
        {trend && <span className="font-medium text-[#8ea9e8]">{trend}</span>}
      </div>
    </GlassCard>
  );
}

export function LoadingSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading workspace"
      className="grid animate-pulse gap-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="glass h-40 rounded-2xl bg-white/[0.03]" />
      ))}
    </div>
  );
}
