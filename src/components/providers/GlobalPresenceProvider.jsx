'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'

export default function GlobalPresenceProvider({ children }) {
  const { user } = useAuthStore()
  const channelRef = useRef(null)

  useEffect(() => {
    if (!user) return

    const supabase = createClient()
    const ch = supabase.channel('global-presence', {
      config: { presence: { key: user.id } }
    })

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState()
      const onlineIds = new Set(Object.keys(state))
      useChatStore.setState({ onlineUsers: onlineIds })
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        channelRef.current = ch
        await ch.track({ online_at: new Date().toISOString() })
      }
    })

    return () => {
      supabase.removeChannel(ch)
      channelRef.current = null
    }
  }, [user?.id])

  return children
}
