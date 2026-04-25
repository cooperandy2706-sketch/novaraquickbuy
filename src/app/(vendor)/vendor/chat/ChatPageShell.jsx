'use client'
// FILE: src/app/(vendor)/vendor/chat/ChatPageShell.jsx

import ChatInbox         from '@/components/vendor/chat/ChatInbox'
import { MessageSquare } from 'lucide-react'

export default function ChatPageShell({ threads }) {
  return (
    <div className="flex h-[calc(100dvh-var(--header-h,3.5rem)-var(--bottom-nav-h,0px))] -mx-4 sm:-mx-6 -mb-6 overflow-hidden">

      {/* Inbox sidebar */}
      <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col border-r border-border bg-surface-2">
        <ChatInbox initialThreads={threads} activeThreadId={null} />
      </div>

      {/* Empty state (desktop only) */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-surface">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-brand/10 flex items-center justify-center mx-auto mb-5">
            <MessageSquare size={36} className="text-brand" />
          </div>
          <p className="text-lg font-bold text-primary">Your Messages</p>
          <p className="text-sm text-muted mt-2 max-w-xs">
            Select a conversation from the left, or start a new one from a circle or order.
          </p>
        </div>
      </div>
    </div>
  )
}