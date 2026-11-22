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
        'clay-card rounded-[28px] p-6 transition-all duration-200',
        hover && 'clay-card-hover',
        highlight && 'bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] border-2 border-white',
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
    <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[.22em] text-[#7864F6]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-[#19183B] sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-[#666584] sm:text-base leading-relaxed font-medium">{description}</p>
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
    <div className="flex min-h-36 flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-[#7864F6]/20 bg-[#E9E8FF]/40 px-4 py-8 text-center shadow-[inset_2px_2px_6px_#d2d0eb,inset_-2px_-2px_6px_#ffffff]">
      <div className="mb-3 text-[#7864F6]">{icon ?? <Sparkles size={24} />}</div>
      <h3 className="text-sm font-semibold text-[#19183B]">{title}</h3>
      <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-[#666584] font-medium">{description}</p>
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
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#666584]">
        <span>{title}</span>
        <span className="rounded-2xl border border-white/80 bg-[#E9E8FF] p-2.5 text-[#7864F6] shadow-[3px_3px_8px_#c8c5e7,-3px_-3px_8px_#ffffff]">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-[#19183B]">{value}</p>
      <div className="mt-2.5 flex items-center justify-between text-xs text-[#666584] font-medium">
        <span>{detail}</span>
        {trend && <span className="font-semibold text-[#7864F6]">{trend}</span>}
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
        <div key={i} className="clay-card h-40 rounded-[28px] bg-[#F5F3FF]" />
      ))}
    </div>
  );
}
