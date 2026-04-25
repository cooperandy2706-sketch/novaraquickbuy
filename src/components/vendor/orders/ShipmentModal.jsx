'use client'
// FILE: src/components/vendor/orders/ShipmentModal.jsx

import { useState }   from 'react'
import { Truck, X, Loader2, Package } from 'lucide-react'
import { markShipped } from '@/lib/actions/orders'
import { cn }          from '@/utils/cn'

const COURIERS = [
  'DHL', 'FedEx', 'UPS', 'USPS', 'Royal Mail', 'GIG Logistics',
  'Aramex', 'TNT', 'J&T Express', 'Lalamove', 'Other',
]

export default function ShipmentModal({ orderId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    tracking_number:     '',
    courier_name:        '',
    estimated_delivery:  '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.tracking_number.trim()) { setError('Tracking number is required'); return }
    if (!form.courier_name.trim())    { setError('Courier name is required');    return }
    setLoading(true)
    const res = await markShipped(orderId, form)
    setLoading(false)
    if (res?.error) { setError(res.error); return }
    onSuccess?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-2 rounded-2xl shadow-2xl w-full max-w-md">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <Truck size={17} className="text-sky-600" />
            </div>
            <div>
              <h2 className="font-bold text-primary text-sm">Mark as Shipped</h2>
              <p className="text-xs text-muted mt-0.5">Add tracking details for the buyer</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-xl flex items-center justify-center text-muted hover:text-primary hover:bg-surface-3 transition-all">
            <X size={15} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Courier */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-primary">Courier / Shipping Service *</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COURIERS.map(c => (
                <button key={c} type="button" onClick={() => set('courier_name', c)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all',
                    form.courier_name === c
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border text-secondary hover:border-brand/40',
                  )}>
                  {c}
                </button>
              ))}
            </div>
            {form.courier_name === 'Other' && (
              <input
                type="text"
                placeholder="Enter courier name"
                onChange={e => set('courier_name', e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-3 px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all text-primary"
              />
            )}
          </div>

          {/* Tracking number */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-primary">Tracking Number *</label>
            <input
              type="text"
              placeholder="e.g. 1Z999AA10123456784"
              value={form.tracking_number}
              onChange={e => set('tracking_number', e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-3 px-4 py-3 text-sm font-mono placeholder:text-muted placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all text-primary"
            />
          </div>

          {/* Estimated delivery */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-primary">Estimated Delivery Date</label>
            <input
              type="date"
              value={form.estimated_delivery}
              min={new Date().toISOString().slice(0, 10)}
              onChange={e => set('estimated_delivery', e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-3 px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all color-scheme-dark"
            />
          </div>

          {error && (
            <div className="bg-danger/5 border border-danger/20 rounded-xl px-4 py-3 text-xs text-danger font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-border text-sm font-bold text-secondary hover:bg-surface-3 transition-all">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-sm active:scale-[0.98]">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <><Truck size={15} /> Confirm Shipment</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}