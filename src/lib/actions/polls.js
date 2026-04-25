'use server'
// FILE: src/lib/actions/polls.js

import { createClient }  from '@/lib/supabase/server'

// ─── Create a poll (via circle message) ──────────────────────────────────────
export async function createPoll(circleId, { question, options, multiple = false, expiresAt }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!question?.trim())          return { error: 'Question is required' }
  if (!options || options.length < 2) return { error: 'At least 2 options required' }
  if (options.length > 10)        return { error: 'Max 10 options' }

  // Store poll as a special circle message with type='poll'
  // Content is JSON: { question, options: [{id, text, votes: 0}], multiple, expires_at }
  const pollData = {
    question:   question.trim(),
    options:    options.filter(o => o.trim()).map((text, i) => ({
      id:    String(i),
      text:  text.trim(),
      votes: 0,
    })),
    multiple,
    expires_at: expiresAt || null,
    total_votes: 0,
  }

  const { data, error } = await supabase
    .from('circle_messages')
    .insert({
      circle_id:  circleId,
      sender_id:  user.id,
      type:       'poll',
      content:    JSON.stringify(pollData),
      created_at: new Date().toISOString(),
    })
    .select('*, sender:users(id, full_name, avatar_url)')
    .single()

  if (error) return { error: error.message }

  await supabase.from('circles')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', circleId)

  return { data }
}

// ─── Vote on a poll ───────────────────────────────────────────────────────────
export async function votePoll(messageId, optionIds) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get current poll state
  const { data: msg } = await supabase
    .from('circle_messages')
    .select('content')
    .eq('id', messageId)
    .single()

  if (!msg) return { error: 'Poll not found' }

  let poll
  try { poll = JSON.parse(msg.content) } catch { return { error: 'Invalid poll data' } }

  // Check if already voted
  const { data: existingVote } = await supabase
    .from('poll_votes')
    .select('id, option_ids')
    .eq('message_id', messageId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingVote && !poll.multiple) return { error: 'Already voted' }

  // Record vote
  if (existingVote) {
    // Update existing vote (for multiple-choice)
    await supabase.from('poll_votes')
      .update({ option_ids: optionIds, voted_at: new Date().toISOString() })
      .eq('id', existingVote.id)
  } else {
    await supabase.from('poll_votes')
      .insert({ message_id: messageId, user_id: user.id, option_ids: optionIds, voted_at: new Date().toISOString() })
  }

  // Recount votes per option from poll_votes table
  const { data: allVotes } = await supabase
    .from('poll_votes')
    .select('option_ids')
    .eq('message_id', messageId)

  const counts = {}
  ;(allVotes ?? []).forEach(v => {
    (v.option_ids ?? []).forEach(oid => { counts[oid] = (counts[oid] ?? 0) + 1 })
  })

  const updatedOptions = poll.options.map(o => ({
    ...o,
    votes: counts[o.id] ?? 0,
  }))

  const updatedPoll = {
    ...poll,
    options:     updatedOptions,
    total_votes: allVotes?.length ?? 0,
  }

  await supabase.from('circle_messages')
    .update({ content: JSON.stringify(updatedPoll) })
    .eq('id', messageId)

  return { poll: updatedPoll }
}

// ─── Get who voted for what (vendor only view) ────────────────────────────────
export async function getPollVoters(messageId) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('poll_votes')
    .select('option_ids, voted_at, user:users(id, full_name, avatar_url)')
    .eq('message_id', messageId)
    .order('voted_at', { ascending: false })

  return data ?? []
}