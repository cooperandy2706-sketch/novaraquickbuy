// FILE: src/app/(auth)/verify-email/page.jsx
import Link from 'next/link'
import { Mail } from 'lucide-react'

export const metadata = {
  title: 'Verify your email – Novara QuickBuy',
  description: 'Check your inbox and click the confirmation link to activate your account.',
}

export default function VerifyEmailPage() {
  return (
    <div className="card p-8 animate-scale-in text-center">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-6">
        <Mail size={36} className="text-brand" />
      </div>

      <h1 className="text-2xl font-bold text-primary mb-2">Check your inbox</h1>
      <p className="text-secondary text-sm mb-6 leading-relaxed">
        We've sent a confirmation link to your email address.
        <br />
        Click the link to activate your account and start shopping.
      </p>

      {/* Visual instruction steps */}
      <div className="bg-surface-2 rounded-xl p-4 mb-6 text-left space-y-3">
        {[
          { step: '1', text: 'Open your email app' },
          { step: '2', text: 'Find the email from Novara QuickBuy' },
          { step: '3', text: 'Click "Confirm my email"' },
        ].map(({ step, text }) => (
          <div key={step} className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-brand/20 text-brand text-sm font-bold flex items-center justify-center shrink-0">
              {step}
            </span>
            <span className="text-sm text-secondary">{text}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted mb-4">
        Didn't receive it? Check your spam folder or{' '}
        <Link href="/register" className="text-brand hover:underline font-medium">
          try again
        </Link>
        .
      </p>

      <Link href="/login" className="btn btn-ghost btn-full text-sm">
        Back to sign in
      </Link>
    </div>
  )
}
