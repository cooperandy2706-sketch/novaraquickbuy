'use client'
// FILE: src/app/(vendor)/payouts/page.jsx
// Payouts are temporarily handled manually — vendors should contact Novara support.

import { Phone, MessageCircle, ArrowRight, Info } from 'lucide-react'

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '233000000000'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I\'d like to discuss my vendor earnings and payout for my Novara store.')}`

export default function VendorPayoutsPage() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-16 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
          Earnings &amp; Payouts
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Contact Novara to arrange your earnings payout
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 text-center space-y-4">
        {/* WhatsApp Icon */}
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-lg"
          style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
        >
          <svg viewBox="0 0 32 32" width="40" height="40" fill="white">
            <path d="M16 2C8.27 2 2 8.27 2 16c0 2.44.65 4.74 1.78 6.73L2 30l7.52-1.74A13.94 13.94 0 0016 30c7.73 0 14-6.27 14-14S23.73 2 16 2zm6.3 18.9c-.35-.17-2.06-1.01-2.38-1.13-.32-.11-.55-.17-.78.18-.23.35-.9 1.13-1.1 1.36-.2.23-.41.26-.76.09-.35-.17-1.48-.55-2.82-1.74-1.04-.93-1.74-2.07-1.94-2.42-.2-.35-.02-.54.15-.71.16-.16.35-.41.52-.62.17-.21.23-.35.35-.59.11-.23.06-.44-.03-.62-.09-.18-.78-1.88-1.07-2.57-.28-.68-.56-.58-.78-.59-.2-.01-.44-.01-.67-.01-.23 0-.62.09-.94.44-.32.35-1.24 1.21-1.24 2.95s1.27 3.42 1.44 3.65c.18.23 2.5 3.82 6.06 5.36.85.37 1.51.59 2.02.75.85.27 1.62.23 2.23.14.68-.1 2.06-.84 2.35-1.65.29-.81.29-1.5.2-1.65-.09-.14-.32-.23-.67-.4z"/>
          </svg>
        </div>

        <div>
          <h2 className="text-lg font-black text-neutral-900">Request a Payout</h2>
          <p className="text-sm text-neutral-500 mt-1 leading-relaxed max-w-xs mx-auto">
            Online payouts are coming soon. For now, contact Novara support via WhatsApp to arrange your earnings transfer.
          </p>
        </div>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          id="vendor-payout-whatsapp-btn"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-white font-bold text-sm shadow-lg transition-all active:scale-[0.98] hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
        >
          <MessageCircle size={18} />
          Contact Support on WhatsApp
          <ArrowRight size={15} />
        </a>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl p-4">
        <Info size={14} className="text-neutral-400 shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-neutral-600">Payout Process</p>
          <ul className="text-[10px] text-neutral-500 leading-relaxed space-y-1">
            <li>• Contact Novara support with your store name and bank/MoMo details</li>
            <li>• Our team will verify your earnings and process the transfer</li>
            <li>• Payouts are processed within 1–3 business days</li>
            <li>• Platform fee: 1.5% deducted from each transaction</li>
            <li>• Automated payout dashboard coming soon</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
