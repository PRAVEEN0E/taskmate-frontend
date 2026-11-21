'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShieldCheck, User, SlidersHorizontal, LockKeyhole } from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { api } from '@/lib/api';
import { GlassCard, PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
const profile = z.object({ name: z.string().trim().min(1).max(80) });
const preferences = z.object({
  timezone: z.string().min(1),
  currency: z.string().length(3),
  theme: z.enum(['dark', 'light', 'system']),
  focusMinutes: z.number().int().min(5).max(120),
  shortBreak: z.number().int().min(1).max(30),
  longBreak: z.number().int().min(5).max(60),
});
const passwords = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(12)
      .max(72)
      .refine((s) => new TextEncoder().encode(s).length <= 72, 'Use at most 72 UTF-8 bytes'),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, {
    path: ['confirm'],
    message: 'Passwords must match',
  });
export function SettingsView({
  timezones,
  currencies,
}: {
  timezones: string[];
  currencies: string[];
}) {
  const { owner, settings } = useSession(),
    client = useQueryClient(),
    router = useRouter();
  const profileForm = useForm<z.infer<typeof profile>>({
      resolver: zodResolver(profile),
      defaultValues: { name: owner.name },
    }),
    prefs = useForm<z.infer<typeof preferences>>({
      resolver: zodResolver(preferences),
      defaultValues: {
        timezone: settings.timezone,
        currency: settings.currency,
        theme: settings.theme,
        focusMinutes: settings.focusMinutes,
        shortBreak: settings.shortBreak,
        longBreak: settings.longBreak,
      },
    }),
    security = useForm<z.infer<typeof passwords>>({ resolver: zodResolver(passwords) });
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ['session'] });
    await client.invalidateQueries({ queryKey: ['dashboard'] });
    router.refresh();
  };
  return (
    <>
      <PageHeader
        eyebrow="Make room for yourself"
        title="Your workspace, your way."
        description="A few small preferences for a more personal experience."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <GlassCard>
          <div className="card-heading">
            <h2>Your profile</h2>
            <User />
          </div>
          <form
            className="space-y-5"
            onSubmit={profileForm.handleSubmit(async (values) => {
              try {
                await api('/profile', { method: 'PATCH', body: JSON.stringify(values) });
                await refresh();
                toast.success('Profile updated');
              } catch (e) {
                toast.error((e as Error).message);
              }
            })}
          >
            <div>
              <label className="label" htmlFor="name">
                Display name
              </label>
              <input id="name" className="field" {...profileForm.register('name')} />
              <p className="field-error">{profileForm.formState.errors.name?.message}</p>
            </div>
            <div>
              <span className="label">Owner email</span>
              <p className="text-sm text-muted-foreground">{owner.email}</p>
            </div>
            <div>
              <span className="label">Username</span>
              <p className="text-sm text-muted-foreground">{owner.username}</p>
            </div>
            <Button type="submit" disabled={profileForm.formState.isSubmitting}>
              {profileForm.formState.isSubmitting ? 'Saving…' : 'Save profile'}
            </Button>
          </form>
        </GlassCard>
        <GlassCard className="xl:row-span-2">
          <div className="card-heading">
            <h2>Workspace preferences</h2>
            <SlidersHorizontal />
          </div>
          <form
            className="space-y-5"
            onSubmit={prefs.handleSubmit(async (values) => {
              try {
                await api('/settings', { method: 'PATCH', body: JSON.stringify(values) });
                await refresh();
                toast.success('Preferences saved');
              } catch (e) {
                toast.error((e as Error).message);
              }
            })}
          >
            <div>
              <label className="label" htmlFor="timezone">
                Timezone
              </label>
              <select id="timezone" className="field" {...prefs.register('timezone')}>
                {Array.from(new Set([settings.timezone, 'UTC', ...timezones])).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="currency">
                  Currency
                </label>
                <select id="currency" className="field" {...prefs.register('currency')}>
                  {currencies.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="theme">
                  Theme
                </label>
                <select id="theme" className="field" {...prefs.register('theme')}>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>
            <div className="border-t border-border pt-5">
              <h3 className="mb-2 text-sm font-semibold">Your focus rhythm</h3>
              <p className="mb-5 text-sm text-muted-foreground">
                Saved now for the Pomodoro timer in Phase 3.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {(['focusMinutes', 'shortBreak', 'longBreak'] as const).map((key, i) => (
                  <div key={key}>
                    <label className="label" htmlFor={key}>
                      {['Focus', 'Short break', 'Long break'][i]}
                    </label>
                    <input
                      type="number"
                      id={key}
                      className="field"
                      {...prefs.register(key, { valueAsNumber: true })}
                    />
                    <span className="text-xs text-muted-foreground">minutes</span>
                  </div>
                ))}
              </div>
            </div>
            {Object.entries(prefs.formState.errors).map(([key, error]) => (
              <p className="field-error" key={key}>
                {key}: {error.message}
              </p>
            ))}
            <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
              <p>Email reminders · Phase 2</p>
              <p className="mt-2">AI preferences · Phase 3</p>
              <p className="mt-3 text-xs">
                These services remain off until their integrations are available.
              </p>
            </div>
            <Button type="submit" disabled={prefs.formState.isSubmitting}>
              {prefs.formState.isSubmitting ? 'Saving…' : 'Save preferences'}
            </Button>
          </form>
        </GlassCard>
        <GlassCard>
          <div className="card-heading">
            <h2>Password & security</h2>
            <LockKeyhole />
          </div>
          <p className="mb-6 text-sm text-muted-foreground">
            Changing your password signs you out of every session.
          </p>
          <form
            className="space-y-5"
            onSubmit={security.handleSubmit(async (values) => {
              try {
                await api('/auth/password', {
                  method: 'POST',
                  body: JSON.stringify({
                    currentPassword: values.currentPassword,
                    newPassword: values.newPassword,
                  }),
                });
                client.clear();
                toast.success('Password changed. Sign in again.');
                router.replace('/login');
                router.refresh();
              } catch (e) {
                toast.error((e as Error).message);
              }
            })}
          >
            {(['currentPassword', 'newPassword', 'confirm'] as const).map((key, i) => (
              <div key={key}>
                <label className="label" htmlFor={key}>
                  {['Current password', 'New password', 'Confirm new password'][i]}
                </label>
                <input
                  id={key}
                  className="field"
                  type="password"
                  autoComplete={i === 0 ? 'current-password' : 'new-password'}
                  {...security.register(key)}
                />
                <p className="field-error">{security.formState.errors[key]?.message}</p>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Use at least 12 characters. Maximum 72 UTF-8 bytes.
            </p>
            <Button type="submit" disabled={security.formState.isSubmitting}>
              {security.formState.isSubmitting ? 'Updating…' : 'Change password'}
            </Button>
          </form>
        </GlassCard>
      </div>
      <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck size={16} />
        Owner-only access. Sessions expire automatically.
      </p>
    </>
  );
}
