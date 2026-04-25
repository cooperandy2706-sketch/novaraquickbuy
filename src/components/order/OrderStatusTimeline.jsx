'use client'
// FILE: src/components/order/OrderStatusTimeline.jsx
// Vertical live timeline.
// Shows both the escrow pipeline (top) and the per-event log (below).
// Designed to be dropped inside an expanded OrderCard or a detail page.

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/utils/cn'
import {
  ShieldCheck, BadgeCheck, Truck, CheckCircle2,
  CreditCard, Clock, ChevronDown, Timer,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// ESCROW PIPELINE
// ─────────────────────────────────────────────────────────────

const ESCROW_STEPS = [
  { key: 'payment_secured', label: 'Secured',   icon: ShieldCheck  },
  { key: 'vendor_accepted', label: 'Accepted',  icon: BadgeCheck   },
  { key: 'in_transit',      label: 'Transit',   icon: Truck        },
  { key: 'delivered',       label: 'Delivered', icon: CheckCircle2 },
  { key: 'released',        label: 'Released',  icon: CreditCard   },
]

function EscrowPipeline({ stage, disputeWindowEnds }) {
  const activeIdx  = ESCROW_STEPS.findIndex(s => s.key === stage)
  const [remaining, setRemaining] = useState(null)

  // Countdown timer for the 48h dispute window
  useEffect(() => {
    if (!disputeWindowEnds) return
    const tick = () => {
      const ms = new Date(disputeWindowEnds) - Date.now()
      if (ms <= 0) { setRemaining(null); return }
      const h = Math.floor(ms / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      setRemaining(`${h}h ${m}m`)
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [disputeWindowEnds])

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #052E16 0%, #14532D 55%, #166534 100%)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
            <ShieldCheck size={13} className="text-green-300" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-white leading-none">Escrow Protection</p>
            <p className="text-[9px] text-green-400 mt-0.5">Payment held until you confirm</p>
          </div>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
          ACTIVE
        </span>
      </div>

      {/* Step track */}
      <div className="px-4 pb-4">
        <div className="flex items-start">
          {ESCROW_STEPS.map((step, i) => {
            const done   = i < activeIdx
            const active = i === activeIdx
            const StepIcon = step.icon
            return (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center transition-all',
                    done   && 'bg-green-400',
                    active && 'bg-white ring-4 ring-white/20',
                    !done && !active && 'bg-white/10',
                  )}>
                    {done
                      ? <span className="text-white font-black" style={{ fontSize: 9 }}>✓</span>
                      : <StepIcon size={12} className={active ? 'text-green-800' : 'text-white/30'} />
                    }
                  </div>
                  <span className={cn(
                    'text-[8px] font-semibold text-center leading-tight',
                    done   && 'text-green-400',
                    active && 'text-white',
                    !done && !active && 'text-white/30',
                  )}>
                    {step.label}
                  </span>
                </div>
                {i < ESCROW_STEPS.length - 1 && (
                  <div className={cn(
                    'h-px flex-1 mb-5 mx-0.5 rounded-full',
                    done ? 'bg-green-400' : 'bg-white/10',
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Dispute window */}
      {stage === 'delivered' && remaining && (
        <div className="mx-4 mb-4 bg-amber-500/20 border border-amber-400/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Timer size={12} className="text-amber-300" />
            <span className="text-[11px] font-bold text-amber-300">Dispute Window</span>
            <span className="ml-auto text-[11px] font-black text-amber-200">{remaining}</span>
          </div>
          <p className="text-[10px] text-amber-400">
            Funds release automatically when this timer ends. Raise a dispute if there's an issue.
          </p>
        </div>
      )}

      {/* Released */}
      {stage === 'released' && (
        <div className="mx-4 mb-4 bg-green-500/10 border border-green-400/20 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle2 size={13} className="text-green-400 shrink-0" />
          <p className="text-[10px] text-green-300">
            Vendor has been paid. Transaction complete.
          </p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// EVENT LOG
// ─────────────────────────────────────────────────────────────

function timeAgo(iso) {
  if (!iso) return ''
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60)    return 'just now'
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function EventLog({ timeline }) {
  const [open, setOpen] = useState(false)
  const visible = open ? timeline : timeline.slice(-3)
  const extra   = timeline.length - 3

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
          Order Timeline
        </p>
        {extra > 0 && (
          <button
            onClick={() => setOpen(p => !p)}
            className="flex items-center gap-1 text-[10px] font-semibold text-brand hover:text-brand-700 transition-colors"
          >
            {open ? 'Show less' : `+${extra} earlier`}
            <ChevronDown size={11} className={cn('transition-transform', open && 'rotate-180')} />
          </button>
        )}
      </div>

      {/* Events */}
      <div className="relative">
        <div className="absolute left-[10px] top-0 bottom-0 w-px bg-neutral-100" />
        <div className="space-y-3">
          {visible.map((item, i) => (
            <div key={i} className="flex items-start gap-3 relative">
              {/* Dot */}
              <div className={cn(
                'w-5 h-5 rounded-full shrink-0 z-10 flex items-center justify-center mt-0.5',
                item.done
                  ? 'bg-brand'
                  : 'bg-white border-2 border-dashed border-neutral-300',
              )}>
                {item.done && (
                  <span className="text-white font-black" style={{ fontSize: 7 }}>✓</span>
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 pb-1">
                <p className={cn(
                  'text-xs font-medium leading-snug',
                  item.done ? 'text-neutral-800' : 'text-neutral-400',
                )}>
                  {item.event}
                </p>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  {item.at ? timeAgo(item.at) : 'Pending'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────

/**
 * OrderStatusTimeline
 *
 * Props:
 *   escrowStage        string  — current escrow pipeline key
 *   disputeWindowEnds  string  — ISO date; shows countdown when delivered
 *   timeline           array   — [{ event, at, done }]
 *   showEscrow         bool    — default true; hide if only event log needed
 */
export default function OrderStatusTimeline({
  escrowStage       = 'payment_secured',
  disputeWindowEnds = null,
  timeline          = [],
  showEscrow        = true,
}) {
  return (
    <div className="space-y-4">
      {showEscrow && (
        <EscrowPipeline
          stage={escrowStage}
          disputeWindowEnds={disputeWindowEnds}
        />
      )}
      {timeline.length > 0 && (
        <EventLog timeline={timeline} />
      )}
    </div>
  )
}