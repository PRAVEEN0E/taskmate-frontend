'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShieldCheck, Eye, EyeOff, LockKeyhole, Sparkles, UserPlus, LogIn } from 'lucide-react';
import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { api, setCsrf } from '@/lib/api';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or username').max(254),
  password: z.string().min(1, 'Enter your password'),
});

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Enter your full name').max(80),
  email: z.string().trim().email('Enter a valid email address').max(254),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Letters, numbers, underscores and dashes only'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72),
});

export function LoginForm() {
  const router = useRouter(),
    reduce = useReducedMotion();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
  });

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
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
  };

  const handleSignup = async (values: z.infer<typeof signupSchema>) => {
    setError('');
    try {
      const data = await api<{ csrfToken: string }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setCsrf(data.csrfToken);
      router.replace('/dashboard');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <main className="login-page">
      <div className="ambient" aria-hidden="true" />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-16 lg:grid-cols-2">
        <section className="hidden lg:block space-y-6">
          <div className="flex items-center gap-3 text-3xl font-bold text-foreground">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/25 shadow-lg">
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
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 text-xs font-semibold uppercase tracking-[.25em] text-[#8ea9e8]">
            <Sparkles size={13} />
            <span>Multi-User Cloud Workspace</span>
          </div>
          <h1 className="text-5xl font-semibold leading-[1.12] tracking-tight text-foreground sm:text-6xl">
            Less scattered.
            <br />
            More <span className="italic text-[#b8a9dd]">intentional.</span>
          </h1>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            Your tasks, notes, habits, finances, and calendar.
            <br />
            Together in an elegant, private workspace built just for you.
          </p>
          <div className="pt-6 flex items-center gap-3 text-sm text-muted-foreground">
            <ShieldCheck size={20} className="text-[#8ea9e8]" />
            <span>End-to-end data isolation. 100% private accounts.</span>
          </div>
        </section>

        {/* Translucent Frosted Glass Auth Card */}
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="glass w-full max-w-md justify-self-center rounded-3xl border border-white/20 bg-[#121c2d]/80 p-8 shadow-[0_24px_64px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-10"
        >
          {/* Mode Switcher Tabs */}
          <div className="mb-6 flex rounded-2xl border border-white/15 bg-white/[0.04] p-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-semibold transition ${
                mode === 'login'
                  ? 'bg-[#8ea9e8]/20 text-white border border-[#8ea9e8]/40 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LogIn size={14} /> Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-semibold transition ${
                mode === 'signup'
                  ? 'bg-[#8ea9e8]/20 text-white border border-[#8ea9e8]/40 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus size={14} /> Create Account
            </button>
          </div>

          <div className="mb-6 inline-flex rounded-2xl border border-white/15 bg-white/[0.06] p-3 text-[#8ea9e8] shadow-sm">
            <LockKeyhole size={24} />
          </div>

          <p className="mb-1 text-xs font-semibold uppercase tracking-[.2em] text-[#8ea9e8]">
            {mode === 'login' ? 'Buddio Login' : 'New User Registration'}
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {mode === 'login' ? 'Welcome back' : 'Join Buddio'}
          </h2>
          <p className="mb-6 mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {mode === 'login'
              ? 'Sign in to access your personal productivity suite.'
              : 'Create your private personal workspace in seconds.'}
          </p>

          {mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div>
                <label htmlFor="identifier" className="label">
                  Email or username
                </label>
                <input
                  id="identifier"
                  className="field"
                  placeholder="name@example.com or username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  {...loginForm.register('identifier')}
                  aria-invalid={!!loginForm.formState.errors.identifier}
                />
                {loginForm.formState.errors.identifier && (
                  <p className="field-error">{loginForm.formState.errors.identifier.message}</p>
                )}
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
                    {...loginForm.register('password')}
                    aria-invalid={!!loginForm.formState.errors.password}
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
                {loginForm.formState.errors.password && (
                  <p className="field-error">{loginForm.formState.errors.password.message}</p>
                )}
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
                disabled={loginForm.formState.isSubmitting}
              >
                {loginForm.formState.isSubmitting ? 'Signing in…' : 'Enter Workspace'}
              </Button>
            </form>
          ) : (
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-3.5">
              <div>
                <label htmlFor="signup-name" className="label">
                  Full Name
                </label>
                <input
                  id="signup-name"
                  className="field"
                  placeholder="Praveen E"
                  autoComplete="name"
                  {...signupForm.register('name')}
                  aria-invalid={!!signupForm.formState.errors.name}
                />
                {signupForm.formState.errors.name && (
                  <p className="field-error">{signupForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="signup-email" className="label">
                  Email Address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  className="field"
                  placeholder="praveen@example.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  {...signupForm.register('email')}
                  aria-invalid={!!signupForm.formState.errors.email}
                />
                {signupForm.formState.errors.email && (
                  <p className="field-error">{signupForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="signup-username" className="label">
                  Username
                </label>
                <input
                  id="signup-username"
                  className="field"
                  placeholder="praveen_dev"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  {...signupForm.register('username')}
                  aria-invalid={!!signupForm.formState.errors.username}
                />
                {signupForm.formState.errors.username && (
                  <p className="field-error">{signupForm.formState.errors.username.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="signup-password" className="label">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={show ? 'text' : 'password'}
                    className="field pr-12"
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    {...signupForm.register('password')}
                    aria-invalid={!!signupForm.formState.errors.password}
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
                {signupForm.formState.errors.password && (
                  <p className="field-error">{signupForm.formState.errors.password.message}</p>
                )}
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
                disabled={signupForm.formState.isSubmitting}
              >
                {signupForm.formState.isSubmitting ? 'Creating account…' : 'Create Account & Enter'}
              </Button>
            </form>
          )}
        </motion.section>
      </div>
    </main>
  );
}
