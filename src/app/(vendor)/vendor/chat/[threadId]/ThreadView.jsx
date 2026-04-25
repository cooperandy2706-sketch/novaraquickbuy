'use client'
// FILE: src/app/(vendor)/vendor/chat/[threadId]/ThreadView.jsx

import ChatInbox   from '@/components/vendor/chat/ChatInbox'
import ChatWindow  from '@/components/vendor/chat/ChatWindow'

import { MessageSquare } from 'lucide-react'
import ComingSoon from '@/components/vendor/ComingSoon'

export default function ThreadView() {
  return (
    <ComingSoon 
      title="Messaging" 
      desc="Direct messaging with your customers and support team is currently in development."
      icon={MessageSquare}
    />
  )
}