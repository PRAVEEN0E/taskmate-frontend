'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Layers, ShieldCheck, Eye, EyeOff, LockKeyhole } from 'lucide-react';
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
        <section className="hidden lg:block">
          <div className="mb-20 flex items-center gap-3 text-2xl font-semibold">
            <span className="brand-icon">
              <Layers />
            </span>
            TaskMate <span className="text-sky-200">AI</span>
          </div>
          <p className="mb-5 text-xs uppercase tracking-[.3em] text-sky-200">
            A little space for yourself
          </p>
          <h1 className="text-6xl font-medium leading-[1.12] tracking-tight">
            Less scattered.
            <br />
            More <span className="font-serif italic text-blue-200">intentional.</span>
          </h1>
          <p className="mt-7 max-w-md text-lg leading-relaxed text-muted-foreground">
            Your thoughts, plans, and everyday progress.
            <br />
            Together in a space that&apos;s only yours.
          </p>
          <div className="mt-14 flex items-center gap-3 text-sm text-muted-foreground">
            <ShieldCheck size={19} className="text-blue-200" />
            One owner. A private workspace.
          </div>
        </section>
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass w-full max-w-md justify-self-center rounded-3xl p-8 sm:p-11"
        >
          <div className="mb-7 inline-flex rounded-2xl border border-border bg-white/5 p-3 text-sky-200">
            <LockKeyhole size={25} />
          </div>
          <p className="mb-2 text-xs uppercase tracking-[.2em] text-muted-foreground">
            Welcome to TaskMate AI
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">Your space awaits.</h2>
          <p className="mb-8 mt-3 text-sm text-muted-foreground">
            Sign in to your personal workspace.
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
            className="space-y-5"
          >
            <div>
              <label htmlFor="identifier" className="label">
                Email or username
              </label>
              <input
                id="identifier"
                className="field"
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
                  autoComplete="current-password"
                  {...register('password')}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-muted-foreground"
                  aria-label={show ? 'Hide password' : 'Show password'}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password.message}</p>}
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-300/20 bg-red-300/5 p-3 text-sm text-red-200"
              >
                {error}
              </p>
            )}
            <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <details className="mt-7 text-sm text-muted-foreground">
            <summary className="cursor-pointer">Need to recover access?</summary>
            <p className="mt-3 leading-relaxed">
              Use the owner recovery command on your trusted backend host. See the project README
              for the secure procedure.
            </p>
          </details>
          <p className="mt-8 border-t border-border pt-5 text-center text-xs text-muted-foreground">
            Owner access only · No public registration
          </p>
        </motion.section>
      </div>
    </main>
  );
}
