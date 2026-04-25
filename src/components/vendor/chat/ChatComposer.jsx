'use client'
// FILE: src/components/vendor/chat/ChatComposer.jsx

import { useState, useRef, useCallback } from 'react'
import {
  Send, ImageIcon, Video, Music,
  Smile, X, Loader2, AlertCircle,
  Mic, StopCircle,
} from 'lucide-react'
import { sendDM }       from '@/lib/actions/directMessages'
import { createClient } from '@/lib/supabase/client'
import { cn }           from '@/utils/cn'

const EMOJI_QUICK = ['👍','❤️','😂','😮','🔥','🎉','✅','💯','🙏','😍','💪','🤝']

const LIMITS = {
  image: { max: 20 * 1024 * 1024,  accept: 'image/*'  },
  video: { max: 200 * 1024 * 1024, accept: 'video/mp4,video/webm,video/quicktime' },
  audio: { max: 50 * 1024 * 1024,  accept: 'audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm' },
}

async function uploadFile(file, folder, threadId) {
  const supabase = createClient()
  const ext  = file.name.split('.').pop() || 'bin'
  const path = `dm/${threadId}/${folder}/${Date.now()}.${ext}`
  const { data, error } = await supabase.storage
    .from('dm-media')
    .upload(path, file, { contentType: file.type, cacheControl: '3600' })
  if (error) throw new Error(error.message)
  const { data: { publicUrl } } = supabase.storage.from('dm-media').getPublicUrl(data.path)
  return { url: publicUrl, type: file.type }
}

// ── Voice recorder bar ────────────────────────────────────────────────────────
function VoiceBar({ threadId, onSent, onCancel }) {
  const [state,    setState]   = useState('idle')  // idle|recording|preview|uploading
  const [seconds,  setSeconds] = useState(0)
  const [blobUrl,  setBlobUrl] = useState(null)
  const [error,    setError]   = useState(null)

  const mediaRef  = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef  = useRef(null)
  const MAX       = 120

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const start = async () => {
    setState('recording')
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setBlobUrl(URL.createObjectURL(blob))
        setState('preview')
      }
      mr.start(100)
      mediaRef.current = mr
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => {
        if (s >= MAX - 1) { stop(); return s }
        return s + 1
      }), 1000)
    } catch {
      setError('Microphone access denied')
      setState('idle')
    }
  }

  const stop = () => {
    mediaRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    clearInterval(timerRef.current)
  }

  const send = async () => {
    setState('uploading')
    const supabase = createClient()
    const blob     = new Blob(chunksRef.current, { type: 'audio/webm' })
    const path     = `dm/${threadId}/audio/${Date.now()}.webm`
    const { data, error: upErr } = await supabase.storage
      .from('dm-media').upload(path, blob, { contentType: 'audio/webm' })
    if (upErr) { setError(upErr.message); setState('preview'); return }
    const { data: { publicUrl } } = supabase.storage.from('dm-media').getPublicUrl(data.path)
    await onSent(null, publicUrl, 'audio/webm')
    onCancel()
  }

  // Auto-start on mount
  const started = useRef(false)
  if (!started.current) { started.current = true; setTimeout(start, 50) }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-rose-50 border-t border-rose-200">
      {state === 'recording' && (
        <>
          <div className="flex items-center gap-1.5 flex-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <div className="flex items-end gap-0.5 h-6">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="w-0.5 rounded-full bg-red-400 animate-pulse"
                  style={{ height: `${8 + Math.sin(i * 0.6) * 8}px`, animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
            <span className="font-mono text-sm font-bold text-red-700 ml-2 tabular-nums">{fmt(seconds)}</span>
          </div>
          <button onClick={stop}
            className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors active:scale-95">
            <StopCircle size={18} />
          </button>
          <button onClick={onCancel} className="text-neutral-500 hover:text-neutral-700 transition-colors">
            <X size={18} />
          </button>
        </>
      )}
      {state === 'preview' && (
        <>
          <Music size={16} className="text-brand shrink-0" />
          <audio src={blobUrl} controls className="flex-1 h-8 accent-brand" />
          <span className="text-xs text-neutral-500 font-mono shrink-0">{fmt(seconds)}</span>
          <button onClick={send}
            className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center hover:bg-brand-700 transition-colors active:scale-95 shadow-brand shrink-0">
            <Send size={15} />
          </button>
          <button onClick={onCancel} className="text-neutral-500 hover:text-danger transition-colors">
            <X size={16} />
          </button>
        </>
      )}
      {state === 'uploading' && (
        <div className="flex items-center gap-2 flex-1">
          <Loader2 size={15} className="text-brand animate-spin" />
          <span className="text-sm text-neutral-600">Sending voice message…</span>
        </div>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

// ── Main composer ─────────────────────────────────────────────────────────────
export default function ChatComposer({ threadId, onSent, onTyping, disabled }) {
  const [content,   setContent]   = useState('')
  const [mediaUrl,  setMediaUrl]  = useState(null)
  const [mediaType, setMediaType] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [sending,   setSending]   = useState(false)
  const [error,     setError]     = useState(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showVoice, setShowVoice] = useState(false)

  const textRef  = useRef(null)
  const imageRef = useRef(null)
  const videoRef = useRef(null)
  const audioRef = useRef(null)

  const handleUpload = async (file, folder) => {
    const limit = LIMITS[folder]
    if (file.size > limit.max) { setError(`File too large`); return }
    setUploading(true); setProgress(0); setError(null)
    const interval = setInterval(() => setProgress(p => Math.min(p + 15, 85)), 300)
    try {
      const { url, type } = await uploadFile(file, folder, threadId)
      clearInterval(interval)
      setProgress(100)
      setMediaUrl(url)
      setMediaType(type)
    } catch (e) {
      setError(e.message)
    } finally {
      clearInterval(interval)
      setUploading(false)
    }
  }

  const clearMedia = () => { setMediaUrl(null); setMediaType(null); setProgress(0) }

  const handleSend = useCallback(async (text = content, mUrl = mediaUrl, mType = mediaType) => {
    if ((!text?.trim() && !mUrl) || sending) return
    setSending(true); setError(null)
    const res = await sendDM(threadId, text ?? '', mUrl, mType)
    setSending(false)
    if (res?.error) { setError(res.error); return }
    setContent(''); clearMedia()
    textRef.current?.focus()
    onSent?.(res.data)
    // Reset textarea height
    if (textRef.current) { textRef.current.style.height = 'auto' }
  }, [content, mediaUrl, mediaType, sending, threadId])

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const addEmoji = (e) => {
    setContent(c => c + e); setShowEmoji(false); textRef.current?.focus()
  }

  if (showVoice) {
    return (
      <VoiceBar
        threadId={threadId}
        onSent={handleSend}
        onCancel={() => setShowVoice(false)}
      />
    )
  }

  return (
    <div className="border-t border-neutral-200 bg-white">
      {/* Upload progress */}
      {uploading && (
        <div className="px-4 pt-2">
          <div className="flex justify-between text-xs text-neutral-500 mb-1">
            <span>Uploading…</span><span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-1 overflow-hidden">
            <div className="h-full bg-brand rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Media preview */}
      {mediaUrl && (
        <div className="px-4 pt-2 relative w-fit">
          {mediaType?.startsWith('image') ? (
            <img src={mediaUrl} alt="" className="h-20 rounded-xl border border-neutral-200 object-cover" />
          ) : mediaType?.startsWith('video') ? (
            <div className="relative h-20 w-28 rounded-xl bg-neutral-900 overflow-hidden border border-neutral-200">
              <video src={mediaUrl} className="w-full h-full object-cover opacity-70" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center">
                  <Video size={12} className="text-brand-800" />
                </div>
              </div>
            </div>
          ) : mediaType?.startsWith('audio') ? (
            <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-3 py-2">
              <Music size={14} className="text-brand" />
              <audio src={mediaUrl} controls className="h-7 w-36 accent-brand" />
            </div>
          ) : null}
          <button onClick={clearMedia}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-danger text-white flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors">
            <X size={10} />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 mt-2 flex items-center gap-2 text-xs text-danger bg-danger/5 border border-danger/20 rounded-xl px-3 py-2">
          <AlertCircle size={11} className="shrink-0" /> {error}
        </div>
      )}

      {/* Emoji quick bar (when open) */}
      {showEmoji && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowEmoji(false)} />
          <div className="relative z-20 px-4 pt-3 pb-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {EMOJI_QUICK.map(e => (
                <button key={e} onClick={() => addEmoji(e)}
                  className="text-xl hover:scale-125 transition-transform w-9 h-9 flex items-center justify-center rounded-xl hover:bg-neutral-100">
                  {e}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 px-4 py-3">
        {/* Hidden file inputs */}
        <input ref={imageRef} type="file" accept={LIMITS.image.accept} className="hidden"
          onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'image')} />
        <input ref={videoRef} type="file" accept={LIMITS.video.accept} className="hidden"
          onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'video')} />
        <input ref={audioRef} type="file" accept={LIMITS.audio.accept} className="hidden"
          onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'audio')} />

        {/* Attachment buttons */}
        <div className="flex items-center gap-0.5 pb-0.5 shrink-0">
          {[
            { ref: imageRef, icon: ImageIcon, title: 'Photo',       color: 'hover:text-blue-500'     },
            { ref: videoRef, icon: Video,     title: 'Video',       color: 'hover:text-rose-500'     },
            { ref: audioRef, icon: Music,     title: 'Audio file',  color: 'hover:text-emerald-500'  },
          ].map(({ ref, icon: Icon, title, color }) => (
            <button key={title}
              onClick={() => { ref.current?.click(); setError(null) }}
              disabled={disabled || uploading || !!mediaUrl}
              title={title}
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 transition-all disabled:opacity-40',
                color, 'hover:bg-neutral-100',
              )}>
              <Icon size={16} />
            </button>
          ))}
          {/* Voice record */}
          <button
            onClick={() => { setShowVoice(true); setError(null) }}
            disabled={disabled || uploading || !!mediaUrl}
            title="Voice message"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 transition-all disabled:opacity-40">
            <Mic size={16} />
          </button>
          {/* Emoji */}
          <button
            onClick={() => setShowEmoji(e => !e)}
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center transition-all',
              showEmoji ? 'bg-brand-50 text-brand' : 'text-neutral-400 hover:text-brand hover:bg-neutral-100',
            )}>
            <Smile size={16} />
          </button>
        </div>

        {/* Text input */}
        <textarea
          ref={textRef}
          rows={1}
          value={content}
          onChange={e => { setContent(e.target.value); onTyping?.() }}
          onKeyDown={handleKey}
          disabled={disabled || sending}
          placeholder="Write a message…"
          className="flex-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-brand-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all resize-none max-h-32 scrollbar-none disabled:opacity-50"
          onInput={e => {
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
          }}
        />

        {/* Send */}
        <button
          onClick={() => handleSend()}
          disabled={(!content.trim() && !mediaUrl) || sending || uploading || disabled}
          className="w-10 h-10 rounded-xl bg-brand hover:bg-brand-700 disabled:opacity-40 text-white flex items-center justify-center transition-all active:scale-95 shadow-brand shrink-0 pb-0.5">
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}