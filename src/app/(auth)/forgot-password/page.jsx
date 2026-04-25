// FILE: src/app/(auth)/forgot-password/page.jsx
'use client'

import { useState }       from 'react'
import Link               from 'next/link'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { forgotPassword } from '@/lib/actions/auth'
import { cn }             from '@/utils/cn'
import toast              from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Email is required'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return }

    setLoading(true)
    const result = await forgotPassword({ email })

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) return (
    <div className="card p-8 text-center animate-scale-in">
      <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 size={32} className="text-brand" />
      </div>
      <h2 className="text-xl font-bold text-brand-800 mb-2">Check your email</h2>
      <p className="text-neutral-500 text-sm mb-6">
        We sent a password reset link to <strong className="text-neutral-700">{email}</strong>.
        Check your inbox and spam folder.
      </p>
      <Link href="/login" className="btn btn-secondary btn-md btn-full">
        ← Back to Sign In
      </Link>
    </div>
  )

  return (
    <div className="card p-8 animate-scale-in">
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-brand mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to Sign In
      </Link>

      <h1 className="text-2xl font-bold text-brand-800 mb-1">Reset your password</h1>
      <p className="text-sm text-neutral-500 mb-7">
        Enter your email and we'll send you a reset link
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              placeholder="you@example.com"
              className={cn('input pl-10', error && 'input-error')}
              autoComplete="email"
            />
          </div>
          {error && <p className="text-xs text-danger mt-1 animate-fade-in">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={cn('btn btn-primary btn-lg btn-full mt-2', loading && 'btn-loading')}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  )
}