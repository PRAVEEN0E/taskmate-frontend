import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
export function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('glass rounded-2xl p-6', className)}>{children}</section>;
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
          <p className="mb-3 text-xs font-medium uppercase tracking-[.2em] text-sky-200/80">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-base text-muted-foreground">{description}</p>
      </div>
      {action}
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
    <div className="flex min-h-36 flex-col items-center justify-center px-4 py-7 text-center">
      <div className="mb-3 text-slate-400">{icon ?? <Sparkles size={24} />}</div>
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
export function StatCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string | number;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <GlassCard>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {title}
        <span className="rounded-lg bg-white/5 p-2 text-sky-200">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
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
        <div key={i} className="glass h-40 rounded-2xl" />
      ))}
    </div>
  );
}
