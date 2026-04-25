'use client'
// FILE: src/components/vendor/circles/CircleComposer.jsx

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Send, Megaphone, ImageIcon, Video, Music,
  ShoppingBag, Smile, Pin, X, Loader2,
  AlertCircle, Play, Package, ChevronDown,
  Mic, MicOff, StopCircle, Trash2 as TrashIcon, BarChart2,
} from 'lucide-react'
import { sendCircleMessage, sendBroadcast, getCircleProducts } from '@/lib/actions/circles'
import PollCreator from '@/components/vendor/circles/PollCreator'
import { createClient } from '@/lib/supabase/client'
import { cn }           from '@/utils/cn'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'

// ── Emoji data ────────────────────────────────────────────────────────────────
const EMOJI_CATEGORIES = [
  { label: 'Expressions', emojis: ['😀','😂','🤣','😍','🥰','😘','😊','🙂','😎','🤩','🥳','😏','😅','😭','😢','🤯'] },
  { label: 'Gestures',    emojis: ['👍','👎','👏','🙌','🤝','🤜','💪','🫶','🙏','✌️','🤞','👌','🤌','💅','🫵','☝️'] },
  { label: 'Hearts',      emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💕','💞','💓','💗','💖','💘','💝','❣️'] },
  { label: 'Reactions',   emojis: ['🔥','⚡','✨','💯','🎉','🥂','👀','💀','😱','🤔','🤷','💁','🫡','🫠','😴','🤮'] },
  { label: 'Commerce',    emojis: ['🛍️','💰','📦','🚀','⭐','🏆','🎯','💎','📣','🔔','✅','❌','⚠️','💡','🔑','🎁'] },
]

// ── File size limits ──────────────────────────────────────────────────────────
const LIMITS = {
  image: { max: 20 * 1024 * 1024, label: '20MB', accept: 'image/*' },
  video: { max: 200 * 1024 * 1024, label: '200MB', accept: 'video/mp4,video/webm,video/quicktime' },
  audio: { max: 50 * 1024 * 1024,  label: '50MB',  accept: 'audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm' },
}

async function uploadToStorage(file, circleId, folder) {
  const supabase = createClient()
  const ext  = file.name.split('.').pop() || 'bin'
  const path = `${folder}/${circleId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from('circle-media')
    .upload(path, file, { contentType: file.type, cacheControl: '3600' })

  if (error) throw new Error(error.message)

  const { data: { publicUrl } } = supabase.storage.from('circle-media').getPublicUrl(data.path)
  return publicUrl
}


// ── Voice recorder ────────────────────────────────────────────────────────────
function VoiceRecorder({ circleId, onRecorded, onClose }) {
  const [state,      setState]     = useState('idle')   // idle | requesting | recording | preview | uploading
  const [seconds,    setSeconds]   = useState(0)
  const [audioBlob,  setAudioBlob] = useState(null)
  const [previewUrl, setPreviewUrl]= useState(null)
  const [error,      setError]     = useState(null)

  const mediaRef   = useRef(null)
  const chunksRef  = useRef([])
  const streamRef  = useRef(null)
  const timerRef   = useRef(null)
  const MAX_SECS   = 120   // 2 minutes

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const startRecording = async () => {
    setState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setPreviewUrl(URL.createObjectURL(blob))
        setState('preview')
      }
      mr.start(100)
      mediaRef.current = mr
      setState('recording')
      setSeconds(0)

      timerRef.current = setInterval(() => {
        setSeconds(s => {
          if (s >= MAX_SECS - 1) { stopRecording(); return s }
          return s + 1
        })
      }, 1000)
    } catch {
      setError('Microphone access denied — please allow microphone permission')
      setState('idle')
    }
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    clearInterval(timerRef.current)
  }

  const handleDiscard = () => {
    setAudioBlob(null)
    setPreviewUrl(null)
    setState('idle')
    setSeconds(0)
  }

  const handleSend = async () => {
    if (!audioBlob) return
    setState('uploading')
    const supabase = createClient()
    const filename = `voice-${Date.now()}.webm`
    const path     = `audio/${circleId}/${filename}`

    const { data, error: upErr } = await supabase.storage
      .from('circle-media')
      .upload(path, audioBlob, { contentType: 'audio/webm', cacheControl: '3600' })

    if (upErr) {
      setError('Upload failed: ' + upErr.message)
      setState('preview')
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('circle-media').getPublicUrl(data.path)
    onRecorded({ url: publicUrl, type: 'audio/webm', duration: seconds })
  }

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    clearInterval(timerRef.current)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={e => { if (state !== 'recording' && state !== 'uploading') onClose() }}>
      <div className="w-full max-w-lg bg-surface-2 rounded-t-2xl shadow-2xl px-6 py-6 space-y-5"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="font-bold text-primary text-sm flex items-center gap-2">
            <Mic size={15} className="text-brand" /> Voice Message
          </p>
          {state !== 'recording' && state !== 'uploading' && (
            <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-danger/5 border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}

        {/* Idle */}
        {state === 'idle' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-20 h-20 rounded-full bg-brand/10 border-4 border-brand/20 flex items-center justify-center">
              <Mic size={32} className="text-brand" />
            </div>
            <p className="text-sm text-muted text-center">Tap to start recording your voice message</p>
            <button onClick={startRecording}
              className="flex items-center gap-2 px-8 py-3 bg-brand text-white font-bold rounded-2xl text-sm hover:bg-brand-700 transition-all shadow-brand active:scale-95">
              <Mic size={16} /> Start Recording
            </button>
          </div>
        )}

        {/* Requesting permission */}
        {state === 'requesting' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 size={32} className="text-brand animate-spin" />
            <p className="text-sm text-muted">Requesting microphone access…</p>
          </div>
        )}

        {/* Recording */}
        {state === 'recording' && (
          <div className="flex flex-col items-center gap-5 py-2">
            {/* Waveform animation */}
            <div className="flex items-center gap-1.5 h-12">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i}
                  className="w-1 rounded-full bg-brand animate-pulse"
                  style={{
                    height: `${20 + Math.sin(i * 0.8) * 16}px`,
                    animationDelay: `${i * 60}ms`,
                    animationDuration: `${600 + (i % 5) * 80}ms`,
                  }}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="flex flex-col items-center gap-1">
              <p className="font-mono text-3xl font-bold text-primary tabular-nums">{fmt(seconds)}</p>
              <p className="text-xs text-muted">Max {fmt(MAX_SECS)}</p>
            </div>

            {/* Stop button */}
            <button onClick={stopRecording}
              className="w-16 h-16 rounded-full bg-danger text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors active:scale-95">
              <StopCircle size={28} />
            </button>
            <p className="text-xs text-muted">Tap to stop</p>
          </div>
        )}

        {/* Preview */}
        {state === 'preview' && previewUrl && (
          <div className="space-y-4">
            {/* Audio player */}
            <div className="flex items-center gap-3 bg-brand/10 border border-brand/20 rounded-2xl px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center shrink-0">
                <Music size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-brand">Voice message</p>
                <p className="text-[10px] text-muted mt-0.5">{fmt(seconds)} · tap to play</p>
              </div>
              <audio src={previewUrl} controls className="h-8 accent-brand flex-1" style={{ minWidth: 120 }} />
            </div>

            <div className="flex gap-3">
              <button onClick={handleDiscard}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-semibold text-secondary hover:bg-surface-3 transition-all">
                <TrashIcon size={15} /> Discard
              </button>
              <button onClick={handleSend}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand hover:bg-brand-700 text-white font-bold text-sm transition-all shadow-brand active:scale-[0.98]">
                <Send size={15} /> Send Voice Message
              </button>
            </div>
          </div>
        )}

        {/* Uploading */}
        {state === 'uploading' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 size={28} className="text-brand animate-spin" />
            <p className="text-sm font-semibold text-brand">Sending voice message…</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Product picker sheet ───────────────────────────────────────────────────────
function ProductPickerSheet({ circleId, onPick, onClose }) {
  const currency = useLocaleStore(s => s.currency)
  const [products,  setProducts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')

  useEffect(() => {
    getCircleProducts().then(data => { setProducts(data ?? []); setLoading(false) })
  }, [])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-lg bg-surface-2 rounded-t-2xl shadow-2xl max-h-[70dvh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="font-bold text-primary text-sm flex items-center gap-2">
            <ShoppingBag size={15} className="text-brand" /> Share a Product
          </p>
          <button onClick={onClose} className="text-muted hover:text-primary"><X size={18} /></button>
        </div>
        <div className="px-4 py-3 border-b border-border">
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            className="w-full rounded-xl border border-border bg-surface-3 px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all text-primary"
          />
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-border/50 p-2">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="text-muted animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted">
              {search ? 'No products match' : 'No active products yet'}
            </div>
          ) : filtered.map(p => (
            <button key={p.id} onClick={() => onPick(p)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-brand/5 transition-colors text-left">
              <div className="w-12 h-12 rounded-xl bg-surface-3 border border-border/50 overflow-hidden shrink-0">
                {p.thumbnail_url
                  ? <img src={p.thumbnail_url} alt={p.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-muted"><Package size={16} /></div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary truncate">{p.name}</p>
                <p className="text-xs font-bold text-brand mt-0.5">{formatCurrency(p.price ?? 0, currency)}</p>
                {p.stock_quantity === 0 && (
                  <p className="text-[10px] text-danger font-semibold mt-0.5">Out of stock</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Media preview in composer ──────────────────────────────────────────────────
function MediaPreview({ mediaUrl, mediaType, onRemove }) {
  if (!mediaUrl) return null
  return (
    <div className="mx-4 mb-2 relative w-fit max-w-[200px]">
      {mediaType?.startsWith('image') ? (
        <img src={mediaUrl} alt="" className="h-24 max-w-[200px] rounded-xl object-cover border border-neutral-200 shadow-sm" />
      ) : mediaType?.startsWith('video') ? (
        <div className="relative h-24 w-36 rounded-xl overflow-hidden border border-border bg-black/40 shadow-sm">
          <video src={mediaUrl} className="w-full h-full object-cover opacity-70" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
              <Play size={14} className="text-brand-800 ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>
      ) : mediaType?.startsWith('audio') ? (
        <div className="h-12 px-4 rounded-xl bg-brand/10 border border-brand/20 flex items-center gap-2">
          <Music size={16} className="text-brand shrink-0" />
          <audio src={mediaUrl} controls className="h-8 w-36 accent-brand" />
        </div>
      ) : null}
      <button onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-danger text-white flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors">
        <X size={10} />
      </button>
    </div>
  )
}

// ── Product card preview in composer ──────────────────────────────────────────
function ProductPreview({ product, onRemove }) {
  const currency = useLocaleStore(s => s.currency)
  if (!product) return null
  return (
    <div className="mx-4 mb-2 relative">
      <div className="flex items-center gap-3 bg-brand/10 border border-brand/20 rounded-xl px-3 py-2.5 pr-8">
        <div className="w-10 h-10 rounded-lg bg-surface-2 border border-brand/20 overflow-hidden shrink-0">
          {product.thumbnail_url
            ? <img src={product.thumbnail_url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-muted"><Package size={12} /></div>
          }
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-primary truncate">{product.name}</p>
          <p className="text-xs font-bold text-brand">{formatCurrency(product.price ?? 0, currency)}</p>
        </div>
        <ShoppingBag size={13} className="text-brand shrink-0 ml-auto" />
      </div>
      <button onClick={onRemove}
        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-danger text-white flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors">
        <X size={10} />
      </button>
    </div>
  )
}

// ── Main composer ─────────────────────────────────────────────────────────────
export default function CircleComposer({ circleId, onSent, onTyping, disabled }) {
  const [mode,          setMode]          = useState('message')
  const [content,       setContent]       = useState('')
  const [pinned,        setPinned]        = useState(false)
  const [mediaUrl,      setMediaUrl]      = useState(null)
  const [mediaType,     setMediaType]     = useState(null)
  const [product,       setProduct]       = useState(null)   // selected product
  const [uploading,     setUploading]     = useState(false)
  const [uploadProgress,setProgress]      = useState(0)
  const [sending,       setSending]       = useState(false)
  const [error,         setError]         = useState(null)
  const [showEmoji,     setShowEmoji]     = useState(false)
  const [showProducts,  setShowProducts]  = useState(false)
  const [showVoiceRec,  setShowVoiceRec]  = useState(false)
  const [showPoll,      setShowPoll]      = useState(false)

  const textRef  = useRef(null)
  const imageRef = useRef(null)
  const videoRef = useRef(null)
  const audioRef = useRef(null)

  const clearMedia = () => {
    setMediaUrl(null)
    setMediaType(null)
    setProgress(0)
  }

  const handleUpload = async (file, folder) => {
    const limit = LIMITS[folder]
    if (file.size > limit.max) {
      setError(`${folder.charAt(0).toUpperCase() + folder.slice(1)} must be under ${limit.label}`)
      return
    }
    clearMedia()
    setProduct(null)
    setUploading(true)
    setError(null)

    // Fake progress
    const interval = setInterval(() => setProgress(p => Math.min(p + Math.random() * 20, 85)), 300)
    try {
      const url = await uploadToStorage(file, circleId, folder)
      clearInterval(interval)
      setProgress(100)
      setMediaUrl(url)
      setMediaType(file.type)
    } catch (e) {
      setError(e.message)
    } finally {
      clearInterval(interval)
      setUploading(false)
    }
  }


  const handleVoiceRecorded = ({ url, type, duration }) => {
    setMediaUrl(url)
    setMediaType(type)
    setProduct(null)
    setShowVoiceRec(false)
  }

  const handleProductPick = (p) => {
    setProduct(p)
    clearMedia()
    setShowProducts(false)
  }

  const handleSend = async () => {
    if ((!content.trim() && !mediaUrl && !product) || sending) return
    setSending(true)
    setError(null)

    let msgContent = content.trim()
    let msgMediaUrl  = mediaUrl
    let msgMediaType = mediaType
    let msgType      = 'text'

    // Product share: embed product as a special message type
    if (product) {
      msgType      = 'product'
      msgContent   = JSON.stringify({
        text:           content.trim() || null,
        product_id:     product.id,
        product_name:   product.name,
        product_price:  product.price,
        product_image:  product.thumbnail_url,
        product_sku:    product.sku,
      })
    } else if (mediaType?.startsWith('video')) {
      msgType = 'video'
    } else if (mediaType?.startsWith('audio')) {
      msgType = 'audio'
    } else if (mediaType?.startsWith('image')) {
      msgType = 'image'
    }

    const payload = {
      content:    msgContent,
      type:       msgType,
      media_url:  msgMediaUrl,
      media_type: msgMediaType,
    }

    const res = mode === 'broadcast'
      ? await sendBroadcast(circleId, { ...payload, pinned })
      : await sendCircleMessage(circleId, payload)

    setSending(false)
    if (res?.error) { setError(res.error); return }

    setContent('')
    clearMedia()
    setProduct(null)
    setPinned(false)
    textRef.current?.focus()
    onSent?.(res.data)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const addEmoji = (e) => {
    setContent(c => c + e)
    setShowEmoji(false)
    textRef.current?.focus()
  }

  const mediaButtons = [
    { key: 'image', icon: ImageIcon, label: 'Photo',   ref: imageRef, color: 'hover:text-blue-500',   title: 'Send image'  },
    { key: 'video', icon: Video,     label: 'Video',   ref: videoRef, color: 'hover:text-rose-500',   title: 'Send video'  },
    { key: 'audio', icon: Music,     label: 'Audio',   ref: audioRef, color: 'hover:text-emerald-500',title: 'Upload audio file' },
  ]

  return (
    <div className="border-t border-border bg-surface-2">

      {/* Mode toggle */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-1">
        <button onClick={() => setMode('message')}
          className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
            mode === 'message' ? 'bg-brand text-white shadow-sm' : 'text-muted hover:bg-surface-3')}>
          <Send size={11} /> Message
        </button>
        <button onClick={() => setMode('broadcast')}
          className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
            mode === 'broadcast' ? 'bg-violet-600 text-white shadow-sm' : 'text-muted hover:bg-surface-3')}>
          <Megaphone size={11} /> Broadcast
        </button>
        {mode === 'broadcast' && (
          <button onClick={() => setPinned(p => !p)}
            className={cn('ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
              pinned ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30' : 'text-muted/60 hover:bg-surface-3')}>
            <Pin size={11} /> {pinned ? 'Pinned' : 'Pin it'}
          </button>
        )}
      </div>

      {/* Broadcast info */}
      {mode === 'broadcast' && (
        <div className="mx-4 mb-1 px-3 py-2 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center gap-2 text-xs text-violet-600">
          <Megaphone size={12} className="shrink-0" />
          This will be sent as an announcement visible to all members
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="mx-4 mb-2 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Uploading…</span><span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-surface-3 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-brand rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Media preview */}
      <MediaPreview mediaUrl={mediaUrl} mediaType={mediaType} onRemove={clearMedia} />

      {/* Product preview */}
      <ProductPreview product={product} onRemove={() => setProduct(null)} />

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 flex items-center gap-2 text-xs text-danger bg-danger/5 border border-danger/20 rounded-xl px-3 py-2">
          <AlertCircle size={12} className="shrink-0" /> {error}
        </div>
      )}

      {/* Media type inputs (hidden) */}
      <input ref={imageRef} type="file" accept={LIMITS.image.accept} className="hidden"
        onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'image')} />
      <input ref={videoRef} type="file" accept={LIMITS.video.accept} className="hidden"
        onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'video')} />
      <input ref={audioRef} type="file" accept={LIMITS.audio.accept} className="hidden"
        onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'audio')} />

      {/* Input row */}
      <div className="flex items-end gap-2 px-4 pb-4 pt-1">

        {/* Attachment buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          {mediaButtons.map(({ key, icon: Icon, ref, color, title }) => (
            <button key={key}
              onClick={() => { ref.current?.click(); setError(null) }}
              disabled={disabled || uploading || !!product}
              title={title}
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center text-muted transition-all disabled:opacity-40',
                color,
                mediaType?.startsWith(key) ? 'bg-surface-3 text-brand' : 'hover:bg-surface-3',
              )}>
              <Icon size={16} />
            </button>
          ))}
          {/* Product share */}
          <button
            onClick={() => { setShowProducts(true); setError(null) }}
            disabled={disabled || uploading || !!mediaUrl}
            title="Share a product"
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-brand transition-all disabled:opacity-40',
              product ? 'bg-brand/10 text-brand' : 'hover:bg-surface-3',
            )}>
            <ShoppingBag size={16} />
          </button>

          {/* Voice record */}
          <button
            onClick={() => { setShowVoiceRec(true); setError(null) }}
            disabled={disabled || uploading || !!mediaUrl}
            title="Record voice message"
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-rose-500 transition-all disabled:opacity-40',
              showVoiceRec ? 'bg-rose-500/10 text-rose-500' : 'hover:bg-surface-3',
            )}>
            <Mic size={16} />
          </button>

          {/* Poll */}
          <button
            onClick={() => { setShowPoll(true); setError(null) }}
            disabled={disabled || uploading}
            title="Create a poll"
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-brand transition-all disabled:opacity-40',
              showPoll ? 'bg-brand/10 text-brand' : 'hover:bg-surface-3',
            )}>
            <BarChart2 size={16} />
          </button>
        </div>

        {/* Text area */}
        <div className="flex-1 relative">
          <textarea
            ref={textRef}
            rows={1}
            value={content}
            onChange={e => { setContent(e.target.value); onTyping?.() }}
            onKeyDown={handleKey}
            disabled={disabled || sending}
            placeholder={
              product              ? `Say something about ${product.name}…` :
              mode === 'broadcast' ? 'Write an announcement…' :
                                     'Write a message… (Enter to send)'
            }
            className={cn(
              'w-full rounded-2xl border bg-surface-3 px-4 py-2.5 pr-9 text-sm text-primary placeholder:text-muted',
              'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all',
              'resize-none max-h-32 overflow-y-auto scrollbar-none disabled:opacity-50',
              mode === 'broadcast' ? 'border-violet-500/30' : 'border-border',
            )}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
            }}
          />
          {/* Emoji trigger */}
          <button onClick={() => setShowEmoji(e => !e)}
            className="absolute right-3 bottom-2.5 text-neutral-400 hover:text-brand transition-colors">
            <Smile size={16} />
          </button>
          {/* Emoji picker */}
          {showEmoji && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowEmoji(false)} />
              <div className="absolute bottom-full right-0 mb-2 z-20 bg-surface-2 border border-border rounded-2xl shadow-xl p-3 w-80 max-h-72 overflow-y-auto scrollbar-none space-y-2">
                {EMOJI_CATEGORIES.map(cat => (
                  <div key={cat.label}>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wide mb-1 px-1">{cat.label}</p>
                    <div className="grid grid-cols-8 gap-0.5">
                      {cat.emojis.map(e => (
                        <button key={e} onClick={() => addEmoji(e)}
                          className="text-lg hover:scale-125 transition-transform w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-3">
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={(!content.trim() && !mediaUrl && !product) || sending || uploading || disabled}
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all active:scale-95 disabled:opacity-40 shrink-0',
            mode === 'broadcast'
              ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm'
              : 'bg-brand hover:bg-brand-700 text-white shadow-brand',
          )}>
          {sending
            ? <Loader2 size={16} className="animate-spin" />
            : mode === 'broadcast' ? <Megaphone size={16} /> : <Send size={16} />
          }
        </button>
      </div>

      {/* Product picker sheet */}
      {showProducts && (
        <ProductPickerSheet
          circleId={circleId}
          onPick={handleProductPick}
          onClose={() => setShowProducts(false)}
        />
      )}

      {/* Voice recorder */}
      {showVoiceRec && (
        <VoiceRecorder
          circleId={circleId}
          onRecorded={handleVoiceRecorded}
          onClose={() => setShowVoiceRec(false)}
        />
      )}

      {/* Poll creator */}
      {showPoll && (
        <PollCreator
          circleId={circleId}
          onSent={onSent}
          onClose={() => setShowPoll(false)}
        />
      )}
    </div>
  )
}