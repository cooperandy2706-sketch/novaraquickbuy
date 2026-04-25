'use client'
// FILE: src/app/(vendor)/vendor/chat/page.jsx
// In-app chat temporarily disabled — vendors communicate via WhatsApp.

import { MessageCircle, ExternalLink, ArrowRight, Users } from 'lucide-react'

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '233000000000'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I have a question about my Novara vendor account.')}`

import { MessageSquare } from 'lucide-react'
import ComingSoon from '@/components/vendor/ComingSoon'

export default function VendorChatPage() {
  return (
    <ComingSoon 
      title="Messaging" 
      desc="Direct messaging with your customers and support team is currently in development."
      icon={MessageSquare}
    />
  )
}