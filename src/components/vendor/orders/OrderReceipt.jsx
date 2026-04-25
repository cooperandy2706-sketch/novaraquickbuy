'use client'
// FILE: src/components/vendor/orders/OrderReceipt.jsx

import { useRef, useState } from 'react'
import {
  Printer, Download, Mail, MessageSquare,
  X, Copy, CheckCircle2,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'

// ── Receipt document (the actual printable content) ───────────────────────────
function ReceiptDocument({ order, vendor, format }) {
  const currency = useLocaleStore(s => s.currency)
  const buyer       = order.buyer
  const items       = order.order_items ?? []
  const payment     = order.payments?.[0]
  const delivery    = order.delivery
  const orderId     = order.id.slice(0, 8).toUpperCase()
  const orderDate   = new Date(order.created_at).toLocaleDateString('en', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const isMinimal   = format === 'minimal'
  const isThermal   = format === 'thermal'

  if (isThermal) {
    // Thermal / POS style — 58mm-ish column, monospace
    return (
      <div className="font-mono text-[11px] leading-relaxed p-4 max-w-[280px] mx-auto text-neutral-900" id="receipt-content">
        <div className="text-center border-b border-dashed border-neutral-300 pb-3 mb-3">
          <p className="font-bold text-base">{vendor?.store_name ?? 'Store'}</p>
          {vendor?.business_address && <p>{vendor.business_address}</p>}
          {vendor?.business_phone   && <p>Tel: {vendor.business_phone}</p>}
        </div>
        <div className="mb-3">
          <p className="font-bold">RECEIPT</p>
          <p>Order: #{orderId}</p>
          <p>Date: {orderDate}</p>
          <p>Customer: {buyer?.full_name ?? 'Customer'}</p>
        </div>
        <div className="border-t border-dashed border-neutral-300 pt-2 mb-2">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between gap-2">
              <span className="flex-1">{item.product?.name?.slice(0, 20)}</span>
              <span>x{item.quantity}</span>
              <span>{formatCurrency(item.total_price ?? 0, currency)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-dashed border-neutral-300 pt-2 space-y-0.5">
          {order.subtotal && <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal, currency)}</span></div>}
          {order.shipping_fee > 0 && <div className="flex justify-between"><span>Shipping</span><span>{formatCurrency(order.shipping_fee, currency)}</span></div>}
          <div className="flex justify-between font-bold border-t border-neutral-300 pt-1 mt-1">
            <span>TOTAL</span><span>{formatCurrency(order.total_amount ?? 0, currency)}</span>
          </div>
        </div>
        {payment && (
          <div className="border-t border-dashed border-neutral-300 pt-2 mt-2">
            <p>Paid via: {payment.payment_method}</p>
            {payment.transaction_ref && <p>Ref: {payment.transaction_ref}</p>}
          </div>
        )}
        <div className="text-center border-t border-dashed border-neutral-300 pt-3 mt-3">
          <p>Thank you for your purchase!</p>
          <p>novara.com/@{vendor?.store_handle ?? 'store'}</p>
        </div>
      </div>
    )
  }

  // Standard / Minimal receipt
  return (
    <div className={cn('p-4 sm:p-8 max-w-2xl mx-auto bg-white text-neutral-900 shadow-sm rounded-xl', isMinimal && 'p-4 sm:p-6')} id="receipt-content">
      {/* Header */}
      <div className={cn('flex items-start justify-between mb-8', isMinimal && 'mb-5')}>
        <div>
          {vendor?.store_logo_url && !isMinimal && (
            <img src={vendor.store_logo_url} alt={vendor.store_name} className="w-12 h-12 rounded-xl object-cover mb-3" />
          )}
          <h1 className={cn('font-bold text-neutral-900', isMinimal ? 'text-lg' : 'text-2xl')}>
            {vendor?.store_name ?? 'Store'}
          </h1>
          {!isMinimal && (
            <div className="text-sm text-neutral-500 mt-1 space-y-0.5">
              {vendor?.business_address && <p>{vendor.business_address}, {vendor?.business_city}</p>}
              {vendor?.business_email   && <p>{vendor.business_email}</p>}
              {vendor?.business_phone   && <p>{vendor.business_phone}</p>}
            </div>
          )}
        </div>
        <div className="text-right">
          <p className={cn('font-bold text-neutral-500 uppercase tracking-widest', isMinimal ? 'text-xs' : 'text-sm')}>Receipt</p>
          <p className={cn('font-bold text-neutral-900 mt-1', isMinimal ? 'text-base' : 'text-xl')}>#{orderId}</p>
          <p className="text-sm text-neutral-500 mt-1">{orderDate}</p>
        </div>
      </div>

      {/* Buyer */}
      {!isMinimal && buyer && (
        <div className="mb-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1">Bill To</p>
          <p className="font-semibold text-neutral-900">{buyer.full_name}</p>
          {buyer.email && <p className="text-sm text-neutral-500">{buyer.email}</p>}
          {buyer.shipping_address && <p className="text-sm text-neutral-500 mt-1">{typeof buyer.shipping_address === 'string' ? buyer.shipping_address : JSON.stringify(buyer.shipping_address)}</p>}
        </div>
      )}

      {/* Items table */}
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-neutral-100">
            <th className="text-left text-xs font-bold text-neutral-500 uppercase tracking-wide pb-2">Item</th>
            <th className="text-center text-xs font-bold text-neutral-500 uppercase tracking-wide pb-2">Qty</th>
            <th className="text-right text-xs font-bold text-neutral-500 uppercase tracking-wide pb-2">Unit</th>
            <th className="text-right text-xs font-bold text-neutral-500 uppercase tracking-wide pb-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b border-neutral-100">
              <td className="py-3">
                <p className="font-medium text-neutral-900 text-sm">{item.product?.name ?? 'Item'}</p>
                {item.product?.sku && !isMinimal && (
                  <p className="text-xs text-neutral-400 mt-0.5">SKU: {item.product.sku}</p>
                )}
              </td>
              <td className="py-3 text-center text-sm text-neutral-700">{item.quantity}</td>
              <td className="py-3 text-right text-sm text-neutral-700">{formatCurrency(item.unit_price ?? 0, currency)}</td>
              <td className="py-3 text-right text-sm font-semibold text-neutral-900">{formatCurrency(item.total_price ?? 0, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-56 space-y-2">
          {order.subtotal && (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(order.subtotal, currency)}</span>
            </div>
          )}
          {order.shipping_fee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Shipping</span>
              <span className="font-medium">{formatCurrency(order.shipping_fee, currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t-2 border-neutral-900 pt-2 mt-2">
            <span>Total</span>
            <span>{formatCurrency(order.total_amount ?? 0, currency)}</span>
          </div>
          {payment && (
            <div className="flex justify-between text-xs text-neutral-500 pt-1">
              <span>Paid via {payment.payment_method}</span>
              {payment.transaction_ref && <span>Ref: {payment.transaction_ref.slice(0, 12)}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Delivery */}
      {delivery?.tracking_number && !isMinimal && (
        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 mb-6 text-sm">
          <span className="font-semibold text-neutral-700">Tracking: </span>
          <span className="font-mono text-neutral-600">{delivery.tracking_number}</span>
          {delivery.courier_name && <span className="text-neutral-500"> via {delivery.courier_name}</span>}
        </div>
      )}

      {/* Footer */}
      {!isMinimal && (
        <div className="border-t border-neutral-200 pt-5 text-center text-xs text-neutral-400">
          <p>Thank you for shopping with {vendor?.store_name}!</p>
          {vendor?.store_handle && <p className="mt-0.5">novara.com/@{vendor.store_handle}</p>}
        </div>
      )}
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────
const FORMATS = [
  { value: 'standard', label: 'Standard',   desc: 'Full receipt with store details and buyer info' },
  { value: 'minimal',  label: 'Minimal',    desc: 'Clean summary — items and total only'           },
  { value: 'thermal',  label: 'Thermal/POS',desc: 'Narrow format for thermal receipt printers'     },
]

export default function OrderReceipt({ order, vendor, onClose }) {
  const currency = useLocaleStore(s => s.currency)
  const [format,  setFormat]  = useState('standard')
  const [copied,  setCopied]  = useState(false)
  const printRef = useRef(null)

  const handlePrint = () => {
    const content = document.getElementById('receipt-content')
    if (!content) return
    const win = window.open('', '_blank')
    win.document.write(`
      <html>
        <head>
          <title>Receipt #${order.id.slice(0,8).toUpperCase()}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: ${format === 'thermal' ? 'monospace' : 'system-ui, sans-serif'}; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 6px 0; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/vendor/orders/${order.id}?receipt=1`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEmailReceipt = () => {
    const subject = encodeURIComponent(`Receipt #${order.id.slice(0,8).toUpperCase()} — ${vendor?.store_name}`)
    const body    = encodeURIComponent(
      `Hi ${order.buyer?.full_name ?? 'Customer'},\n\nThank you for your order.\n\nOrder #${order.id.slice(0,8).toUpperCase()}\nTotal: ${formatCurrency(order.total_amount ?? 0, currency)}\n\nView your receipt at: ${window.location.origin}/vendor/orders/${order.id}?receipt=1`
    )
    window.open(`mailto:${order.buyer?.email ?? ''}?subject=${subject}&body=${body}`)
  }

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hi ${order.buyer?.full_name ?? 'there'}! Here's your receipt for Order #${order.id.slice(0,8).toUpperCase()} — ${formatCurrency(order.total_amount ?? 0, currency)}. View: ${window.location.origin}/vendor/orders/${order.id}?receipt=1`
    )
    window.open(`https://wa.me/?text=${msg}`)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-surface-2 w-full sm:max-w-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col rounded-t-[32px] sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95 duration-300">
        
        {/* Mobile Pull Indicator */}
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto sm:hidden mt-3 mb-1 shrink-0" />

        {/* Modal header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between sm:justify-start">
            <div>
              <h2 className="font-bold text-primary">Receipt</h2>
              <p className="text-xs text-muted mt-0.5">Order #{order.id.slice(0,8).toUpperCase()}</p>
            </div>
            <button onClick={onClose} className="sm:hidden w-8 h-8 rounded-xl flex items-center justify-center bg-surface-3 text-secondary hover:text-primary transition-all">
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0 -mx-6 px-6 sm:mx-0 sm:px-0 w-full sm:w-auto">
            {/* Format picker */}
            <div className="flex items-center bg-surface-3 rounded-xl p-1 gap-0.5 min-w-max">
              {FORMATS.map(f => (
                <button key={f.value} onClick={() => setFormat(f.value)}
                  title={f.desc}
                  className={cn(
                    'px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all',
                    format === f.value ? 'bg-surface-2 shadow-sm text-brand' : 'text-muted hover:text-primary',
                  )}>
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="hidden sm:flex shrink-0 w-8 h-8 rounded-xl items-center justify-center text-muted hover:text-primary hover:bg-surface-3 transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Receipt preview */}
        <div className="flex-1 overflow-auto border-b border-border bg-surface-1 py-6 sm:py-10 px-4 sm:px-12 overscroll-contain">
          <div className="rounded-xl overflow-hidden">
            <ReceiptDocument order={order} vendor={vendor} format={format} />
          </div>
        </div>

        {/* Actions (Sticky Bottom) */}
        <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-2 shrink-0 pb-safe">
          <button onClick={handlePrint}
            className="flex flex-col items-center gap-2 px-3 py-3.5 rounded-xl border-2 border-brand bg-brand-50 text-brand hover:bg-brand text-brand hover:text-white transition-all group">
            <Printer size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Print</span>
          </button>
          <button onClick={handleEmailReceipt}
            className="flex flex-col items-center gap-2 px-3 py-3.5 rounded-xl border border-border text-secondary hover:border-brand hover:text-brand hover:bg-brand/10 transition-all group">
            <Mail size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Email</span>
          </button>
          <button onClick={handleWhatsApp}
            className="flex flex-col items-center gap-2 px-3 py-3.5 rounded-xl border border-border text-secondary hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all group">
            <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">WhatsApp</span>
          </button>
          <button onClick={handleCopyLink}
            className="flex flex-col items-center gap-2 px-3 py-3.5 rounded-xl border border-border text-secondary hover:border-primary hover:text-primary hover:bg-surface-3 transition-all group">
            {copied
              ? <CheckCircle2 size={20} className="text-emerald-500" />
              : <Copy size={20} className="group-hover:scale-110 transition-transform" />
            }
            <span className="text-xs font-semibold">{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}