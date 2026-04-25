// FILE: src/components/auth/LoginForm.jsx
'use client'

import { useState }       from 'react'
import { useRouter }      from 'next/navigation'
import Link               from 'next/link'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { createClient }   from '@/lib/supabase/client'
import { cn }             from '@/utils/cn'
import toast              from 'react-hot-toast'
import OAuthButtons       from './OAuthButtons'

export default function LoginForm() {
  const router   = useRouter()
  const supabase = createClient()

  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [errors,    setErrors]    = useState({})

  const validate = () => {
    const e = {}
    if (!email)    e.email    = 'Email is required'
    if (!password) e.password = 'Password is required'
    if (email && !/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
      setErrors({ form: error.message })
      setLoading(false)
      return
    }

    toast.success('Welcome back!')
    router.push('/feed')
    router.refresh()
  }

  return (
    <div className="card p-8 animate-scale-in">
      <h1 className="text-2xl font-bold text-primary mb-1">Welcome back</h1>
      <p className="text-sm text-secondary mb-6">Sign in to your Novara account</p>

      {/* ── Social sign-in ── */}
      <OAuthButtons
        redirectTo={`${typeof window !== 'undefined' ? location.origin : ''}/api/auth/callback?next=/feed`}
        label="Continue"
      />

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted font-medium">or with email</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="label">Email address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors(v => ({...v, email: ''})) }}
              placeholder="you@example.com"
              className={cn('input pl-10', errors.email && 'input-error')}
              autoComplete="email"
            />
          </div>
          {errors.email && <p className="text-xs text-danger mt-1 animate-fade-in">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">Password</label>
            <Link href="/forgot-password" title="Forgot Password" className="text-xs text-brand hover:text-brand/80 font-medium">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors(v => ({...v, password: ''})) }}
              placeholder="••••••••"
              className={cn('input pl-10 pr-10', errors.password && 'input-error')}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-danger mt-1 animate-fade-in">{errors.password}</p>}
        </div>

        {errors.form && (
          <div className="bg-danger-light border border-danger/20 rounded-lg px-4 py-3 text-sm text-danger-text animate-fade-in">
            {errors.form}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'btn btn-primary btn-lg btn-full mt-2',
            loading && 'btn-loading'
          )}
        >
          {loading ? 'Signing in...' : (
            <>Sign In <ArrowRight size={16} /></>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-secondary mt-6">
        Don't have an account?{' '}
        <Link href="/register" className="text-brand font-semibold hover:text-brand/80">
          Create one free
        </Link>
      </p>
      <p className="text-center text-xs text-muted mt-4 leading-relaxed">
        By signing in, you agree to our{' '}
        <Link href="/terms" className="underline hover:text-primary transition-colors">Terms</Link>
        {' '}and{' '}
        <Link href="/conditions" className="underline hover:text-primary transition-colors">Conditions</Link>.
      </p>
    </div>
  )
}