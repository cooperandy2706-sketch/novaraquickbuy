'use client'
// FILE: src/components/vendor/circles/CircleMembersPanel.jsx

import { useState }       from 'react'
import {
  Users, UserMinus, Copy, CheckCircle2,
  Crown, Link as LinkIcon, RefreshCw, Search,
  MessageSquarePlus,
} from 'lucide-react'
import { removeMember, generateInviteLink } from '@/lib/actions/circles'
import { cn }             from '@/utils/cn'

function MemberRow({ member, isVendor, onlineIds, onRemove, onDM }) {
  const user      = member.member
  const isOnline  = onlineIds?.has(user?.id)
  const name      = user?.full_name ?? 'Member'
  const initials  = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const joinedAt  = new Date(member.joined_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-surface-3 transition-colors group">
      {/* Avatar with online dot */}
      <div className="relative shrink-0">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-brand">
          {user?.avatar_url
            ? <img src={user.avatar_url} alt={name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{initials}</div>
          }
        </div>
        <span className={cn(
          'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface-2',
          isOnline ? 'bg-emerald-500' : 'bg-muted',
        )} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-primary truncate">{name}</p>
          {member.role === 'admin' && (
            <Crown size={11} className="text-amber-500 shrink-0" />
          )}
        </div>
        <p className="text-[10px] text-muted mt-0.5">Joined {joinedAt}</p>
      </div>

      {/* Online badge */}
      {isOnline && (
        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
          Online
        </span>
      )}

      {/* DM + Remove buttons — vendor only */}
      {isVendor && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
          {onDM && (
            <button
              onClick={() => onDM(member.member)}
              title="Message privately"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-brand hover:bg-brand/10 transition-all"
            >
              <MessageSquarePlus size={14} />
            </button>
          )}
          {member.role !== 'admin' && (
            <button
              onClick={() => onRemove(member.id)}
              title="Remove member"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-danger hover:bg-danger/10 transition-all"
            >
              <UserMinus size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function CircleMembersPanel({ circleId, members = [], onlineIds, onRefresh, onOpenDM }) {
  const [search,     setSearch]     = useState('')
  const [inviteCode, setInviteCode] = useState(null)
  const [copied,     setCopied]     = useState(false)
  const [generating, setGenerating] = useState(false)

  const filtered = members.filter(m =>
    m.member?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const onlineCount = members.filter(m => onlineIds?.has(m.member?.id)).length

  const handleRemove = async (memberId) => {
    if (!confirm('Remove this member?')) return
    await removeMember(circleId, memberId)
    onRefresh?.()
  }

  const handleGenerateInvite = async () => {
    setGenerating(true)
    const res = await generateInviteLink(circleId)
    setGenerating(false)
    if (res?.code) {
      setInviteCode(res.code)
    }
  }

  const handleCopyInvite = () => {
    const url = `${window.location.origin}/circles/join/${inviteCode}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col h-full bg-surface-2">

      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-brand-800 flex items-center gap-2">
              <Users size={14} className="text-brand" />
              Members
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              {members.length} total · {onlineCount} online
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-brand hover:bg-brand-50 transition-all"
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search members…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 rounded-xl border border-border bg-surface-3 text-xs text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
          />
        </div>
      </div>

      {/* Member list */}
      <div className="flex-1 overflow-y-auto scrollbar-none divide-y divide-border/50">
        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <Users size={28} className="text-muted/20 mx-auto mb-2" />
            <p className="text-sm text-muted">No members found</p>
          </div>
        ) : (
          filtered.map(member => (
            <MemberRow
              key={member.id}
              member={member}
              isVendor
              onlineIds={onlineIds}
              onRemove={handleRemove}
              onDM={onOpenDM}
            />
          ))
        )}
      </div>

      {/* Invite section */}
      <div className="p-4 border-t border-border space-y-3">
        {inviteCode ? (
          <div className="space-y-2">
            <p className="text-xs font-bold text-secondary uppercase tracking-widest">Invite link (7 days)</p>
            <div className="flex items-center gap-2 bg-surface-3 border border-border rounded-xl px-3 py-2">
              <p className="text-xs font-mono text-primary flex-1 truncate">
                {window?.location?.origin}/circles/join/{inviteCode}
              </p>
              <button onClick={handleCopyInvite}
                className="shrink-0 text-brand hover:text-brand transition-colors">
                {copied ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Copy size={15} />}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleGenerateInvite}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand/10 border border-brand/20 text-brand text-xs font-bold hover:bg-brand hover:text-white transition-all shadow-brand-sm"
          >
            {generating ? <RefreshCw size={13} className="animate-spin" /> : <LinkIcon size={13} />}
            Generate Invite Link
          </button>
        )}
      </div>
    </div>
  )
}