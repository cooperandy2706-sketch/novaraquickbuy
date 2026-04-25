'use client'
// FILE: src/components/vendor/orders/ComplaintPanel.jsx

import { useState } from 'react'
import { AlertCircle, ChevronDown, ChevronUp, Loader2, Send, CheckCircle2 } from 'lucide-react'
import { fileComplaint } from '@/lib/actions/orders'
import { cn }            from '@/utils/cn'

const COMPLAINT_TYPES = [
  { value: 'false_dispute',        label: 'False Dispute by Buyer',       desc: 'Buyer opened a dispute dishonestly after receiving goods' },
  { value: 'non_payment',          label: 'Payment Issue',                desc: 'Payment not received or reversed after delivery'         },
  { value: 'buyer_non_cooperation',label: 'Buyer Non-Cooperation',        desc: 'Buyer not responding or refusing to confirm receipt'     },
  { value: 'delivery_issue',       label: 'Delivery Problem',             desc: 'Issue with courier, address, or delivery confirmation'   },
  { value: 'item_returned_damaged',label: 'Item Returned Damaged',        desc: 'Buyer returned item in different condition'             },
  { value: 'other',                label: 'Other Issue',                  desc: 'Something else not listed above'                        },
]

export default function ComplaintPanel({ order, onUpdate }) {
  const [expanded,  setExpanded]  = useState(false)
  const [type,      setType]      = useState('')
  const [message,   setMessage]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error,     setError]     = useState(null)

  const existingComplaints = order.complaints ?? []
  const hasOpenComplaint   = existingComplaints.some(c => c.status === 'open' && c.filed_by === 'vendor')

  const handleSubmit = async () => {
    if (!type || !message.trim()) {
      setError('Please select a complaint type and describe the issue.')
      return
    }
    setLoading(true)
    setError(null)
    const res = await fileComplaint(order.id, { type, message })
    setLoading(false)
    if (res?.error) { setError(res.error); return }
    setSubmitted(true)
    onUpdate?.()
  }

  return (
    <div className="rounded-2xl border border-border bg-surface-2 shadow-sm overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-3 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
            <AlertCircle size={16} className="text-red-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-primary">File a Complaint</p>
            <p className="text-xs text-muted mt-0.5">
              {existingComplaints.length > 0
                ? `${existingComplaints.length} complaint${existingComplaints.length !== 1 ? 's' : ''} on this order`
                : 'Report an issue with this order to Novara support'}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
      </button>

      {expanded && (
        <div className="border-t border-border/50 p-5 space-y-5">

          {/* Existing complaints */}
          {existingComplaints.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted uppercase tracking-wide">Previous Complaints</p>
              {existingComplaints.map(c => (
                <div key={c.id} className={cn(
                  'rounded-xl border px-4 py-3 space-y-1',
                  c.status === 'open'     && 'bg-amber-500/10 border-amber-500/20',
                  c.status === 'resolved' && 'bg-emerald-500/10 border-emerald-500/20',
                  c.status === 'rejected' && 'bg-red-500/10 border-red-500/20',
                )}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-primary capitalize">
                      {COMPLAINT_TYPES.find(t => t.value === c.type)?.label ?? c.type}
                    </p>
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full capitalize',
                      c.status === 'open'     && 'bg-amber-500/20 text-amber-600',
                      c.status === 'resolved' && 'bg-emerald-500/20 text-emerald-600',
                      c.status === 'rejected' && 'bg-red-500/20 text-red-600',
                    )}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-secondary">{c.message}</p>
                  {c.resolution && (
                    <p className="text-xs text-emerald-600 font-bold mt-1">
                      Resolution: {c.resolution}
                    </p>
                  )}
                  <p className="text-[10px] text-muted">
                    Filed {new Date(c.created_at).toLocaleDateString()}
                    {c.filed_by === 'buyer' && ' · Filed by buyer'}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* New complaint form */}
          {hasOpenComplaint ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <AlertCircle size={14} className="text-amber-600 shrink-0" />
              <p className="text-xs font-semibold text-amber-600">
                You already have an open complaint on this order. Our team is reviewing it.
              </p>
            </div>
          ) : submitted ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <p className="text-xs font-semibold text-emerald-600">
                Complaint submitted. Our support team will review within 24 hours.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-bold text-muted uppercase tracking-wide">New Complaint</p>

              {/* Type selection */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-primary">Issue Type *</label>
                <div className="space-y-2">
                  {COMPLAINT_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={cn(
                        'w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all',
                        type === t.value
                          ? 'border-red-500 bg-red-500/5 ring-2 ring-red-500/20'
                          : 'border-border hover:border-red-500/40 hover:bg-red-500/5',
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center',
                        type === t.value ? 'border-red-500 bg-red-500' : 'border-neutral-300',
                      )}>
                        {type === t.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className={cn('text-sm font-semibold', type === t.value ? 'text-red-800' : 'text-primary')}>
                          {t.label}
                        </p>
                        <p className="text-xs text-muted mt-0.5">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-primary">Describe the Issue *</label>
                <p className="text-xs text-muted">Be specific — include dates, amounts, and what you need resolved.</p>
                <textarea
                  rows={4}
                  placeholder="e.g. I delivered the order on March 15 with OTP confirmation, but the buyer filed a false dispute claiming non-delivery. I have photo evidence of delivery."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-3 px-4 py-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none transition-all"
                />
                <div className="flex justify-end">
                  <span className={cn('text-[10px]', message.length > 800 ? 'text-amber-500' : 'text-neutral-400')}>
                    {message.length}/1000
                  </span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-danger/5 border border-danger/20 rounded-xl px-4 py-3">
                  <AlertCircle size={13} className="text-danger shrink-0" />
                  <p className="text-xs text-danger font-medium">{error}</p>
                </div>
              )}

              <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <AlertCircle size={13} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Filing a complaint flags this order for Novara support review. Funds remain in escrow until resolved. Response time is typically within 24 hours.
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!type || !message.trim() || loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm transition-all active:scale-[0.98]"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <><Send size={14} /> Submit Complaint</>}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}