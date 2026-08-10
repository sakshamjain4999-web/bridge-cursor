'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updatePassword } from '@/app/(auth)/actions'
import { toast } from 'sonner'
import {
  Truck,
  Lock,
  Loader2,
  KeyRound,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react'

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Dono passwords match nahi kar rahe!')
      return
    }

    // Validate minimum length
    if (newPassword.length < 6) {
      setError('Password kam se kam 6 characters ka hona chahiye')
      return
    }

    setLoading(true)

    const res = await updatePassword(newPassword)

    if (!res.success) {
      setError(res.error || 'Failed to update password')
      setLoading(false)
      return
    }

    setLoading(false)
    toast.success('Password badal gaya!')
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }

  const inputCls =
    'w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-11 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:bg-surface-light focus:outline-none focus:ring-1 focus:ring-primary/50'

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
            Naya password set karo
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger animate-fade-in">
            <Shield className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Info */}
        <p className="mb-6 text-sm text-muted text-center">
          Apna naya password daalo — dono fields mein same hona chahiye.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="new-password"
              className="block text-xs font-medium uppercase tracking-wider text-muted"
            >
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoFocus
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-muted-light transition-colors"
                tabIndex={-1}
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="confirm-password"
              className="block text-xs font-medium uppercase tracking-wider text-muted"
            >
              Confirm Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className={`${inputCls} ${
                  confirmPassword &&
                  newPassword !== confirmPassword
                    ? 'border-danger/50 focus:border-danger focus:ring-danger/50'
                    : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-muted-light transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {/* Mismatch hint */}
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-danger animate-fade-in">
                Passwords match nahi kar rahe
              </p>
            )}
            {/* Match indicator */}
            {confirmPassword && newPassword === confirmPassword && (
              <p className="text-xs text-success animate-fade-in">
                ✓ Passwords match kar rahe hain
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-dark py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Update ho raha hai...</span>
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                <span>Password update karo</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Security badge */}
      <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted/50">
        <Lock className="h-3 w-3" />
        <span>256-bit SSL encrypted</span>
      </div>
    </div>
  )
}