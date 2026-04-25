'use client'
// FILE: src/components/vendor/circles/CircleMessageBubble.jsx

import { useState }         from 'react'
import {
  Pin, Trash2, MoreHorizontal, Megaphone,
  Play, Music, ShoppingBag, Package,
  ExternalLink, MessageSquarePlus,
} from 'lucide-react'
import { togglePinMessage, deleteCircleMessage } from '@/lib/actions/circles'
import PollBubble from '@/components/vendor/circles/PollBubble'
import { createClient }     from '@/lib/supabase/client'
import { cn }               from '@/utils/cn'

const EMOJI_REACTIONS = [
  '👍','❤️','😂','😮','😢','😡',
  '🔥','🎉','👏','💯','✅','🙏',
]

// ── Reaction bar ──────────────────────────────────────────────────────────────
function ReactionBar({ reactions = [], messageId, currentUserId }) {
  const supabase = createClient()

  const grouped = reactions.reduce((acc, r) => {
    acc[r.emoji] = acc[r.emoji] ?? { count: 0, mine: false }
    acc[r.emoji].count++
    if (r.user_id === currentUserId) acc[r.emoji].mine = true
    return acc
  }, {})

  if (!Object.keys(grouped).length) return null

  const toggle = async (emoji) => {
    const mine = grouped[emoji]?.mine
    if (mine) {
      await supabase.from('reactions')
        .delete().eq('message_id', messageId).eq('user_id', currentUserId).eq('emoji', emoji)
    } else {
      await supabase.from('reactions')
        .insert({ message_id: messageId, user_id: currentUserId, emoji })
    }
  }

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1.5">
      {Object.entries(grouped).map(([emoji, { count, mine }]) => (
        <button key={emoji} onClick={() => toggle(emoji)}
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all active:scale-95',
            mine
              ? 'bg-brand/10 border-brand/20 text-brand'
              : 'bg-surface-3 border-border text-secondary hover:border-brand/40 hover:bg-brand/5',
          )}>
          <span>{emoji}</span>
          <span className="font-bold tabular-nums">{count}</span>
        </button>
      ))}
    </div>
  )
}

// ── Media renderer ────────────────────────────────────────────────────────────
function MediaContent({ mediaUrl, mediaType, isOwn }) {
  if (!mediaUrl || !mediaType) return null

  if (mediaType.startsWith('image')) {
    return (
      <img
        src={mediaUrl}
        alt="attachment"
        className="w-full max-w-[260px] max-h-64 rounded-xl object-cover cursor-pointer border border-neutral-200 hover:opacity-90 transition-opacity"
        onClick={() => window.open(mediaUrl, '_blank')}
      />
    )
  }

  if (mediaType.startsWith('video')) {
    return (
      <div className="relative w-full max-w-[260px] rounded-xl overflow-hidden bg-neutral-900 border border-neutral-200">
        <video
          src={mediaUrl}
          controls
          className="w-full max-h-52 object-contain"
          preload="metadata"
        />
      </div>
    )
  }

  if (mediaType.startsWith('audio')) {
    return (
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border max-w-[260px]',
        isOwn
          ? 'bg-white/10 border-white/20'
          : 'bg-surface-3 border-border',
      )}>
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          isOwn ? 'bg-white/20' : 'bg-brand/10')}>
          <Music size={15} className={isOwn ? 'text-white' : 'text-brand'} />
        </div>
        <audio src={mediaUrl} controls
          className="flex-1 h-8 accent-brand"
          style={{ minWidth: 140 }}
        />
      </div>
    )
  }

  return (
    <a href={mediaUrl} target="_blank" rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors max-w-[200px]',
        isOwn
          ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
          : 'bg-surface-3 border-border text-primary hover:bg-brand/10',
      )}>
      <ExternalLink size={14} /> View attachment
    </a>
  )
}

// ── Product card renderer ─────────────────────────────────────────────────────
function ProductCard({ content, isOwn }) {
  let product = null
  try { product = JSON.parse(content) } catch { return null }
  if (!product?.product_id) return null

  return (
    <a
      href={`/products/${product.product_id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-3 px-3 py-3 rounded-xl border max-w-[260px] transition-all hover:shadow-sm',
        isOwn
          ? 'bg-white/10 border-white/20 hover:bg-white/20'
          : 'bg-surface-2 border-border hover:border-brand/40 shadow-sm',
      )}
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden border border-border/50 shrink-0 bg-surface-3">
        {product.product_image
          ? <img src={product.product_image} alt={product.product_name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-muted"><Package size={16} /></div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold truncate', isOwn ? 'text-white' : 'text-primary')}>
          {product.product_name}
        </p>
        <p className={cn('text-sm font-bold mt-0.5', isOwn ? 'text-white/90' : 'text-brand')}>
          ${Number(product.product_price ?? 0).toFixed(2)}
        </p>
        {product.text && (
          <p className={cn('text-xs mt-0.5 truncate', isOwn ? 'text-white/70' : 'text-muted')}>
            {product.text}
          </p>
        )}
      </div>
      <ShoppingBag size={14} className={cn('shrink-0', isOwn ? 'text-white/70' : 'text-brand')} />
    </a>
  )
}

// ── Message context menu ──────────────────────────────────────────────────────
function MessageMenu({ messageId, isPinned, isOwn, onDelete, onClose, onDM }) {
  const [pinning, setPinning] = useState(false)

  const handlePin = async () => {
    setPinning(true)
    await togglePinMessage(messageId, !isPinned)
    setPinning(false)
    onClose()
  }

  const handleDelete = async () => {
    if (!confirm('Delete this message?')) return
    await deleteCircleMessage(messageId)
    onDelete?.(messageId)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className={cn(
        'absolute z-20 bg-surface-2 rounded-xl shadow-lg border border-border py-1 w-36 overflow-hidden',
        isOwn ? 'right-0 bottom-full mb-1' : 'left-0 bottom-full mb-1',
      )}>
        {onDM && (
          <button onClick={onDM}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-brand hover:bg-brand/10 transition-colors">
            <MessageSquarePlus size={11} /> Message privately
          </button>
        )}
        <button onClick={handlePin} disabled={pinning}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-primary hover:bg-surface-3 transition-colors">
          <Pin size={11} /> {isPinned ? 'Unpin' : 'Pin message'}
        </button>
        <button onClick={handleDelete}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10 transition-colors">
          <Trash2 size={11} /> Delete
        </button>
      </div>
    </>
  )
}

// ── Announcement message ──────────────────────────────────────────────────────
function AnnouncementBubble({ message, isVendor, currentUserId, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)
  const isPinned = message.pinned
  const time = new Date(message.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="relative mx-2 my-3">
      <div className={cn(
        'rounded-2xl border-2 p-4',
        isPinned ? 'bg-amber-500/10 border-amber-500/30' : 'bg-violet-500/10 border-violet-500/20',
      )}>
        <div className="flex items-center gap-2 mb-2.5">
          <div className={cn(
            'w-7 h-7 rounded-xl flex items-center justify-center',
            isPinned ? 'bg-amber-500/20 text-amber-600' : 'bg-violet-500/20 text-violet-600',
          )}>
            {isPinned ? <Pin size={13} /> : <Megaphone size={13} />}
          </div>
          <span className={cn('text-xs font-bold', isPinned ? 'text-amber-600' : 'text-violet-600')}>
            {isPinned ? 'Pinned Announcement' : 'Announcement'}
          </span>
          <span className="text-[10px] text-muted ml-auto">{time}</span>
          {isVendor && (
            <div className="relative">
              <button onClick={() => setShowMenu(o => !o)}
                className="text-muted hover:text-primary transition-colors">
                <MoreHorizontal size={15} />
              </button>
              {showMenu && (
                <MessageMenu
                  messageId={message.id}
                  isPinned={isPinned}
                  isOwn
                  onDelete={onDelete}
                  onClose={() => setShowMenu(false)}
                />
              )}
            </div>
          )}
        </div>
        {/* Media */}
        {message.media_url && (
          <div className="mb-2">
            <MediaContent mediaUrl={message.media_url} mediaType={message.media_type} isOwn={false} />
          </div>
        )}
        {/* Product card */}
        {message.type === 'product' && message.content && (
          <div className="mb-2">
            <ProductCard content={message.content} isOwn={false} />
          </div>
        )}
        {/* Text (for non-product messages) */}
        {message.type !== 'product' && message.content && (
          <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}
        <ReactionBar reactions={message.reactions ?? []} messageId={message.id} currentUserId={currentUserId} />
      </div>
    </div>
  )
}

// ── Regular chat bubble ───────────────────────────────────────────────────────
export default function CircleMessageBubble({ message, isVendor, currentUserId, onDelete, onOpenDM }) {
  const [showMenu,  setShowMenu]  = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const supabase = createClient()

  const isAnnouncement = message.type === 'announcement'
  const isPoll         = message.type === 'poll'
  const isPinned       = message.pinned
  const sender         = message.sender
  const isOwn          = sender?.id === currentUserId
  const isProduct      = message.type === 'product'
  const time           = new Date(message.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })

  if (isPoll) {
    return (
      <PollBubble
        message={message}
        currentUserId={currentUserId}
        isVendor={isVendor}
      />
    )
  }

  if (isAnnouncement) {
    return (
      <AnnouncementBubble
        message={message}
        isVendor={isVendor}
        currentUserId={currentUserId}
        onDelete={onDelete}
      />
    )
  }

  const handleQuickReact = async (emoji) => {
    await supabase.from('reactions')
      .insert({ message_id: message.id, user_id: currentUserId, emoji })
      .then(() => {})
    setShowReactions(false)
  }

  return (
    <div className={cn(
      'flex items-end gap-2 px-4 py-1 group',
      isOwn && 'flex-row-reverse',
    )}>
      {/* Avatar (non-own only) */}
      {!isOwn && (
        <button
          onClick={() => onOpenDM?.(sender)}
          title={`Message ${sender?.full_name ?? 'user'} privately`}
          className="w-7 h-7 rounded-full bg-surface-3 overflow-hidden shrink-0 mb-0.5 hover:ring-2 hover:ring-brand hover:ring-offset-1 transition-all cursor-pointer"
        >
          {sender?.avatar_url
            ? <img src={sender.avatar_url} alt={sender.full_name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-muted text-[10px] font-bold">
                {sender?.full_name?.charAt(0) ?? '?'}
              </div>
          }
        </button>
      )}

      <div className={cn('max-w-[75%] space-y-0.5', isOwn && 'items-end flex flex-col')}>
        {/* Sender name */}
        {!isOwn && (
          <p className="text-[10px] text-muted font-bold px-1">{sender?.full_name}</p>
        )}

        {/* Bubble */}
        <div className="relative">
          <div className={cn(
            'rounded-2xl overflow-hidden',
            isProduct || message.media_url
              ? 'bg-transparent p-0'
              : isOwn
              ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white px-4 py-2.5 rounded-br-sm shadow-sm'
              : 'bg-surface-2 border border-border text-primary px-4 py-2.5 rounded-bl-sm shadow-sm',
          )}>
            {/* Product card */}
            {isProduct && <ProductCard content={message.content} isOwn={isOwn} />}

            {/* Media */}
            {!isProduct && message.media_url && (
              <div className={cn(isOwn && 'flex justify-end')}>
                <MediaContent mediaUrl={message.media_url} mediaType={message.media_type} isOwn={isOwn} />
              </div>
            )}

            {/* Text (for regular messages or media captions) */}
            {!isProduct && message.content && (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {message.content}
              </p>
            )}
          </div>

          {/* Hover action bar */}
          <div className={cn(
            'absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5',
            isOwn ? 'right-full pr-2' : 'left-full pl-2',
          )}>
            {/* Quick 6 reactions */}
            {EMOJI_REACTIONS.slice(0, 6).map(emoji => (
              <button key={emoji}
                onClick={() => handleQuickReact(emoji)}
                className="w-7 h-7 rounded-full bg-surface-2 border border-border text-sm hover:scale-125 transition-transform shadow-sm flex items-center justify-center">
                {emoji}
              </button>
            ))}
            {/* Vendor: menu */}
            {isVendor && (
              <div className="relative">
                <button onClick={() => setShowMenu(o => !o)}
                  className="w-7 h-7 rounded-full bg-surface-2 border border-border flex items-center justify-center text-muted hover:text-primary shadow-sm">
                  <MoreHorizontal size={13} />
                </button>
                {showMenu && (
                  <MessageMenu
                    messageId={message.id}
                    isPinned={isPinned}
                    isOwn={isOwn}
                    onDelete={onDelete}
                    onClose={() => setShowMenu(false)}
                    onDM={!isOwn && onOpenDM ? () => { onOpenDM(sender); setShowMenu(false) } : null}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reactions + time + pin indicator */}
        <div className={cn('px-1', isOwn && 'flex flex-col items-end')}>
          <ReactionBar
            reactions={message.reactions ?? []}
            messageId={message.id}
            currentUserId={currentUserId}
          />
          <div className={cn('flex items-center gap-1.5 mt-0.5', isOwn && 'flex-row-reverse')}>
            <span className="text-[10px] text-muted">{time}</span>
            {isPinned && <Pin size={9} className="text-amber-500" />}
          </div>
        </div>
      </div>
    </div>
  )
}