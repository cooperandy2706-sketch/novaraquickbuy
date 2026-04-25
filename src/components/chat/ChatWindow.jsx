'use client'
// FILE: src/components/chat/ChatWindow.jsx

import { useState, useEffect, useRef, useCallback } from 'react'
import { useChatChannel, useTypingIndicator } from '@/hooks/useChat'
import { useAuthStore }  from '@/store/authStore'
import { useChatStore }  from '@/store/chatStore'
import MessageBubble     from '@/components/chat/MessageBubble'
import MessageInput      from '@/components/chat/MessageInput'
import { cn } from '@/utils/cn'
import {
  ArrowDown, Pin, Loader2, Info, Users,
  ChevronLeft, Phone, Video, Search,
  ShieldCheck, X,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  const d    = new Date(dateStr)
  const diff = Math.floor((Date.now() - d) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

function shouldSep(msg, prev) {
  if (!prev) return true
  return new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString()
}

function shouldGroup(msg, prev) {
  if (!prev) return false
  if (msg.sender_id !== prev.sender_id) return false
  if (msg.message_type === 'system' || prev.message_type === 'system') return false
  return (new Date(msg.created_at) - new Date(prev.created_at)) < 180000
}

// ─────────────────────────────────────────────────────────────
// DATE SEPARATOR
// ─────────────────────────────────────────────────────────────

function DateSeparator({ date }) {
  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[11px] font-semibold text-muted whitespace-nowrap">
        {formatDate(date)}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TYPING INDICATOR
// ─────────────────────────────────────────────────────────────

function TypingIndicator({ names }) {
  if (!names.length) return null
  const text = names.length === 1
    ? `${names[0]} is typing`
    : `${names.slice(0, 2).join(' & ')} are typing`
  return (
    <div className="flex items-end gap-2 px-4 py-1">
      <div className="w-7 h-7 rounded-2xl bg-surface-3 shrink-0" />
      <div className="bg-surface-2 border border-border rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2 shadow-sm">
        <div className="flex gap-1">
          {[0,1,2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted"
              style={{ animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
        <span className="text-xs text-secondary">{text}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PINNED BANNER
// ─────────────────────────────────────────────────────────────

function PinnedBanner({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-brand/10 border-b border-brand/20 flex-shrink-0">
      <Pin size={13} className="text-brand shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-brand uppercase tracking-wider mb-0.5">Pinned</p>
        <p className="text-xs text-secondary truncate">
          {message.content ?? `${message.message_type} message`}
        </p>
      </div>
      <button onClick={onDismiss} className="text-muted hover:text-secondary">
        <X size={13} />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CHANNEL HEADER
// ─────────────────────────────────────────────────────────────

function ChannelHeader({ channel, type, onBack }) {
  const name = type === 'dm' ? channel?.other_name : channel?.name
  const sub  = type === 'dm'
    ? (channel?.online ? 'Online' : 'Offline')
    : `${channel?.member_count ?? 0} members`

  return (
    <div className="flex items-center gap-2 px-3 py-3 bg-surface-2 border-b border-border flex-shrink-0">
      {/* Back button — hidden on desktop (lg+) via lg:hidden */}
      <button
        onClick={onBack}
        className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-secondary hover:bg-surface-3 active:bg-surface-3 transition-colors flex-shrink-0"
      >
        <ChevronLeft size={22} />
      </button>

      {/* Avatar */}
      {type === 'dm' ? (
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-2xl bg-brand flex items-center justify-center text-white font-bold text-sm overflow-hidden">
            {channel?.other_avatar
              ? <img src={channel?.other_avatar} alt="" className="w-full h-full object-cover" />
              : (channel?.other_name?.[0]?.toUpperCase() ?? '?')
            }
          </div>
          {channel?.online && (
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand border-2 border-surface" />
          )}
        </div>
      ) : (
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: channel?.color ?? '#16A34A' }}
        >
          {channel?.emoji ?? '💬'}
        </div>
      )}

      {/* Name + subtitle */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-primary truncate">{name}</p>
        <p className={cn(
          'text-[11px] font-medium',
          type === 'dm' && channel?.online ? 'text-brand' : 'text-muted',
        )}>
          {sub}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {type === 'dm' && (
          <>
            <button className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-primary hover:bg-surface-3 transition-colors">
              <Phone size={16} />
            </button>
            <button className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-primary hover:bg-surface-3 transition-colors">
              <Video size={16} />
            </button>
          </>
        )}
        <button className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-primary hover:bg-surface-3 transition-colors">
          <Search size={15} />
        </button>
        <button className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-primary hover:bg-surface-3 transition-colors">
          {type === 'circle' ? <Users size={15} /> : <Info size={15} />}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────

function EmptyState({ type, channel }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-6 gap-4 py-20">
      <div className="text-5xl">{type === 'circle' ? (channel?.emoji ?? '💬') : '👋'}</div>
      <div>
        <p className="text-sm font-bold text-primary">
          {type === 'circle' ? `Welcome to ${channel?.name}!` : 'Start the conversation'}
        </p>
        <p className="text-xs text-muted mt-1">
          {type === 'circle'
            ? 'Be the first to say something.'
            : 'Your messages are protected by Novara.'}
        </p>
      </div>
      {type === 'dm' && (
        <div className="flex items-center gap-2 bg-brand/5 border border-brand/10 rounded-xl px-3 py-2">
          <ShieldCheck size={13} className="text-brand" />
          <span className="text-xs font-medium text-brand">Protected by Novara</span>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// JUMP TO BOTTOM
// ─────────────────────────────────────────────────────────────

function JumpToBottom({ show, unread, onClick }) {
  if (!show) return null
  return (
    <button
      onClick={onClick}
      className="absolute bottom-24 right-4 z-20 flex items-center gap-2 bg-surface-2 border border-border text-primary rounded-2xl px-3 py-2 shadow-lg hover:bg-surface-3 active:scale-95 transition-all"
    >
      {unread > 0 && (
        <span className="bg-brand text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
      <ArrowDown size={14} />
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────

export default function ChatWindow({ type, id, channel, onBack }) {
  const scrollRef  = useRef(null)
  const bottomRef  = useRef(null)
  const [atBottom, setAtBottom] = useState(true)
  const [newCount, setNewCount] = useState(0)
  const [pinned,   setPinned]   = useState(null)

  const { user }  = useAuthStore()
  const store     = useChatStore()

  const {
    messages, loading, sending, hasMore,
    sendMessage, sendPoll, reactToMessage,
    editMessage, deleteMessage, loadMore,
  } = useChatChannel({ type, id })

  const { startTyping, stopTyping, typingList } = useTypingIndicator({ type, id })
  const replyingTo = store.replyingTo

  const [myReactions, setMyReactions] = useState({})

  // ── Scroll ──
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
    setAtBottom(true)
    setNewCount(0)
  }, [])

  useEffect(() => {
    if (atBottom) scrollToBottom(false)
    else setNewCount(p => p + 1)
  }, [messages.length])

  useEffect(() => {
    setTimeout(() => scrollToBottom(false), 80)
  }, [id])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight
    setAtBottom(dist < 80)
    if (el.scrollTop < 80 && hasMore && !loading) {
      const prev = el.scrollHeight
      loadMore().then(() => requestAnimationFrame(() => { el.scrollTop = el.scrollHeight - prev }))
    }
  }, [hasMore, loading, loadMore])

  useEffect(() => {
    const p = messages.find(m => m.is_pinned)
    if (p) setPinned(p)
  }, [messages])

  const handleSend = async (opts) => {
    stopTyping()
    await sendMessage(opts)
    store.clearReplyingTo()
    scrollToBottom()
  }

  const handleReact = async (msgId, emoji) => {
    setMyReactions(prev => {
      const s = new Set(prev[msgId] ?? [])
      s.has(emoji) ? s.delete(emoji) : s.add(emoji)
      return { ...prev, [msgId]: s }
    })
    await reactToMessage(msgId, emoji)
  }

  const handleReply = (msg) => {
    store.setReplyingTo({
      id:           msg.id,
      sender_name:  msg.sender?.full_name ?? msg.sender?.display_name ?? 'User',
      content:      msg.content,
      message_type: msg.message_type,
    })
  }

  return (
    <div className="flex flex-col h-full bg-surface relative">

      <ChannelHeader channel={channel} type={type} onBack={onBack} />
      <PinnedBanner message={pinned} onDismiss={() => setPinned(null)} />

      {/* Messages scroll area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border/20 scrollbar-track-transparent"
      >
        {hasMore && (
          <div className="flex justify-center py-4">
            <Loader2 size={18} className="text-brand animate-spin" />
          </div>
        )}

        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="text-brand animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState type={type} channel={channel} />
        ) : (
          <div className="py-3">
            {messages.map((msg, idx) => {
              const prev    = messages[idx - 1]
              const isOwn   = msg.sender_id === user?.id
              const grouped = shouldGroup(msg, prev)
              const showSep = shouldSep(msg, prev)
              const showAv  = !isOwn && !grouped
              const showNm  = type === 'circle' && !isOwn && (!grouped || showSep)
              return (
                <div key={msg.id}>
                  {showSep && <DateSeparator date={msg.created_at} />}
                  <div className={grouped ? 'mt-0.5' : 'mt-2'}>
                    <MessageBubble
                      message={msg}
                      isOwn={isOwn}
                      showAvatar={showAv}
                      showName={showNm}
                      myUserId={user?.id}
                      myReactions={myReactions[msg.id] ?? new Set()}
                      onReact={handleReact}
                      onReply={handleReply}
                      onEdit={editMessage}
                      onDelete={deleteMessage}
                      onPin={() => setPinned(msg)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <TypingIndicator names={typingList} />
        <div ref={bottomRef} className="h-1" />
      </div>

      <JumpToBottom show={!atBottom} unread={newCount} onClick={scrollToBottom} />

      <MessageInput
        onSend={handleSend}
        onSendPoll={(data) => { sendPoll(data); scrollToBottom() }}
        onTyping={startTyping}
        replyTo={replyingTo}
        onClearReply={() => store.clearReplyingTo()}
        disabled={sending}
      />

      <style jsx global>{`
        @keyframes typingBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}