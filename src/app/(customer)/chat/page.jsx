'use client'
// FILE: src/app/(customer)/chat/page.jsx
// In-app chat is temporarily disabled. Users are directed to WhatsApp.

import { MessageCircle, ExternalLink, Phone, ArrowRight } from 'lucide-react'

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '233000000000'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I have a question about an order on Novara QuickBuy.')}`

export default function ChatPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">

      {/* WhatsApp Icon */}
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-xl"
        style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
      >
        {/* WhatsApp SVG */}
        <svg viewBox="0 0 32 32" width="48" height="48" fill="white">
          <path d="M16 2C8.27 2 2 8.27 2 16c0 2.44.65 4.74 1.78 6.73L2 30l7.52-1.74A13.94 13.94 0 0016 30c7.73 0 14-6.27 14-14S23.73 2 16 2zm0 25.5a11.44 11.44 0 01-5.85-1.6l-.42-.25-4.46 1.03 1.06-4.34-.28-.44A11.5 11.5 0 1116 27.5zm6.3-8.6c-.35-.17-2.06-1.01-2.38-1.13-.32-.11-.55-.17-.78.18-.23.35-.9 1.13-1.1 1.36-.2.23-.41.26-.76.09-.35-.17-1.48-.55-2.82-1.74-1.04-.93-1.74-2.07-1.94-2.42-.2-.35-.02-.54.15-.71.16-.16.35-.41.52-.62.17-.21.23-.35.35-.59.11-.23.06-.44-.03-.62-.09-.18-.78-1.88-1.07-2.57-.28-.68-.56-.58-.78-.59-.2-.01-.44-.01-.67-.01-.23 0-.62.09-.94.44-.32.35-1.24 1.21-1.24 2.95s1.27 3.42 1.44 3.65c.18.23 2.5 3.82 6.06 5.36.85.37 1.51.59 2.02.75.85.27 1.62.23 2.23.14.68-.1 2.06-.84 2.35-1.65.29-.81.29-1.5.2-1.65-.09-.14-.32-.23-.67-.4z"/>
        </svg>
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-black text-neutral-900 tracking-tight mb-2">
        Chat on WhatsApp
      </h1>
      <p className="text-sm text-neutral-500 max-w-sm leading-relaxed mb-8">
        We&apos;ve moved our messaging to WhatsApp for faster, more reliable communication.
        Tap below to start a conversation with us directly.
      </p>

      {/* CTA */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        id="whatsapp-chat-btn"
        className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-white text-base font-bold shadow-lg transition-all active:scale-95 hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
      >
        <MessageCircle size={20} />
        Open WhatsApp Chat
        <ArrowRight size={16} />
      </a>

      <p className="mt-4 text-xs text-neutral-400 flex items-center gap-1.5">
        <ExternalLink size={11} />
        Opens in WhatsApp
      </p>

      {/* Info cards */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-sm">
        {[
          { icon: <MessageCircle size={16} />, title: 'Chat with Vendors', desc: 'Contact any vendor directly via WhatsApp' },
          { icon: <Phone size={16} />,         title: 'Order Support',      desc: 'Get help with your orders any time'       },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="bg-white border border-neutral-100 rounded-2xl p-4 text-left shadow-sm">
            <div className="text-green-600 mb-2">{icon}</div>
            <p className="text-sm font-bold text-neutral-800">{title}</p>
            <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}