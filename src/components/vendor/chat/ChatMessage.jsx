'use client'
// FILE: src/components/vendor/chat/ChatMessage.jsx

import { useState }  from 'react'
import {
  Trash2, MoreHorizontal,
  Play, Music, ExternalLink, Check, CheckCheck,
} from 'lucide-react'
import { deleteDMMessage } from '@/lib/actions/directMessages'
import { cn }              from '@/utils/cn'

function MediaBlock({ url, type, isOwn }) {
  if (!url) return null

  if (type?.startsWith('image')) return (
    <img src={url} alt="attachment"
      onClick={() => window.open(url, '_blank')}
      className="max-w-[260px] max-h-60 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity border border-black/10" />
  )

  if (type?.startsWith('video')) return (
    <div className="relative max-w-[260px] rounded-xl overflow-hidden bg-black border border-black/10">
      <video src={url} controls className="w-full max-h-52 object-contain" preload="metadata" />
    </div>
  )

  if (type?.startsWith('audio')) return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl border max-w-[260px]',
      isOwn ? 'bg-white/15 border-white/20' : 'bg-neutral-50 border-neutral-200',
    )}>
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0',
        isOwn ? 'bg-white/20' : 'bg-brand-50')}>
        <Music size={14} className={isOwn ? 'text-white' : 'text-brand'} />
      </div>
      <audio src={url} controls className="h-8 accent-brand flex-1" style={{ minWidth: 130 }} />
    </div>
  )

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold',
        isOwn
          ? 'bg-white/15 border-white/20 text-white hover:bg-white/25'
          : 'bg-neutral-50 border-neutral-200 text-brand-800 hover:bg-brand-50',
      )}>
      <ExternalLink size={13} /> View file
    </a>
  )
}

function ReadStatus({ message, isOwn }) {
  if (!isOwn) return null
  return message.read
    ? <CheckCheck size={11} className="text-blue-300 shrink-0" />
    : <Check      size={11} className="text-white/50 shrink-0" />
}

export default function ChatMessage({ message, currentUserId, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)

  const isOwn  = message.sender_id === currentUserId
  const sender = message.sender
  const time   = new Date(message.created_at).toLocaleTimeString('en', {
    hour: '2-digit', minute: '2-digit',
  })

  const handleDelete = async () => {
    if (!confirm('Delete this message?')) return
    setShowMenu(false)
    await deleteDMMessage(message.id)
    onDelete?.(message.id)
  }

  return (
    <div className={cn(
      'flex items-end gap-2 px-4 py-1 group',
      isOwn && 'flex-row-reverse',
    )}>
      {/* Other person's avatar */}
      {!isOwn && (
        <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-200 shrink-0 mb-0.5">
          {sender?.avatar_url
            ? <img src={sender.avatar_url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-neutral-500">
                {sender?.full_name?.charAt(0) ?? '?'}
              </div>
          }
        </div>
      )}

      <div className={cn('max-w-[72%] space-y-0.5', isOwn ? 'items-end flex flex-col' : '')}>
        {/* Bubble */}
        <div className="relative group/bubble">
          <div className={cn(
            'rounded-2xl overflow-hidden',
            message.media_url && !message.content
              ? 'bg-transparent'
              : isOwn
                ? 'bg-brand text-white px-4 py-2.5 rounded-br-sm'
                : 'bg-white border border-neutral-200 text-brand-900 px-4 py-2.5 rounded-bl-sm shadow-sm',
          )}>
            {/* Media */}
            {message.media_url && (
              <div className={cn('mb-1', message.content ? '-mx-1 mt-0.5' : '')}>
                <MediaBlock url={message.media_url} type={message.media_type} isOwn={isOwn} />
              </div>
            )}
            {/* Text */}
            {message.content && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
            {/* Optimistic indicator */}
            {message._optimistic && (
              <p className="text-[10px] opacity-50 mt-0.5">Sending…</p>
            )}
          </div>

          {/* Delete button on own message hover */}
          {isOwn && (
            <div className="absolute top-0 right-full pr-2 opacity-0 group-hover/bubble:opacity-100 transition-opacity">
              <div className="relative">
                <button onClick={() => setShowMenu(o => !o)}
                  className="w-6 h-6 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200 transition-all">
                  <MoreHorizontal size={12} />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 bottom-full mb-1 z-20 bg-white rounded-xl shadow-lg border border-neutral-200 py-1 w-32 overflow-hidden">
                      <button onClick={handleDelete}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-danger hover:bg-danger/5 transition-colors">
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Time + read status */}
        <div className={cn(
          'flex items-center gap-1 px-1',
          isOwn ? 'flex-row-reverse' : '',
        )}>
          <span className="text-[10px] text-neutral-400">{time}</span>
          <ReadStatus message={message} isOwn={isOwn} />
        </div>
      </div>
    </div>
  )
}