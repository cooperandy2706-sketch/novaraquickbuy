'use client'

import Link from 'next/link'
import { ShieldAlert, ShieldCheck, Clock, ArrowRight, X } from 'lucide-react'
import { useState } from 'react'
import { cn }       from '@/utils/cn'

export default function VerificationBanner({ vendor }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const status = vendor?.verification_status
  const verified = vendor?.verified

  if (verified) return null

  const configs = {
    pending: {
      bg:    'bg-amber-500/10 border-amber-500/20',
      icon:  Clock,
      iconBg:'bg-amber-500/20 text-amber-500',
      title: 'Verification under review',
      desc:  'Our team is reviewing your documents. This usually takes 24–48 hours.',
      cta:   null,
    },
    rejected: {
      bg:    'bg-danger/5 border-danger/20',
      icon:  ShieldAlert,
      iconBg:'bg-danger/10 text-danger',
      title: 'Verification rejected',
      desc:  'Your documents could not be verified. Please resubmit with clearer photos.',
      cta:   { label: 'Resubmit documents', href: '/vendor/onboarding?step=5' },
    },
    unverified: {
      bg:    'bg-blue-500/10 border-blue-500/20',
      icon:  ShieldAlert,
      iconBg:'bg-blue-500/20 text-blue-500',
      title: 'Complete identity verification',
      desc:  'Verify your identity to unlock the Trusted Seller badge, higher payouts, and better search ranking.',
      cta:   { label: 'Verify now', href: '/vendor/onboarding?step=5' },
    },
  }

  const cfg = configs[status] ?? configs.unverified
  const Icon = cfg.icon

  return (
    <div className={cn('rounded-[2rem] border p-5 sm:p-6 flex items-start gap-5 shadow-sm transition-all duration-300', cfg.bg)}>
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm', cfg.iconBg)}>
        <Icon size={22} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-black text-neutral-900 uppercase tracking-widest">{cfg.title}</h4>
        <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed font-medium">{cfg.desc}</p>
        {cfg.cta && (
          <Link
            href={cfg.cta.href}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-white/50 hover:bg-white text-xs font-black text-brand border border-brand/20 transition-all active:scale-[0.98]"
          >
            {cfg.cta.label} <ArrowRight size={14} strokeWidth={3} />
          </Link>
        )}
      </div>
      {status !== 'pending' && (
        <button
          onClick={() => setDismissed(true)}
          className="text-neutral-400 hover:text-neutral-900 transition-colors shrink-0 mt-1"
          aria-label="Dismiss"
        >
          <X size={18} strokeWidth={3} />
        </button>
      )}
    </div>
  )
}