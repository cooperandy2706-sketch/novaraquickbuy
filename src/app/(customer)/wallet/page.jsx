'use client'
// FILE: src/app/(customer)/wallet/page.jsx
// NovaPay Wallet is temporarily unavailable.

import { Phone, MessageCircle, ArrowRight, ShieldCheck } from 'lucide-react'

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '233000000000'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I have a question about payments on Novara QuickBuy.')}`

export default function WalletPage() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-16 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Wallet</h1>
        <div className="flex items-center gap-1.5 mt-1">
          <ShieldCheck size={12} className="text-brand" />
          <p className="text-[11px] text-neutral-400 font-medium">
            Secure payments — coming soon
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 text-center space-y-4">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-lg"
          style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
        >
          <svg viewBox="0 0 32 32" width="40" height="40" fill="white">
            <path d="M16 2C8.27 2 2 8.27 2 16c0 2.44.65 4.74 1.78 6.73L2 30l7.52-1.74A13.94 13.94 0 0016 30c7.73 0 14-6.27 14-14S23.73 2 16 2zm6.3 18.9c-.35-.17-2.06-1.01-2.38-1.13-.32-.11-.55-.17-.78.18-.23.35-.9 1.13-1.1 1.36-.2.23-.41.26-.76.09-.35-.17-1.48-.55-2.82-1.74-1.04-.93-1.74-2.07-1.94-2.42-.2-.35-.02-.54.15-.71.16-.16.35-.41.52-.62.17-.21.23-.35.35-.59.11-.23.06-.44-.03-.62-.09-.18-.78-1.88-1.07-2.57-.28-.68-.56-.58-.78-.59-.2-.01-.44-.01-.67-.01-.23 0-.62.09-.94.44-.32.35-1.24 1.21-1.24 2.95s1.27 3.42 1.44 3.65c.18.23 2.5 3.82 6.06 5.36.85.37 1.51.59 2.02.75.85.27 1.62.23 2.23.14.68-.1 2.06-.84 2.35-1.65.29-.81.29-1.5.2-1.65-.09-.14-.32-.23-.67-.4z"/>
          </svg>
        </div>

        <div>
          <h2 className="text-lg font-black text-neutral-900">In-App Wallet Coming Soon</h2>
          <p className="text-sm text-neutral-500 mt-1 leading-relaxed max-w-xs mx-auto">
            Online payments are not yet available. To pay for an order, contact the vendor
            directly via WhatsApp to arrange MoMo, bank transfer, or cash payment.
          </p>
        </div>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          id="wallet-whatsapp-btn"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-white font-bold text-sm shadow-lg transition-all active:scale-[0.98] hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
        >
          <MessageCircle size={18} />
          Chat on WhatsApp
          <ArrowRight size={15} />
        </a>
      </div>

      {/* Payment methods info */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-5 space-y-3">
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Accepted Payment Methods</p>
        {[
          { label: 'Mobile Money (MoMo)', desc: 'MTN, Vodafone, AirtelTigo' },
          { label: 'Bank Transfer',        desc: 'Direct bank-to-bank transfer' },
          { label: 'Cash on Delivery',     desc: 'Pay when you receive your order' },
        ].map(({ label, desc }) => (
          <div key={label} className="flex items-center gap-3 py-2 border-b border-neutral-100 last:border-0">
            <div className="w-2 h-2 rounded-full bg-brand shrink-0" />
            <div>
              <p className="text-xs font-semibold text-neutral-800">{label}</p>
              <p className="text-[10px] text-neutral-400">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}