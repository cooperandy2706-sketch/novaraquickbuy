'use client'
// FILE: src/components/vendor/orders/EscrowPanel.jsx

import { useState, useEffect } from 'react'
import { Shield, Clock, CheckCircle2, AlertCircle, ArrowRight, Loader2, Info } from 'lucide-react'
import { requestEscrowRelease } from '@/lib/actions/orders'
import { cn }                   from '@/utils/cn'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'

function Countdown({ endsAt }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endsAt) - Date.now()
      if (diff <= 0) { setTimeLeft('Releasing now…'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h}h ${m}m ${s}s`)
    }
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [endsAt])

  return <span className="font-mono font-bold tabular-nums">{timeLeft}</span>
}

export default function EscrowPanel({ order, onUpdate }) {
  const currency = useLocaleStore(s => s.currency)
  const [showRequest, setShowRequest] = useState(false)
  const [reason,      setReason]      = useState('')
  const [loading,     setLoading]     = useState(false)
  const [done,        setDone]        = useState(false)

  const escrowStatus  = order.escrow_status ?? 'held'
  const releasedAt    = order.escrow_released_at
  const disputeEnds   = order.dispute_window_ends
  const reqSent       = order.escrow_release_requested
  const amount        = order.total_amount ?? 0

  const isReleased    = escrowStatus === 'released' || !!releasedAt
  const isDisputed    = order.status === 'disputed'
  const isDelivered   = ['delivered', 'completed'].includes(order.status)
  const windowActive  = disputeEnds && new Date(disputeEnds) > Date.now()

  const handleRequest = async () => {
    if (!reason.trim()) return
    setLoading(true)
    await requestEscrowRelease(order.id, reason)
    setLoading(false)
    setDone(true)
    setShowRequest(false)
    onUpdate?.()
  }

  return (
    <div className={cn(
      'rounded-2xl border shadow-sm overflow-hidden',
      isReleased  ? 'border-emerald-500/20 bg-emerald-500/5' :
      isDisputed  ? 'border-red-500/20 bg-red-500/5'      :
      isDelivered ? 'border-amber-500/20 bg-amber-500/5'      :
                    'border-border bg-surface-2',
    )}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-inherit">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            isReleased ? 'bg-emerald-500/10 text-emerald-600' :
            isDisputed ? 'bg-red-500/10 text-red-600'         :
                         'bg-amber-500/10 text-amber-600',
          )}>
            {isReleased ? <CheckCircle2 size={18} /> : <Shield size={18} />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-primary">Escrow Protection</p>
            <p className={cn(
              'text-xs font-semibold mt-0.5',
              isReleased ? 'text-emerald-600' : isDisputed ? 'text-red-600' : 'text-amber-600',
            )}>
              {isReleased  ? `Funds released ${releasedAt ? new Date(releasedAt).toLocaleDateString() : ''}` :
               isDisputed  ? 'Funds on hold — dispute open' :
               isDelivered ? 'Awaiting 48-hour dispute window' :
                             'Funds secured — awaiting delivery'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-primary tabular-nums">{formatCurrency(amount, currency)}</p>
            <p className="text-[10px] text-muted">Total escrow</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">

        {/* Escrow flow steps */}
        <div className="grid grid-cols-4 gap-1">
          {[
            { label: 'Payment Secured',  done: true                 },
            { label: 'Order Delivered',  done: isDelivered          },
            { label: 'Dispute Window',   done: isDelivered && !windowActive },
            { label: 'Funds Released',   done: isReleased           },
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 text-center">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                step.done ? 'bg-emerald-500 text-white' : 'bg-surface-3 text-muted',
              )}>
                {step.done ? '✓' : i + 1}
              </div>
              <p className="text-[9px] font-medium leading-tight text-muted">{step.label}</p>
            </div>
          ))}
        </div>

        {/* Countdown */}
        {isDelivered && windowActive && !isReleased && !isDisputed && (
          <div className="flex items-center gap-3 bg-surface-3 border border-amber-500/20 rounded-xl px-4 py-3">
            <Clock size={15} className="text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-bold text-amber-600">Dispute window closes in</p>
              <p className="text-[11px] text-amber-600/80 mt-0.5">
                Buyer can raise an issue until: {new Date(disputeEnds).toLocaleString()}
              </p>
            </div>
            <Countdown endsAt={disputeEnds} />
          </div>
        )}

        {/* Released */}
        {isReleased && (
          <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <p className="text-xs font-semibold text-emerald-600">
              Your payment has been released to your payout account.
            </p>
          </div>
        )}

        {/* Dispute */}
        {isDisputed && (
          <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-600">Dispute open — funds on hold</p>
              <p className="text-xs text-red-600/80 mt-0.5">
                Our team is reviewing this dispute. You'll be notified once resolved.
              </p>
            </div>
          </div>
        )}

        {/* Request early release */}
        {isDelivered && !isReleased && !isDisputed && (
          <>
            {done || reqSent ? (
               <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
                 <Info size={13} className="shrink-0" />
                 Early release request sent — our team will review it.
               </div>
            ) : showRequest ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-primary">Why do you need early release?</p>
                <textarea
                  rows={3}
                  placeholder="Explain your reason — e.g. buyer confirmed receipt verbally, or you have proof of delivery."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-3 px-4 py-3 text-xs text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none transition-all"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowRequest(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-secondary hover:bg-surface-3 transition-all">
                    Cancel
                  </button>
                  <button onClick={handleRequest} disabled={!reason.trim() || loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-700 disabled:opacity-50 transition-all shadow-brand">
                    {loading ? <Loader2 size={13} className="animate-spin" /> : <>Send Request <ArrowRight size={13} /></>}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowRequest(true)}
                className="w-full text-xs font-semibold text-brand hover:text-brand-700 underline underline-offset-2 transition-colors text-left"
              >
                Request early release →
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}