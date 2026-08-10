'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Truck, Mail, Lock, Loader2, ArrowRight, Shield } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="relative w-full max-w-md px-4">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />

      {/* Login Card */}
      <div className="relative rounded-2xl border border-border bg-card/80 p-8 shadow-2xl backdrop-blur-xl">
        {/* Logo & Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-accent shadow-lg shadow-primary/20">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Transport<span className="gradient-text">AI</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            India ka smart transport platform
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger animate-fade-in">
            <Shield className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-xs font-medium uppercase tracking-wider text-muted"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:bg-surface-light focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-xs font-medium uppercase tracking-wider text-muted"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary-light hover:text-primary transition-colors"
              >
                Password bhool gaye?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:bg-surface-light focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-dark py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Login karo</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted/60">•</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Footer Text */}
        <p className="text-center text-xs text-muted">
          Pehli baar?{' '}
          <Link
            href="/signup"
            className="font-medium text-primary-light hover:text-primary transition-colors"
          >
            Register karo
          </Link>
        </p>
      </div>

      {/* Security badge */}
      <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted/50">
        <Lock className="h-3 w-3" />
        <span>256-bit SSL encrypted</span>
      </div>
    </div>
  )
}