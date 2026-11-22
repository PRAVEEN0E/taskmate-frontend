'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Layers, ShieldCheck, Eye, EyeOff, LockKeyhole, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { api, setCsrf } from '@/lib/api';
import { Button } from '@/components/ui/button';

const schema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or username').max(254),
  password: z.string().min(1, 'Enter your password'),
});

export function LoginForm() {
  const router = useRouter(),
    reduce = useReducedMotion();
  const [show, setShow] = useState(false),
    [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  return (
    <main className="login-page">
      <div className="ambient" aria-hidden="true" />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-16 lg:grid-cols-2">
        <section className="hidden lg:block space-y-6">
          <div className="flex items-center gap-3 text-3xl font-extrabold text-[#19183B]">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl shadow-[5px_5px_12px_#c8c4e8,-3px_-3px_8px_#ffffff] border border-white">
              <Image
                src="/buddio-icon.png"
                alt="Buddio"
                fill
                className="object-cover"
                priority
              />
            </div>
            <span>Buddio</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-4 py-1.5 text-xs font-bold uppercase tracking-[.25em] text-[#7864F6] shadow-[2px_2px_8px_#d2d0ec]">
            <Sparkles size={13} />
            <span>Private Workspace</span>
          </div>
          <h1 className="text-5xl font-extrabold leading-[1.12] tracking-tight text-[#19183B] sm:text-6xl">
            Less scattered.
            <br />
            More <span className="italic text-[#7864F6]">intentional.</span>
          </h1>
          <p className="max-w-md text-base leading-relaxed text-[#666584]">
            Your tasks, notes, habits, finances, and calendar.
            <br />
            Together in a friendly, tactile 3D space that&apos;s only yours.
          </p>
          <div className="pt-6 flex items-center gap-3 text-sm text-[#666584]">
            <ShieldCheck size={20} className="text-[#7864F6]" />
            <span>Single-owner security. 100% private by design.</span>
          </div>
        </section>

        {/* 3D Clay Login Card */}
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md justify-self-center rounded-[32px] border-2 border-white bg-[#F5F3FF] p-8 shadow-[12px_12px_28px_#c5c2e5,-10px_-10px_24px_#ffffff] sm:p-10"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-white shadow-[4px_4px_10px_#cfcceb,-3px_-3px_8px_#ffffff]">
              <Image
                src="/buddio-icon.png"
                alt="Buddio"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#7864F6]">
                Welcome to Buddio
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-[#19183B]">
                Sign in
              </h2>
            </div>
          </div>
          <p className="mb-7 text-xs font-medium leading-relaxed text-[#666584]">
            Unlock your personal productivity suite.
          </p>

          <form
            onSubmit={handleSubmit(async (values) => {
              setError('');
              try {
                const data = await api<{ csrfToken: string }>('/auth/login', {
                  method: 'POST',
                  body: JSON.stringify(values),
                });
                setCsrf(data.csrfToken);
                router.replace('/dashboard');
                router.refresh();
              } catch (e) {
                setError((e as Error).message);
              }
            })}
            className="space-y-4"
          >
            <div>
              <label htmlFor="identifier" className="label">
                Email or username
              </label>
              <input
                id="identifier"
                className="field"
                placeholder="owner"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                {...register('identifier')}
                aria-invalid={!!errors.identifier}
              />
              {errors.identifier && <p className="field-error">{errors.identifier.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? 'text' : 'password'}
                  className="field pr-12"
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                  onClick={() => setShow(!show)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password.message}</p>}
            </div>

            {error && (
              <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="default"
              className="w-full mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in…' : 'Enter Workspace'}
            </Button>
          </form>
        </motion.section>
      </div>
    </main>
  );
}
