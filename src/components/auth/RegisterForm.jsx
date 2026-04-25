// FILE: src/components/auth/RegisterForm.jsx
'use client'

import { useState }     from 'react'
import { useRouter }    from 'next/navigation'
import Link             from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Store } from 'lucide-react'
import { cn }           from '@/utils/cn'
import toast            from 'react-hot-toast'
import { signUp }       from '@/lib/actions/auth'
import OAuthButtons     from './OAuthButtons'

export default function RegisterForm() {
  const router   = useRouter()

  const [step,      setStep]      = useState(1)   // 1 = details, 2 = role
  const [role,      setRole]      = useState('buyer')
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [errors,    setErrors]    = useState({})

  const validate = () => {
    const e = {}
    if (!name)     e.name     = 'Full name is required'
    if (!email)    e.email    = 'Email is required'
    if (!password) e.password = 'Password is required'
    if (password && password.length < 8) e.password = 'Min 8 characters'
    if (email && !/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (step === 1) { if (validate()) setStep(2); return }

    setLoading(true)

    // Use the server action — handles DB inserts + welcome email via Resend
    const result = await signUp({ full_name: name, email, password, role })

    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    toast.success('Account created! Please check your email to verify.')
    router.push('/verify-email')
  }

  return (
    <div className="card p-8 animate-scale-in">
      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2].map(s => (
          <div
            key={s}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              s === step ? 'w-8 bg-brand' : s < step ? 'w-4 bg-brand/40' : 'w-4 bg-border'
            )}
          />
        ))}
      </div>

      {step === 1 ? (
        <>
          <h1 className="text-2xl font-bold text-primary mb-1">Create account</h1>
          <p className="text-sm text-secondary mb-6">Join millions of shoppers on Novara</p>

          {/* ── Social sign-up ── */}
          <OAuthButtons
            redirectTo={`${typeof window !== 'undefined' ? location.origin : ''}/api/auth/callback?next=/feed`}
            label="Sign up"
          />

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted font-medium">or with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors(v => ({...v, name: ''})) }}
                  placeholder="Your full name"
                  className={cn('input pl-10', errors.name && 'input-error')}
                />
              </div>
              {errors.name && <p className="text-xs text-danger mt-1 animate-fade-in">{errors.name}</p>}
            </div>

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
                />
              </div>
              {errors.email && <p className="text-xs text-danger mt-1 animate-fade-in">{errors.email}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors(v => ({...v, password: ''})) }}
                  placeholder="Min 8 characters"
                  className={cn('input pl-10 pr-10', errors.password && 'input-error')}
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

            <button type="submit" className="btn btn-primary btn-lg btn-full mt-2">
              Continue <ArrowRight size={16} />
            </button>
          </form>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-primary mb-1">I am a...</h1>
          <p className="text-sm text-secondary mb-7">Choose your account type</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
            {[
              { value: 'buyer',  label: 'Buyer',  sub: 'Shop & discover', icon: <User size={28} /> },
              { value: 'vendor', label: 'Vendor', sub: 'Sell & grow',      icon: <Store size={28} /> },
            ].map(({ value, label, sub, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={cn(
                  'flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200',
                  role === value
                    ? 'border-brand bg-brand/10 shadow-brand'
                    : 'border-border bg-surface-2 hover:border-brand/40 hover:bg-brand/5'
                )}
              >
                <div className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200',
                  role === value ? 'bg-brand text-white' : 'bg-surface-3 text-muted'
                )}>
                  {icon}
                </div>
                <div>
                  <p className={cn('font-bold text-sm', role === value ? 'text-brand' : 'text-primary')}>{label}</p>
                  <p className="text-xs text-muted">{sub}</p>
                </div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className={cn('btn btn-primary btn-lg btn-full', loading && 'btn-loading')}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn btn-ghost btn-lg btn-full"
            >
              Back
            </button>
          </form>
        </>
      )}

      {step === 1 && (
        <div className="mt-6">
          <p className="text-center text-sm text-secondary">
            Already have an account?{' '}
            <Link href="/login" className="text-brand font-semibold hover:text-brand/80">Sign in</Link>
          </p>
          <p className="text-center text-xs text-muted mt-4 leading-relaxed">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-primary transition-colors">Terms</Link>
            {' '}and{' '}
            <Link href="/conditions" className="underline hover:text-primary transition-colors">Conditions</Link>.
          </p>
        </div>
      )}
    </div>
  )
}