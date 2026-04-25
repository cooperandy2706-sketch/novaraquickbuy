'use client'
// FILE: src/components/vendor/videos/VideoUploader.jsx
// Handles both file upload and in-app camera recording

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Upload, Video, StopCircle, Play, RotateCcw,
  CheckCircle2, Loader2, AlertCircle, Camera,
  SwitchCamera, Mic, MicOff, X, Image as ImageIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn }           from '@/utils/cn'

const MAX_SIZE_MB  = 500
const MAX_DURATION = 180 // 3 minutes
const BUCKET       = 'vendor-videos'
const ACCEPTED     = 'video/mp4,video/quicktime,video/webm,video/x-m4v'

async function uploadVideoToStorage(file, vendorId, onProgress) {
  const supabase  = createClient()
  const ext       = file.name.split('.').pop() || 'mp4'
  const path      = `${vendorId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  // For large files use resumable upload
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl:    '3600',
      upsert:          false,
      contentType:     file.type || 'video/mp4',
      duplex:          'half',
    })

  if (error) throw new Error(error.message)

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
  return publicUrl
}

// ── Record tab: MediaRecorder via getUserMedia ────────────────────────────────
export default function Step1Capture({ onComplete, vendorId, onCancel }) {
  const videoRef     = useRef(null)
  const mediaRef     = useRef(null)
  const chunksRef    = useRef([])
  const timerRef     = useRef(null)
  const fileInputRef = useRef(null)

  const [stream,     setStream]     = useState(null)
  const [recording,  setRecording]  = useState(false)
  const [seconds,    setSeconds]    = useState(0)
  const [facingMode, setFacingMode] = useState('environment') // Back camera default is better for commerce
  const [muted,      setMuted]      = useState(false)
  const [preview,    setPreview]    = useState(null) // blob URL of recording
  const [uploading,  setUploading]  = useState(false)
  const [error,      setError]      = useState(null)
  const [uploadProgress, setUploadProgress] = useState(null)

  const startCamera = useCallback(async (mode = facingMode) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera access or requires a secure connection (HTTPS or localhost).')
      }
      
      if (stream) stream.getTracks().forEach(t => t.stop())
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: !muted,
      })
      setStream(s)
      if (videoRef.current) {
        videoRef.current.srcObject = s
        videoRef.current.play()
      }
      setError(null)
    } catch (e) {
      console.error('Camera Error:', e)
      if (e.name === 'NotAllowedError') {
        setError('Camera access blocked. You must allow permissions in your browser settings to record.')
      } else if (e.name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else {
        setError(e.message || 'Camera access denied. Please check your browser settings.')
      }
    }
  }, [muted, facingMode, stream])

  useEffect(() => {
    startCamera()
    return () => {
      stream?.getTracks().forEach(t => t.stop())
      clearInterval(timerRef.current)
    }
  }, [])

  const startRecording = () => {
    if (!stream) return
    chunksRef.current = []
    
    // Find supported mimeType
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4', // Safari fallback
    ]
    const supportedType = types.find(t => MediaRecorder.isTypeSupported(t)) || ''
    
    const mr = new MediaRecorder(stream, { mimeType: supportedType })
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: supportedType || 'video/webm' })
      setPreview(URL.createObjectURL(blob))
    }
    mr.start(100)
    mediaRef.current = mr
    setRecording(true)
    setSeconds(0)
    timerRef.current = setInterval(() => {
      setSeconds(s => {
        if (s >= MAX_DURATION - 1) { stopRecording(); return s }
        return s + 1
      })
    }, 1000)
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    clearInterval(timerRef.current)
    setRecording(false)
  }

  const handleUseRecording = async () => {
    const blob = new Blob(chunksRef.current, { type: 'video/webm' })
    const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'video/webm' })
    setUploading(true)
    try {
      const url = await uploadVideoToStorage(file, vendorId)
      onComplete({ url, file, duration: seconds })
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  // --- File Upload Logic ---
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('video/')) { setError('Please select a video file'); return }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setError(`File must be under ${MAX_SIZE_MB}MB`); return }

    setError(null)
    setUploading(true)
    setUploadProgress(0)

    try {
      // Fake progress
      const interval = setInterval(() => setUploadProgress(p => Math.min((p ?? 0) + Math.random() * 15, 85)), 400)
      const url = await uploadVideoToStorage(file, vendorId)
      clearInterval(interval)
      setUploadProgress(100)

      // Get video duration
      const duration = await getVideoDuration(file)
      onComplete({ url, file, duration })
    } catch (e) {
      setError(e.message ?? 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  const getVideoDuration = (file) => new Promise((res) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); res(Math.round(v.duration)) }
    v.onerror = () => res(0)
    v.src = URL.createObjectURL(file)
  })

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col overflow-hidden items-center justify-center">
      {/* Top Exit Button */}
      {onCancel && !recording && !uploading && (
        <button 
          onClick={onCancel}
          className="absolute top-6 right-6 z-[120] w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
        >
          <X size={24} />
        </button>
      )}

      {/* Hidden File Input for Native Gallery Picker */}
      <input ref={fileInputRef} type="file" accept={ACCEPTED} onChange={handleFileUpload} className="hidden" />

      {/* Uploading Overlay */}
      {uploading && uploadProgress !== null && (
        <div className="absolute inset-0 z-[130] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
          <div className="w-full max-w-xs space-y-6 text-center">
            <Loader2 size={48} className="text-brand animate-spin mx-auto" />
            <div>
              <p className="text-lg font-bold text-white">Uploading Video…</p>
              <p className="text-sm text-white/60 mt-2">{Math.round(uploadProgress)}%</p>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
              <div className="h-full bg-brand rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="relative z-[110] w-[90%] max-w-sm bg-surface-2 rounded-3xl p-8 text-center shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full bg-brand/20 animate-ping" />
            <Camera size={32} className="text-brand relative z-10" />
          </div>
          <h2 className="text-xl font-bold text-primary mb-2">Camera & Mic Access</h2>
          <p className="text-sm text-muted mb-8 leading-relaxed">
            Novara needs access to your camera and microphone so you can record and upload videos directly.
          </p>
          
          <div className="space-y-3">
            <button 
              onClick={() => startCamera()}
              className="w-full py-4 bg-brand text-white rounded-2xl font-black text-sm shadow-lg shadow-brand/20 active:scale-95 transition-all"
            >
              ENABLE PERMISSIONS
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 border-2 border-border text-primary rounded-2xl font-black text-sm hover:bg-surface-3 transition-colors flex items-center justify-center gap-2"
            >
              <ImageIcon size={18} /> UPLOAD FROM GALLERY
            </button>
            <button 
              onClick={() => onCancel && onCancel()}
              className="w-full py-2 text-muted text-xs font-bold hover:text-primary transition-colors mt-2"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Camera preview */}
      {!preview && !error ? (
        <div className="relative flex-1 w-full bg-black">
          <video ref={videoRef} muted autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />

          {/* Recording indicator */}
          {recording && (
            <div className="absolute top-8 left-0 right-0 flex items-center justify-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-base font-black font-mono tracking-wider drop-shadow-md">{fmt(seconds)}</span>
              <span className="text-white/70 text-xs font-bold">/ {fmt(MAX_DURATION)}</span>
            </div>
          )}

          {/* Controls overlay */}
          <div className="absolute bottom-12 left-0 right-0 flex items-center justify-around px-8">
            {/* Gallery Upload (Left) */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-14 h-14 rounded-xl bg-black/40 backdrop-blur-xl flex flex-col items-center justify-center text-white active:scale-90 transition-all border border-white/20"
            >
              <ImageIcon size={22} className="mb-0.5" />
              <span className="text-[9px] font-black tracking-wider">UPLOAD</span>
            </button>

            {/* Record button (Center) */}
            {!recording ? (
              <button onClick={startRecording}
                className="w-24 h-24 rounded-full border-[6px] border-white flex items-center justify-center bg-transparent active:scale-90 transition-all shadow-2xl">
                <div className="w-18 h-18 rounded-full bg-red-600" />
              </button>
            ) : (
              <button onClick={stopRecording}
                className="w-24 h-24 rounded-full border-[6px] border-white flex items-center justify-center bg-transparent active:scale-90 transition-all shadow-2xl">
                <div className="w-10 h-10 rounded-md bg-red-600" />
              </button>
            )}

            {/* Flip camera (Right) */}
            <button onClick={() => { setFacingMode(f => f === 'user' ? 'environment' : 'user'); startCamera(facingMode === 'user' ? 'environment' : 'user') }}
              className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white active:scale-90 transition-all border border-white/20">
              <SwitchCamera size={26} />
            </button>
          </div>
        </div>
      ) : (
        // Preview recorded video — also full screen
        <div className="relative h-full w-full bg-black flex flex-col items-center justify-center">
          <video src={preview} controls className="h-full w-full object-cover" />
        </div>
      )}

      {/* Preview actions — overlay on bottom if previewing */}
      {preview && (
        <div className="absolute bottom-10 left-0 right-0 flex gap-4 px-6 z-20">
          <button onClick={() => { setPreview(null); chunksRef.current = [] }}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-sm font-bold text-white hover:bg-white/20 transition-all">
            <RotateCcw size={18} /> Retake
          </button>
          <button onClick={handleUseRecording} disabled={uploading}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-brand text-white font-bold text-sm hover:bg-brand-700 disabled:opacity-50 shadow-brand transition-all active:scale-[0.98]">
            {uploading
              ? <><Loader2 size={18} className="animate-spin" /> Saving…</>
              : <><CheckCircle2 size={18} /> Use This Video</>
            }
          </button>
        </div>
      )}
    </div>
  )
}