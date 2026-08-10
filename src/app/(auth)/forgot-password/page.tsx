'use client'

import { useState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/app/(auth)/actions'
import {
  Truck,
  Mail,
  Loader2,
  ArrowLeft,
  Lock,
  CheckCircle,
  Shield,
  Send,
} from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await requestPasswordReset(email)

    if (!res.success) {
      setError(res.error || 'Failed to send reset link.')
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full max-w-md px-4">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />

      {/* Card */}
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
            Password reset karo
          </p>
        </div>

        {sent ? (
          /* ===== Success State ===== */
          <div className="animate-fade-in text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
              <CheckCircle className="h-7 w-7 text-success" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">
              Email bhej di!
            </h2>
            <p className="text-sm text-muted mb-1">
              Inbox check karo — reset link bhej diya hai.
            </p>
            <p className="text-xs text-muted/60 mb-8">
              <span className="font-medium text-muted-light">{email}</span> pe
              mail gaya hai. Spam bhi check kar lena.
            </p>

            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-dark px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Login pe wapas jao
            </Link>
          </div>
        ) : (
          /* ===== Form State ===== */
          <>
            {/* Error Message */}
            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger animate-fade-in">
                <Shield className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Info */}
            <p className="mb-6 text-sm text-muted text-center">
              Apna registered email daalo — hum reset link bhej denge.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-medium uppercase tracking-wider text-muted"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    autoFocus
                    className="w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:bg-surface-light focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-dark py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Bhej rahe hain...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Reset link bhejo</span>
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

            {/* Back to Login */}
            <Link
              href="/login"
              className="group flex items-center justify-center gap-2 text-sm text-muted hover:text-primary-light transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Login pe wapas jao</span>
            </Link>
          </>
        )}
      </div>

      {/* Security badge */}
      <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted/50">
        <Lock className="h-3 w-3" />
        <span>256-bit SSL encrypted</span>
      </div>
    </div>
  )
}