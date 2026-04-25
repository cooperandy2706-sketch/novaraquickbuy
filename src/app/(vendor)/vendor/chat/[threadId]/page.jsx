// FILE: src/app/(vendor)/vendor/chat/[threadId]/page.jsx
import { notFound }  from 'next/navigation'
import {
  getDMThreads,
  getDMMessages,
  getOrCreateDMThread,
  markDMRead,
}                    from '@/lib/actions/directMessages'
import ThreadView    from './ThreadView'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Chat · Novara Vendor' }

export default async function ThreadPage({ params }) {
  const { threadId } = await params
  const supabase     = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Fetch thread with participant profiles
  const { data: thread } = await supabase
    .from('dm_threads')
    .select(`
      id, thread_key, last_message, updated_at, created_at,
      participant_a, participant_b,
      participant_a_profile:users!dm_threads_participant_a_fkey (id, full_name, avatar_url, email),
      participant_b_profile:users!dm_threads_participant_b_fkey (id, full_name, avatar_url, email)
    `)
    .eq('id', threadId)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .single()

  if (!thread) notFound()

  const enriched = {
    ...thread,
    other: thread.participant_a === user.id
      ? thread.participant_b_profile
      : thread.participant_a_profile,
  }

  const [threads, messages] = await Promise.all([
    getDMThreads(),
    getDMMessages(threadId, 0, 50),
  ])

  // Mark as read server-side too
  await markDMRead(threadId)

  return (
    <ThreadView
      thread={enriched}
      threads={threads}
      initialMessages={messages}
    />
  )
}