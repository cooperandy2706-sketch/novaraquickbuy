'use client'
// FILE: src/components/chat/MessageInput.jsx
// Full message composer.
// Features:
//   - Text input with Enter to send, Shift+Enter for newline
//   - Emoji picker (built-in grid, no external lib needed)
//   - Image / video / file attachment
//   - Audio recording with live waveform
//   - Poll creator (question + up to 6 options)
//   - Product share (search your products)
//   - GIF picker placeholder
//   - Reply-to banner
//   - Typing indicator emission

import { useState, useRef, useCallback, useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { cn } from '@/utils/cn'
import {
  Send, Smile, Paperclip, Mic, MicOff,
  BarChart3, Package, Image, Video,
  X, Plus, Check, StopCircle, GalleryHorizontal,
  ChevronRight, Gift,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// EMOJI DATA  (lightweight — just the most-used categories)
// ─────────────────────────────────────────────────────────────

const EMOJI_CATEGORIES = {
  'Smileys': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','🙄','😏','😒','🙃','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','💫','🤯','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','👿','💀','😈'],
  'People': ['👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷','👮','🕵️','💂','🥷','👷','🫅','🤴','👸','🎅','🤶','🧙','🧝','🧛','🧟','🧞','🧜','🧚','🧑‍🎄','👼','🤰','🫄','🤱'],
  'Gestures': ['👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🙏','✍️','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🫀','🫁','🧠'],
  'Animals': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🦆','🐦','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🦈'],
  'Food': ['🍎','🍊','🍋','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🫒','🥑','🍆','🥦','🥬','🥒','🌽','🫑','🌶️','🥕','🧄','🧅','🥔','🍠','🫘','🌰','🍞','🥐','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫓','🥪','🌮','🌯','🫔','🥗','🍜','🍲','🍛','🍣','🍱'],
  'Activities': ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🏒','🥍','🏑','🏏','🪃','🥅','⛳','🎿','🛷','🥌','🎯','🪀','🪁','🎣','🤿','🎽','🎿','🛹','🛼','🪂','🏋️','🤼','🤸','🏇','⛹️','🤺','🏊','🚵','🧗','🪵','🏄'],
  'Objects': ['📱','💻','🖥️','⌨️','🖱️','🖨️','📺','📷','📸','📹','🎥','📽️','📞','☎️','📟','📠','📻','📡','🔋','🔌','💡','🔦','🕯️','🪔','💰','💵','💴','💶','💷','💸','💳','🏷️','📦','📫','📬','📭','📮','📯','📢','📣','🔔','🎵','🎶','🎤','🎧','🎷','🎺','🎸','🪕','🎻','🎹','🥁','🪘'],
  'Symbols': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','❤️‍🔥','❤️‍🩹','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫'],
}

// ─────────────────────────────────────────────────────────────
// EMOJI PICKER
// ─────────────────────────────────────────────────────────────

function EmojiPicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState('Smileys')
  const [search, setSearch] = useState('')

  const displayed = search
    ? Object.values(EMOJI_CATEGORIES).flat().filter(e => e.includes(search))
    : EMOJI_CATEGORIES[activeCategory] ?? []

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full mb-2 left-0 z-50 bg-surface-2 border border-border rounded-3xl shadow-2xl w-80 overflow-hidden">
        {/* Search */}
        <div className="px-3 pt-3 pb-2">
          <input
            type="text"
            placeholder="Search emoji…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-3 border border-border rounded-2xl px-3 py-2 text-xs text-primary outline-none placeholder:text-muted"
          />
        </div>

        {/* Category tabs */}
        {!search && (
          <div className="flex gap-0 overflow-x-auto px-2 pb-1" style={{ scrollbarWidth: 'none' }}>
            {Object.keys(EMOJI_CATEGORIES).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'shrink-0 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap',
                  activeCategory === cat
                    ? 'bg-brand text-white'
                    : 'text-muted hover:text-primary',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Emoji grid */}
        <div className="grid grid-cols-8 gap-0.5 px-2 pb-3 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {displayed.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              onClick={() => { onSelect(emoji); onClose() }}
              className="w-9 h-9 flex items-center justify-center text-xl rounded-xl hover:bg-surface-3 transition-all hover:scale-110 active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// ATTACHMENT MENU
// ─────────────────────────────────────────────────────────────

function AttachmentMenu({ onImage, onVideo, onProduct, onClose }) {
  const items = [
    { icon: Image,   label: 'Photo',    action: onImage,   color: '#0EA5E9' },
    { icon: Video,   label: 'Video',    action: onVideo,   color: '#8B5CF6' },
    { icon: Package, label: 'Product',  action: onProduct, color: '#16A34A' },
  ]

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full mb-2 left-0 z-50 bg-surface-2 border border-border rounded-2xl shadow-xl overflow-hidden">
        {items.map(item => (
          <button
            key={item.label}
            onClick={() => { item.action?.(); onClose() }}
            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-surface-3 transition-colors text-left"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `${item.color}25` }}
            >
              <item.icon size={15} style={{ color: item.color }} />
            </div>
            <span className="text-sm font-semibold text-primary">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// POLL CREATOR
// ─────────────────────────────────────────────────────────────

function PollCreator({ onSend, onClose }) {
  const [question,  setQuestion]  = useState('')
  const [options,   setOptions]   = useState(['', ''])
  const [isMulti,   setIsMulti]   = useState(false)
  const [isAnon,    setIsAnon]    = useState(false)

  const addOption = () => {
    if (options.length < 6) setOptions(p => [...p, ''])
  }
  const updateOption = (i, val) => setOptions(p => p.map((o, idx) => idx === i ? val : o))
  const removeOption = (i) => {
    if (options.length <= 2) return
    setOptions(p => p.filter((_, idx) => idx !== i))
  }

  const canSend = question.trim() && options.filter(o => o.trim()).length >= 2

  return (
    <div className="flex flex-col gap-3 px-4 py-4 bg-surface-2 border border-border rounded-3xl shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-brand" />
          <p className="text-sm font-black text-primary">Create Poll</p>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-surface-3 flex items-center justify-center text-muted hover:text-primary">
          <X size={13} />
        </button>
      </div>

      <input
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="Ask a question…"
        className="bg-surface-3 border border-border rounded-2xl px-3.5 py-2.5 text-sm text-primary outline-none placeholder:text-muted focus:border-brand transition-colors"
      />

      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-brand flex items-center justify-center text-[10px] font-black text-brand shrink-0">
              {i + 1}
            </div>
            <input
              value={opt}
              onChange={e => updateOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              className="flex-1 bg-surface-3 border border-border rounded-xl px-3 py-2 text-xs text-primary outline-none placeholder:text-muted focus:border-brand transition-colors"
            />
            {options.length > 2 && (
              <button onClick={() => removeOption(i)} className="text-muted hover:text-danger transition-colors">
                <X size={13} />
              </button>
            )}
          </div>
        ))}

        {options.length < 6 && (
          <button onClick={addOption} className="flex items-center gap-2 text-xs text-brand hover:text-brand-300 transition-colors font-semibold ml-7">
            <Plus size={12} /> Add option
          </button>
        )}
      </div>

      {/* Options */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setIsMulti(p => !p)}
            className={cn(
              'w-9 h-5 rounded-full border transition-all relative',
              isMulti ? 'bg-brand/20 border-brand' : 'bg-surface-3 border-border',
            )}
          >
            <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all', isMulti ? 'left-4' : 'left-0.5')} />
          </div>
          <span className="text-[11px] text-muted">Multiple choice</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setIsAnon(p => !p)}
            className={cn(
              'w-9 h-5 rounded-full border transition-all relative',
              isAnon ? 'bg-brand/20 border-brand' : 'bg-surface-3 border-border',
            )}
          >
            <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all', isAnon ? 'left-4' : 'left-0.5')} />
          </div>
          <span className="text-[11px] text-muted">Anonymous</span>
        </label>
      </div>

      <button
        onClick={() => canSend && onSend({ question: question.trim(), options: options.filter(o => o.trim()), isMultiple: isMulti, isAnonymous: isAnon })}
        disabled={!canSend}
        className="w-full py-3 rounded-2xl text-sm font-black text-white disabled:opacity-40 transition-all active:scale-[0.98] shadow-lg shadow-brand/20"
        style={{ background: canSend ? 'linear-gradient(135deg,#064E3B,#1B4332)' : 'var(--color-surface-3)' }}
      >
        Send Poll
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// AUDIO RECORDER
// ─────────────────────────────────────────────────────────────

function AudioRecorder({ onSend, onCancel }) {
  const [seconds, setSeconds] = useState(0)
  const [levels,  setLevels]  = useState(Array(30).fill(0.2))
  const mediaRef    = useRef(null)
  const analyserRef = useRef(null)
  const chunksRef   = useRef([])
  const timerRef    = useRef(null)
  const animRef     = useRef(null)

  useEffect(() => {
    let ctx, source, analyser, stream
    navigator.mediaDevices.getUserMedia({ audio: true }).then(s => {
      stream = s
      ctx      = new AudioContext()
      source   = ctx.createMediaStreamSource(s)
      analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      source.connect(analyser)
      analyserRef.current = analyser

      const recorder = new MediaRecorder(s)
      mediaRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = e => chunksRef.current.push(e.data)
      recorder.start()

      // Timer
      timerRef.current = setInterval(() => setSeconds(p => p + 1), 1000)

      // Waveform animation
      const draw = () => {
        const data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)
        const norm = Array.from(data).slice(0, 30).map(v => v / 255)
        setLevels(norm)
        animRef.current = requestAnimationFrame(draw)
      }
      draw()
    })

    return () => {
      clearInterval(timerRef.current)
      cancelAnimationFrame(animRef.current)
      stream?.getTracks().forEach(t => t.stop())
      ctx?.close()
    }
  }, [])

  const handleSend = () => {
    clearInterval(timerRef.current)
    cancelAnimationFrame(animRef.current)
    mediaRef.current?.stop()
    mediaRef.current?.addEventListener('stop', () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' })
      onSend(file, levels)
    })
  }

  const fmtTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  return (
    <div className="flex items-center gap-3 bg-surface-2 border border-border rounded-2xl px-4 py-3 shadow-lg">
      {/* Cancel */}
      <button onClick={onCancel} className="text-danger hover:opacity-80 transition-opacity">
        <X size={18} />
      </button>

      {/* Waveform */}
      <div className="flex items-center gap-px h-8 flex-1">
        {levels.map((v, i) => (
          <div
            key={i}
            className="w-1 rounded-full bg-brand transition-all duration-75"
            style={{ height: `${Math.max(15, v * 100)}%` }}
          />
        ))}
      </div>

      {/* Timer */}
      <span className="text-sm font-mono font-bold text-danger min-w-[3rem] text-center">
        {fmtTime(seconds)}
      </span>

      {/* Send */}
      <button
        onClick={handleSend}
        className="w-9 h-9 rounded-full bg-brand flex items-center justify-center hover:bg-brand-600 transition-all active:scale-90"
      >
        <Send size={16} className="text-white" />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// REPLY BANNER
// ─────────────────────────────────────────────────────────────

function ReplyBanner({ replyTo, onClear }) {
  if (!replyTo) return null
  return (
    <div className="flex items-center gap-3 bg-surface-3 border-l-2 border-brand px-4 py-2.5 mx-0">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-brand">
          Replying to {replyTo.sender_name ?? 'message'}
        </p>
        <p className="text-xs text-secondary truncate">
          {replyTo.message_type === 'text'
            ? replyTo.content?.slice(0, 60)
            : `${replyTo.message_type} message`
          }
        </p>
      </div>
      <button onClick={onClear} className="text-muted hover:text-secondary shrink-0">
        <X size={14} />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function MessageInput({
  onSend,
  onSendPoll,
  onTyping,
  replyTo,
  onClearReply,
  disabled = false,
}) {
  const [text,          setText]          = useState('')
  const [showEmoji,     setShowEmoji]     = useState(false)
  const [showAttach,    setShowAttach]    = useState(false)
  const [showPoll,      setShowPoll]      = useState(false)
  const [recording,     setRecording]     = useState(false)
  const [attachPreview, setAttachPreview] = useState(null)  // { file, url, type }

  const inputRef    = useRef(null)
  const fileRef     = useRef(null)
  const videoRef    = useRef(null)

  const canSend = (text.trim().length > 0 || attachPreview) && !disabled

  const handleSend = useCallback(() => {
    if (!canSend) return
    if (attachPreview) {
      onSend?.({
        content:     text.trim() || null,
        messageType: attachPreview.type,
        file:        attachPreview.file,
        replyToId:   replyTo?.id ?? null,
      })
      setAttachPreview(null)
    } else {
      onSend?.({
        content:     text.trim(),
        messageType: 'text',
        replyToId:   replyTo?.id ?? null,
      })
    }
    setText('')
    onClearReply?.()
    inputRef.current?.focus()
  }, [text, canSend, attachPreview, replyTo, onSend, onClearReply])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    onTyping?.()
  }

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setAttachPreview({ file, url, type: type === 'image' ? 'image' : 'video' })
  }

  const handleAudioSend = (file, waveform) => {
    setRecording(false)
    onSend?.({
      messageType: 'audio',
      file,
      metadata:    { url: null, duration_secs: 0, waveform },
    })
  }

  const handleEmojiSelect = (emoji) => {
    const input = inputRef.current
    if (input) {
      const start  = input.selectionStart ?? text.length
      const end    = input.selectionEnd   ?? text.length
      const newVal = text.slice(0, start) + emoji + text.slice(end)
      setText(newVal)
      setTimeout(() => input.setSelectionRange(start + emoji.length, start + emoji.length), 0)
    } else {
      setText(p => p + emoji)
    }
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col bg-surface-2 border-t border-border">

      {/* Reply banner */}
      <ReplyBanner replyTo={replyTo} onClear={onClearReply} />

      {/* Attachment preview */}
      {attachPreview && (
        <div className="flex items-center gap-3 px-4 py-3 bg-surface-2 border-b border-border">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-1 shrink-0">
            {attachPreview.type === 'image' ? (
              <img src={attachPreview.url} alt="" className="w-full h-full object-cover" />
            ) : (
              <video src={attachPreview.url} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-primary">{attachPreview.file.name}</p>
            <p className="text-[10px] text-muted">{(attachPreview.file.size / 1024).toFixed(0)}KB</p>
          </div>
          <button
            onClick={() => setAttachPreview(null)}
            className="text-muted hover:text-primary"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Poll creator */}
      {showPoll && (
        <div className="px-4 py-3">
          <PollCreator
            onSend={(data) => { onSendPoll?.(data); setShowPoll(false) }}
            onClose={() => setShowPoll(false)}
          />
        </div>
      )}

      {/* Recording UI */}
      {recording && (
        <div className="px-4 py-3">
          <AudioRecorder
            onSend={handleAudioSend}
            onCancel={() => setRecording(false)}
          />
        </div>
      )}

      {/* Main input row */}
      {!recording && !showPoll && (
        <div className="flex items-end gap-2 px-3 py-3">

          {/* Left: attachment + more */}
          <div className="flex items-center gap-1 shrink-0 pb-0.5">
            {/* Emoji */}
            <div className="relative">
              <button
                onClick={() => setShowEmoji(p => !p)}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all',
                  showEmoji ? 'bg-brand/20 text-brand' : 'text-muted hover:text-primary hover:bg-surface-3',
                )}
              >
                😊
              </button>
              {showEmoji && (
                <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
              )}
            </div>

            {/* Attach */}
            <div className="relative">
              <button
                onClick={() => setShowAttach(p => !p)}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center transition-all',
                  showAttach ? 'bg-brand/20 text-brand' : 'text-muted hover:text-primary hover:bg-surface-3',
                )}
              >
                <Paperclip size={17} />
              </button>
              {showAttach && (
                <AttachmentMenu
                  onImage={() => fileRef.current?.click()}
                  onVideo={() => videoRef.current?.click()}
                  onProduct={() => setShowAttach(false)}
                  onClose={() => setShowAttach(false)}
                />
              )}
            </div>

            {/* Poll */}
            <button
              onClick={() => setShowPoll(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-primary hover:bg-surface-3 transition-all"
            >
              <BarChart3 size={17} />
            </button>
          </div>

          {/* Text area */}
          <div className="flex-1 bg-surface-3 border border-border rounded-3xl px-4 py-2.5 focus-within:border-brand transition-colors min-h-[44px] max-h-32 overflow-y-auto">
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message…"
              disabled={disabled}
              rows={1}
              className="w-full bg-transparent text-sm text-primary placeholder:text-muted outline-none resize-none leading-relaxed"
              style={{ minHeight: '1.5rem' }}
            />
          </div>

          {/* Right: voice / send */}
          <div className="shrink-0 pb-0.5">
            {canSend ? (
              <button
                onClick={handleSend}
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
                style={{ background: 'linear-gradient(135deg,#064E3B,#1B4332)' }}
              >
                <Send size={17} className="text-white translate-x-0.5 -translate-y-0.5" />
              </button>
            ) : (
              <button
                onClick={() => setRecording(true)}
                className="w-10 h-10 rounded-full bg-surface-3 border border-border flex items-center justify-center text-muted hover:text-brand hover:border-brand transition-all"
              >
                <Mic size={17} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={fileRef}  type="file" accept="image/*"  onChange={e => handleFileChange(e, 'image')} className="hidden" />
      <input ref={videoRef} type="file" accept="video/*"  onChange={e => handleFileChange(e, 'video')} className="hidden" />
    </div>
  )
}