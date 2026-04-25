'use client'
// FILE: src/components/chat/MessageBubble.jsx
// Renders a single message in the chat thread.
// Handles all types: text | image | video | audio | product | poll | sticker | gif | system
// Includes: emoji reactions, reply-to preview, context menu (edit/delete/react/reply),
// message status (sent/delivered/read), edit state.

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { cn } from '@/utils/cn'
import { usePoll } from '@/hooks/useChat'
import { useAuthStore } from '@/store/authStore'
import {
  MoreHorizontal, Reply, Edit2, Trash2,
  Copy, Pin, Check, CheckCheck,
  Play, Pause, Volume2, Package,
  BarChart3, Download, ExternalLink,
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '🔥']

const fmt = (n, cur = 'GHS') => formatCurrency(n, cur)

// ─────────────────────────────────────────────────────────────
// REACTION BAR
// ─────────────────────────────────────────────────────────────

function ReactionBar({ reactions = {}, onReact, myReactions = new Set() }) {
  if (!Object.keys(reactions).length) return null
  return (
    <div className="flex items-center gap-1 flex-wrap mt-1">
      {Object.entries(reactions).map(([emoji, count]) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border transition-all',
            myReactions.has(emoji)
              ? 'bg-brand/10 border-brand/30 text-brand'
              : 'bg-surface-2/80 border-border text-secondary hover:border-brand/40',
          )}
        >
          <span>{emoji}</span>
          <span className="text-[10px]">{count}</span>
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// QUICK REACT POPOVER
// ─────────────────────────────────────────────────────────────

function QuickReactPopover({ onReact, onMoreEmoji, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 bg-surface-2 rounded-2xl px-2 py-1.5 flex items-center gap-1 shadow-2xl border border-border">
        {QUICK_REACTIONS.map(emoji => (
          <button
            key={emoji}
            onClick={() => { onReact(emoji); onClose() }}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-xl hover:bg-surface-3 transition-all hover:scale-125 active:scale-95"
          >
            {emoji}
          </button>
        ))}
        <button
          onClick={() => { onMoreEmoji(); onClose() }}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:bg-surface-3 transition-all text-base"
        >
          ➕
        </button>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// CONTEXT MENU
// ─────────────────────────────────────────────────────────────

function MessageContextMenu({ message, isOwn, onReply, onEdit, onDelete, onCopy, onPin, onClose }) {
  const items = [
    { icon: Reply,  label: 'Reply',  action: onReply,                     show: true },
    { icon: Copy,   label: 'Copy',   action: onCopy,                      show: message.message_type === 'text' },
    { icon: Edit2,  label: 'Edit',   action: onEdit,                      show: isOwn && message.message_type === 'text' },
    { icon: Pin,    label: 'Pin',    action: onPin,                       show: true },
    { icon: Trash2, label: 'Delete', action: onDelete, warn: true,        show: isOwn },
  ].filter(i => i.show)

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute z-50 bg-surface-2 rounded-2xl py-1.5 w-40 shadow-2xl border border-border overflow-hidden">
        {items.map(item => (
          <button
            key={item.label}
            onClick={() => { item.action?.(); onClose() }}
            className={cn(
              'w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-colors',
              item.warn
                ? 'text-danger hover:bg-danger/10'
                : 'text-primary hover:bg-surface-3',
            )}
          >
            <item.icon size={13} />
            {item.label}
          </button>
        ))}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// REPLY PREVIEW (shown above message bubble)
// ─────────────────────────────────────────────────────────────

function ReplyPreview({ replyTo }) {
  if (!replyTo) return null
  const preview = replyTo.message_type === 'text'
    ? replyTo.content?.slice(0, 60)
    : `${replyTo.message_type} message`

  return (
    <div className="flex items-start gap-1.5 mb-1 opacity-80">
      <div className="w-0.5 h-full min-h-[24px] bg-brand-400 rounded-full shrink-0" />
      <div>
        <p className="text-[10px] font-bold text-brand">
          {replyTo.sender?.full_name ?? replyTo.sender?.display_name ?? 'User'}
        </p>
        <p className="text-[10px] text-muted truncate max-w-[180px]">
          {preview}
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CONTENT RENDERERS
// ─────────────────────────────────────────────────────────────

function TextContent({ content, isOwn }) {
  if (!content) return null
  // Simple link detection
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = content.split(urlRegex)

  return (
    <p className={cn(
      'text-sm leading-relaxed whitespace-pre-wrap break-words',
      isOwn ? 'text-white' : 'text-primary',
    )}>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener" className={cn('underline hover:opacity-80 transition-opacity', isOwn ? 'text-brand-200' : 'text-brand')}>
            {part}
          </a>
        ) : part
      )}
    </p>
  )
}

function ImageContent({ metadata, isOwn }) {
  const [expanded, setExpanded] = useState(false)
  if (!metadata?.url) return null

  return (
    <div className="space-y-1">
      <div
        className="rounded-2xl overflow-hidden cursor-pointer max-w-[260px]"
        onClick={() => setExpanded(true)}
      >
        <img
          src={metadata.url}
          alt="image"
          className="w-full object-cover max-h-72 transition-transform hover:scale-[1.02]"
        />
      </div>
      {metadata.caption && (
        <p className="text-xs text-secondary mt-1">{metadata.caption}</p>
      )}
      {expanded && (
        <>
          <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center" onClick={() => setExpanded(false)}>
            <img src={metadata.url} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
          </div>
        </>
      )}
    </div>
  )
}

function VideoContent({ metadata }) {
  if (!metadata?.url) return null
  return (
    <div className="rounded-2xl overflow-hidden max-w-[280px]">
      <video
        src={metadata.url}
        controls
        className="w-full max-h-64 bg-black"
        poster={metadata.thumb_url ?? undefined}
      />
      {metadata.caption && (
        <p className="text-xs text-secondary mt-1 px-1">{metadata.caption}</p>
      )}
    </div>
  )
}

function AudioContent({ metadata, isOwn }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef(null)

  if (!metadata?.url) return null

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else { audioRef.current.play(); setPlaying(true) }
  }

  const fmtTime = (s) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`

  return (
    <div className={cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-2xl min-w-[200px] max-w-[280px]',
      isOwn ? 'bg-surface-3' : 'bg-surface-2',
    )}>
      <audio
        ref={audioRef}
        src={metadata.url}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
        onEnded={() => { setPlaying(false); setProgress(0) }}
      />
      <button
        onClick={toggle}
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all',
          isOwn ? 'bg-surface-2 hover:bg-surface-1' : 'bg-brand/20 hover:bg-brand/30',
        )}
      >
        {playing ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white fill-white" />}
      </button>

      {/* Waveform bars */}
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-px h-8">
          {(metadata.waveform?.length ? metadata.waveform : Array.from({ length: 32 }, () => Math.random())).map((v, i) => (
            <div
              key={i}
              className={cn(
                'w-1 rounded-full transition-all',
                i / 32 < progress
                  ? (isOwn ? 'bg-white' : 'bg-brand')
                  : (isOwn ? 'bg-white/40' : 'bg-surface-3'),
              )}
              style={{ height: `${Math.max(15, v * 100)}%` }}
            />
          ))}
        </div>
        {audioRef.current && (
          <p className="text-[10px] text-muted">
            {fmtTime(audioRef.current.currentTime)} / {fmtTime(metadata.duration_secs ?? 0)}
          </p>
        )}
      </div>
    </div>
  )
}

function ProductContent({ metadata }) {
  if (!metadata) return null
  return (
    <Link
      href={metadata.url ?? `/product/${metadata.product_id}`}
      className="flex items-center gap-3 bg-surface-3 hover:bg-surface-2 transition-colors rounded-2xl p-3 max-w-[280px] border border-border"
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-1 shrink-0">
        {metadata.image_url
          ? <img src={metadata.image_url} alt="" className="w-full h-full object-cover" />
          : <Package size={24} className="text-muted m-auto mt-3" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted font-medium truncate">{metadata.vendor_name}</p>
        <p className="text-sm font-bold text-primary line-clamp-2 leading-tight">{metadata.name}</p>
        <p className="text-base font-black text-brand mt-0.5">
          {fmt(metadata.price, metadata.currency)}
        </p>
      </div>
      <ExternalLink size={14} className="text-muted shrink-0" />
    </Link>
  )
}

function GifContent({ metadata }) {
  if (!metadata?.url) return null
  return (
    <div className="rounded-2xl overflow-hidden max-w-[260px]">
      <img src={metadata.url} alt="GIF" className="w-full" />
    </div>
  )
}

function PollContent({ message }) {
  const pollData = message.poll_data
  const { myVotes, loading, vote, hasVoted, pollData: enrichedPoll, totalVotes } = usePoll(message.id, pollData)
  const { user: pollUser } = useAuthStore()
  const myUserId = pollUser?.id

  if (!pollData) return null

  const displayPoll       = enrichedPoll ?? pollData
  const totalVotesDisplay = totalVotes

  return (
    <div className="space-y-3 min-w-[220px] max-w-[280px]">
      <div className="flex items-center gap-2">
        <BarChart3 size={15} className="text-brand shrink-0" />
        <p className={cn('text-sm font-bold', myUserId && message.sender_id === myUserId ? 'text-white' : 'text-primary')}>{displayPoll.question}</p>
      </div>

      <div className="space-y-2">
        {(displayPoll.options ?? []).map(opt => {
          const pct    = totalVotesDisplay > 0 ? Math.round((opt.vote_count / totalVotesDisplay) * 100) : 0
          const isMine = myVotes.includes(opt.id)

          return (
            <button
              key={opt.id}
              onClick={() => !hasVoted && vote([opt.id])}
              disabled={loading || hasVoted}
              className={cn(
                'w-full rounded-xl overflow-hidden border text-left transition-all',
                isMine ? 'border-brand/40 bg-brand/10' : 'border-border bg-surface-3 hover:bg-surface-2',
                (hasVoted || loading) && 'cursor-default',
              )}
            >
              <div className="relative px-3 py-2.5">
                {/* Progress bar */}
                {hasVoted && (
                  <div
                    className={cn(
                      'absolute inset-0 rounded-xl transition-all duration-700',
                      isMine ? 'bg-brand/20' : 'bg-surface-3',
                    )}
                    style={{ width: `${pct}%` }}
                  />
                )}
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                      isMine ? 'border-brand bg-brand' : 'border-border',
                    )}>
                      {isMine && <Check size={9} className="text-white" />}
                    </div>
                    <span className="text-xs font-medium text-primary">{opt.text}</span>
                  </div>
                  {hasVoted && (
                    <span className="text-[10px] font-black text-secondary">{pct}%</span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-[10px] text-muted">
        {totalVotesDisplay} vote{totalVotesDisplay !== 1 ? 's' : ''}
        {displayPoll.expires_at && ` · Ends ${new Date(displayPoll.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
      </p>
    </div>
  )
}

function SystemContent({ content, metadata }) {
  const text = metadata?.event === 'member_joined'  ? `${metadata.actor_name} joined the circle`
             : metadata?.event === 'member_left'    ? `${metadata.actor_name} left the circle`
             : metadata?.event === 'circle_created' ? `Circle created by ${metadata.actor_name}`
             : content ?? 'System message'

  return (
    <div className="flex items-center justify-center">
      <span className="text-[11px] text-secondary bg-surface-3/50 backdrop-blur-sm rounded-full px-3 py-1">
        {text}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN MESSAGE BUBBLE
// ─────────────────────────────────────────────────────────────

export default function MessageBubble({
  message,
  isOwn,
  showAvatar    = true,
  showName      = true,
  myUserId,
  myReactions   = new Set(),
  onReact,
  onReply,
  onEdit,
  onDelete,
  onPin,
}) {
  const [showActions,  setShowActions]  = useState(false)
  const [showReact,    setShowReact]    = useState(false)
  const [showMenu,     setShowMenu]     = useState(false)
  const [editing,      setEditing]      = useState(false)
  const [editContent,  setEditContent]  = useState(message.content ?? '')
  const bubbleRef = useRef(null)

  const isSystem = message.message_type === 'system'
  const hasBubble = !isSystem

  // Determine context menu position (above or below)
  const [menuBelow, setMenuBelow] = useState(false)

  const handleLongPress = useCallback(() => {
    if (!bubbleRef.current) return
    const rect = bubbleRef.current.getBoundingClientRect()
    setMenuBelow(rect.top < 200)
    setShowMenu(true)
  }, [])

  const handleCopy = () => {
    navigator.clipboard?.writeText(message.content ?? '')
  }

  const handleEditSave = async () => {
    if (!editContent.trim()) return
    await onEdit?.(message.id, editContent)
    setEditing(false)
  }

  if (isSystem) return <SystemContent content={message.content} metadata={message.metadata} />

  if (message.is_deleted) {
    return (
      <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-surface-3 border border-border max-w-[200px]">
          <Trash2 size={12} className="text-muted shrink-0" />
          <span className="text-xs text-muted italic">Message deleted</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn('flex items-end gap-2 group', isOwn ? 'flex-row-reverse' : 'flex-row')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReact(false) }}
    >
      {/* Avatar */}
      {showAvatar && !isOwn ? (
        <div className="w-7 h-7 rounded-full shrink-0 overflow-hidden bg-surface-3 flex items-center justify-center text-xs font-bold text-secondary">
          {message.sender?.avatar_url
            ? <img src={message.sender.avatar_url} alt="" className="w-full h-full object-cover" />
            : (message.sender?.full_name?.[0]?.toUpperCase() ?? '?')
          }
        </div>
      ) : (
        <div className="w-7 shrink-0" />
      )}

      {/* Bubble + reactions */}
      <div className={cn('flex flex-col max-w-[72%]', isOwn ? 'items-end' : 'items-start')}>

        {/* Sender name (circles) */}
        {showName && !isOwn && message.sender?.full_name && (
          <p className="text-[10px] font-bold text-brand mb-1 px-1">
            {message.sender.full_name}
          </p>
        )}

        {/* Reply preview */}
        {message.reply_to && (
          <div className={cn('px-1', isOwn ? 'text-right' : '')}>
            <ReplyPreview replyTo={message.reply_to} />
          </div>
        )}

        {/* The bubble */}
        <div className="relative">
          <div
            ref={bubbleRef}
            onContextMenu={(e) => { e.preventDefault(); handleLongPress() }}
            className={cn(
              'relative rounded-3xl px-4 py-2.5 transition-all',
              // Shape
              isOwn
                ? 'rounded-br-lg bg-gradient-to-br from-brand-600 to-brand-700 shadow-sm'
                : 'rounded-bl-lg bg-surface-2 border border-border shadow-sm',
              // Media types: no padding
              ['image','video','gif'].includes(message.message_type) && 'p-1',
            )}
          >
            {/* Content by type */}
            {message.message_type === 'text'    && <TextContent    content={message.content}    isOwn={isOwn} />}
            {message.message_type === 'image'   && <ImageContent   metadata={message.metadata}  isOwn={isOwn} />}
            {message.message_type === 'video'   && <VideoContent   metadata={message.metadata} />}
            {message.message_type === 'audio'   && <AudioContent   metadata={message.metadata}  isOwn={isOwn} />}
            {message.message_type === 'product' && <ProductContent metadata={message.metadata} />}
            {message.message_type === 'poll'    && <PollContent    message={message} />}
            {message.message_type === 'gif'     && <GifContent     metadata={message.metadata} />}

            {/* Edit/delete indicator */}
            {message.is_edited && (
              <span className="text-[9px] text-white/40 block mt-0.5 text-right">edited</span>
            )}
          </div>

          {/* Hover actions */}
          {showActions && (
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 flex items-center gap-1 z-30',
                isOwn ? 'right-full mr-2' : 'left-full ml-2',
              )}
            >
              {/* Quick react trigger */}
              <div className="relative">
                <button
                  onClick={() => setShowReact(p => !p)}
                  className="w-7 h-7 rounded-full bg-surface-2 border border-border flex items-center justify-center text-sm hover:bg-surface-3 transition-all"
                >
                  😊
                </button>
                {showReact && (
                  <QuickReactPopover
                    onReact={(e) => onReact?.(message.id, e)}
                    onMoreEmoji={() => {}}
                    onClose={() => setShowReact(false)}
                  />
                )}
              </div>

              {/* Reply */}
              <button
                onClick={() => onReply?.(message)}
                className="w-7 h-7 rounded-full bg-surface-2 border border-border flex items-center justify-center hover:bg-surface-3 transition-all"
              >
                <Reply size={13} className="text-secondary" />
              </button>

              {/* More */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(p => !p)}
                  className="w-7 h-7 rounded-full bg-surface-2 border border-border flex items-center justify-center hover:bg-surface-3 transition-all"
                >
                  <MoreHorizontal size={13} className="text-secondary" />
                </button>
                {showMenu && (
                  <div className={cn(
                    'absolute z-50',
                    isOwn ? 'right-0' : 'left-0',
                    menuBelow ? 'top-full mt-1' : 'bottom-full mb-1',
                  )}>
                    <MessageContextMenu
                      message={message}
                      isOwn={isOwn}
                      onReply={() => onReply?.(message)}
                      onEdit={() => setEditing(true)}
                      onDelete={() => onDelete?.(message.id)}
                      onCopy={handleCopy}
                      onPin={() => onPin?.(message.id)}
                      onClose={() => setShowMenu(false)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Inline edit */}
        {editing && (
          <div className="mt-1 flex items-center gap-2 w-full max-w-[280px]">
            <input
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave() }
                if (e.key === 'Escape') setEditing(false)
              }}
              autoFocus
              className="flex-1 text-xs bg-surface-3 border border-brand/50 rounded-xl px-3 py-2 outline-none text-primary"
            />
            <button onClick={handleEditSave} className="text-[11px] font-black text-brand hover:text-brand-600">Save</button>
            <button onClick={() => setEditing(false)} className="text-[11px] text-muted hover:text-secondary">Cancel</button>
          </div>
        )}

        {/* Reactions */}
        <ReactionBar
          reactions={message.reaction_counts ?? {}}
          onReact={(e) => onReact?.(message.id, e)}
          myReactions={myReactions}
        />

        {/* Timestamp + read receipt */}
        <div className={cn('flex items-center gap-1 mt-0.5 px-1', isOwn ? 'flex-row-reverse' : 'flex-row')}>
          <span className="text-[9px] text-muted">
            {new Date(message.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwn && <CheckCheck size={11} className="text-brand" />}
        </div>
      </div>
    </div>
  )
}