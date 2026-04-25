'use client'
// FILE: src/components/vendor/circles/PollBubble.jsx

import { useState }    from 'react'
import { BarChart2, Clock, CheckCircle2, Loader2, Users, ChevronDown } from 'lucide-react'
import { votePoll, getPollVoters } from '@/lib/actions/polls'
import { cn }          from '@/utils/cn'

function timeLeft(expiresAt) {
  if (!expiresAt) return null
  const diff = new Date(expiresAt) - Date.now()
  if (diff <= 0) return 'Ended'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 48) return `${Math.floor(h / 24)}d left`
  if (h > 0)  return `${h}h ${m}m left`
  return `${m}m left`
}

export default function PollBubble({ message, currentUserId, isVendor }) {
  let poll = null
  try { poll = JSON.parse(message.content) } catch { return null }
  if (!poll?.question) return null

  const [localPoll,   setLocalPoll]   = useState(poll)
  const [selected,    setSelected]    = useState([])   // option IDs chosen
  const [voted,       setVoted]       = useState(false)
  const [voting,      setVoting]      = useState(false)
  const [showVoters,  setShowVoters]  = useState(false)
  const [voters,      setVoters]      = useState([])
  const [loadVoters,  setLoadVoters]  = useState(false)

  const expired   = localPoll.expires_at && new Date(localPoll.expires_at) < Date.now()
  const timeStr   = timeLeft(localPoll.expires_at)
  const totalVotes = localPoll.total_votes ?? 0

  const toggleOption = (id) => {
    if (voted || expired) return
    if (localPoll.multiple) {
      setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
    } else {
      setSelected([id])
    }
  }

  const handleVote = async () => {
    if (!selected.length || voting) return
    setVoting(true)
    const res = await votePoll(message.id, selected)
    setVoting(false)
    if (res?.poll) {
      setLocalPoll(res.poll)
      setVoted(true)
    }
  }

  const handleShowVoters = async () => {
    if (!isVendor) return
    setShowVoters(v => !v)
    if (!voters.length) {
      setLoadVoters(true)
      const data = await getPollVoters(message.id)
      setVoters(data)
      setLoadVoters(false)
    }
  }

  const showResults = voted || expired

  return (
    <div className="mx-2 my-2">
      <div className="bg-surface-2 border-2 border-border/50 rounded-2xl overflow-hidden shadow-sm max-w-sm">

        {/* Poll header */}
        <div className="bg-brand/10 px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={14} className="text-brand shrink-0" />
            <span className="text-[11px] font-bold text-brand uppercase tracking-wide">Poll</span>
            {timeStr && (
              <span className={cn(
                'ml-auto flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full',
                expired
                  ? 'bg-surface-3 text-muted'
                  : 'bg-brand/20 text-brand',
              )}>
                <Clock size={9} /> {timeStr}
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-primary leading-snug">{localPoll.question}</p>
          {localPoll.multiple && (
            <p className="text-[10px] text-brand/70 mt-1">Select all that apply</p>
          )}
        </div>

        {/* Options */}
        <div className="px-4 py-3 space-y-2">
          {localPoll.options.map(opt => {
            const pct        = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
            const isSelected = selected.includes(opt.id)
            const isLeading  = showResults && opt.votes === Math.max(...localPoll.options.map(o => o.votes)) && opt.votes > 0

            return (
              <button
                key={opt.id}
                onClick={() => toggleOption(opt.id)}
                disabled={voted || expired || !currentUserId}
                className={cn(
                  'w-full relative rounded-xl border-2 overflow-hidden text-left transition-all',
                  showResults ? 'cursor-default' : 'cursor-pointer hover:border-brand/40',
                  isSelected && !showResults ? 'border-brand bg-brand/10' :
                  isLeading   && showResults  ? 'border-brand bg-brand/10' :
                                                'border-border bg-surface-3',
                )}
              >
                {/* Result bar */}
                {showResults && (
                  <div
                    className={cn('absolute inset-y-0 left-0 transition-all duration-700 rounded-xl',
                      isLeading ? 'bg-brand/10' : 'bg-surface-3')}
                    style={{ width: `${pct}%` }}
                  />
                )}

                <div className="relative flex items-center gap-3 px-3 py-2.5">
                  {/* Choice indicator */}
                  {!showResults && (
                    <div className={cn(
                      'w-4 h-4 shrink-0 border-2 flex items-center justify-center transition-all',
                      localPoll.multiple ? 'rounded-md' : 'rounded-full',
                      isSelected ? 'bg-brand border-brand' : 'bg-surface-2 border-border',
                    )}>
                      {isSelected && <div className={cn('bg-white', localPoll.multiple ? 'w-2 h-2 rounded-sm' : 'w-1.5 h-1.5 rounded-full')} />}
                    </div>
                  )}
                  {showResults && isLeading && (
                    <CheckCircle2 size={14} className="text-brand shrink-0" />
                  )}
                  {showResults && !isLeading && (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-border shrink-0" />
                  )}

                  <span className={cn('text-sm flex-1 min-w-0',
                    isLeading && showResults ? 'font-bold text-primary' : 'font-medium text-secondary')}>
                    {opt.text}
                  </span>

                  {showResults && (
                    <div className="shrink-0 text-right ml-2">
                      <span className={cn('text-xs font-bold tabular-nums',
                        isLeading ? 'text-brand' : 'text-muted')}>
                        {pct}%
                      </span>
                      <span className="text-[10px] text-muted block">{opt.votes} vote{opt.votes !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pb-3 space-y-2">
          {/* Vote button */}
          {!voted && !expired && selected.length > 0 && (
            <button onClick={handleVote} disabled={voting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand hover:bg-brand-700 text-white font-bold text-sm disabled:opacity-50 transition-all shadow-brand active:scale-[0.98]">
              {voting ? <Loader2 size={14} className="animate-spin" /> : <>Vote · {selected.length} selected</>}
            </button>
          )}

          {/* Total votes + voter list (vendor only) */}
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted">
              {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
              {voted && <span className="text-brand font-semibold ml-1.5">✓ You voted</span>}
              {expired && <span className="text-muted font-semibold ml-1.5">· Closed</span>}
            </p>

            {isVendor && totalVotes > 0 && (
              <button
                onClick={handleShowVoters}
                className="flex items-center gap-1 text-[11px] font-semibold text-brand hover:text-brand-700 transition-colors"
              >
                <Users size={11} /> See voters
                <ChevronDown size={11} className={cn('transition-transform', showVoters && 'rotate-180')} />
              </button>
            )}
          </div>

          {/* Voter list (vendor view) */}
          {showVoters && isVendor && (
            <div className="border-t border-border/50 pt-2 space-y-1.5 max-h-40 overflow-y-auto">
              {loadVoters ? (
                <div className="flex justify-center py-2">
                  <Loader2 size={14} className="text-muted animate-spin" />
                </div>
              ) : voters.length === 0 ? (
                <p className="text-xs text-muted text-center py-2">No votes yet</p>
              ) : voters.map((v, i) => {
                const optLabels = (v.option_ids ?? [])
                  .map(oid => localPoll.options.find(o => o.id === oid)?.text)
                  .filter(Boolean)
                  .join(', ')
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-surface-3 border border-border/50 overflow-hidden shrink-0">
                      {v.user?.avatar_url
                        ? <img src={v.user.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-muted">
                            {v.user?.full_name?.charAt(0) ?? '?'}
                          </div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary truncate">{v.user?.full_name ?? 'Member'}</p>
                      <p className="text-[10px] text-muted truncate">{optLabels}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}