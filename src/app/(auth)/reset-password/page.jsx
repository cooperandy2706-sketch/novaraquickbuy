// FILE: src/app/(auth)/reset-password/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter }            from 'next/navigation'
import { Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react'
import { resetPassword }        from '@/lib/actions/auth'
import { createClient }         from '@/lib/supabase/client'
import { cn }                   from '@/utils/cn'
import toast                    from 'react-hot-toast'

export default function ResetPasswordPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [errors,    setErrors]    = useState({})
  const [validSession, setValidSession] = useState(false)

  useEffect(() => {
    // Supabase sends the token in the URL hash — exchange it for a session
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true)
      }
    })
  }, [])

  const validate = () => {
    const e = {}
    if (!password)              e.password = 'Password is required'
    if (password.length < 8)    e.password = 'Min 8 characters'
    if (password !== confirm)   e.confirm  = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    const result = await resetPassword({ password })

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/login'), 3000)
  }

  if (done) return (
    <div className="card p-8 text-center animate-scale-in">
      <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 size={32} className="text-brand" />
      </div>
      <h2 className="text-xl font-bold text-brand-800 mb-2">Password updated!</h2>
      <p className="text-neutral-500 text-sm">Redirecting you to sign in...</p>
    </div>
  )

  if (!validSession) return (
    <div className="card p-8 text-center animate-scale-in">
      <p className="text-neutral-500 text-sm">Verifying reset link...</p>
    </div>
  )

  return (
    <div className="card p-8 animate-scale-in">
      <h1 className="text-2xl font-bold text-brand-800 mb-1">Set new password</h1>
      <p className="text-sm text-neutral-500 mb-7">Choose a strong password for your account</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">New password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors(v => ({ ...v, password: '' })) }}
              placeholder="Min 8 characters"
              className={cn('input pl-10 pr-10', errors.password && 'input-error')}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-danger mt-1 animate-fade-in">{errors.password}</p>}
        </div>

        <div>
          <label className="label">Confirm new password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type={showPass ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setErrors(v => ({ ...v, confirm: '' })) }}
              placeholder="Repeat your password"
              className={cn('input pl-10', errors.confirm && 'input-error')}
            />
          </div>
          {errors.confirm && <p className="text-xs text-danger mt-1 animate-fade-in">{errors.confirm}</p>}
        </div>

        {/* Password strength indicator */}
        {password.length > 0 && (
          <div className="space-y-1.5 animate-fade-in">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-all duration-300',
                    password.length >= i * 4
                      ? password.length >= 12 ? 'bg-brand' : password.length >= 8 ? 'bg-gold' : 'bg-danger'
                      : 'bg-neutral-200'
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-neutral-400">
              {password.length < 8 ? 'Too short' : password.length < 12 ? 'Fair' : 'Strong'}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn('btn btn-primary btn-lg btn-full mt-2', loading && 'btn-loading')}
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}