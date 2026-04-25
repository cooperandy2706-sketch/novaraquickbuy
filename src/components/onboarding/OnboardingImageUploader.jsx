'use client'
// FILE: src/components/onboarding/OnboardingImageUploader.jsx
//
// Lightweight single-image uploader used across onboarding steps.
// Supports different buckets: 'vendor-logos' and 'vendor-documents'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, AlertCircle, CheckCircle2, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn }           from '@/utils/cn'

const MAX_SIZE_MB = 10
const ACCEPTED    = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

async function uploadFile(file, bucket, folder) {
  const supabase = createClient()
  const ext      = file.name.split('.').pop().toLowerCase().replace('heic', 'jpg')
  const path     = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert:       false,
      contentType:  file.type,
    })

  if (error) throw new Error(error.message)

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return publicUrl
}

async function deleteFile(url, bucket) {
  try {
    const supabase = createClient()
    const path     = url.split(`/${bucket}/`)[1]
    if (path) await supabase.storage.from(bucket).remove([path])
  } catch {}
}

export default function OnboardingImageUploader({
  label,
  hint,
  url,
  onChange,
  error,
  bucket    = 'vendor-logos',
  folder    = 'logos',
  accept    = ACCEPTED,
  maxSizeMb = MAX_SIZE_MB,
  preview   = 'square',   // 'square' | 'wide' | 'avatar'
  icon: Icon = Camera,
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState(null)
  const [dragging,  setDragging]  = useState(false)
  const inputRef = useRef(null)

  const validate = (file) => {
    if (!accept.includes(file.type) && !file.name.toLowerCase().endsWith('.heic'))
      return 'Only JPEG, PNG, WebP or HEIC images allowed'
    if (file.size > maxSizeMb * 1024 * 1024)
      return `File must be under ${maxSizeMb}MB`
    return null
  }

  const process = async (file) => {
    const err = validate(file)
    if (err) { setUploadErr(err); return }

    setUploadErr(null)
    setUploading(true)
    try {
      const publicUrl = await uploadFile(file, bucket, folder)
      onChange(publicUrl)
    } catch (e) {
      setUploadErr(e.message ?? 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleInput = (e) => {
    if (e.target.files?.[0]) process(e.target.files[0])
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.[0]) process(e.dataTransfer.files[0])
  }

  const handleRemove = async () => {
    if (url) await deleteFile(url, bucket)
    onChange('')
    setUploadErr(null)
  }

  // ── Preview dimensions ────────────────────────────────────────────────────
  const previewClass = {
    square: 'w-full aspect-square',
    wide:   'w-full aspect-video',
    avatar: 'w-24 h-24 rounded-full',
  }[preview]

  const previewShape = preview === 'avatar' ? 'rounded-full' : 'rounded-xl'

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-brand-800">{label}</label>
      )}
      {hint && !url && (
        <p className="text-xs text-neutral-400 leading-relaxed">{hint}</p>
      )}

      {/* Uploaded state */}
      {url && !uploading ? (
        <div className={cn('relative group overflow-hidden bg-neutral-100 border-2 border-brand', previewShape,
          preview !== 'avatar' && previewClass,
          preview === 'avatar' && 'inline-flex',
        )}>
          <img
            src={url}
            alt={label}
            className={cn('object-cover w-full h-full', previewShape)}
            onError={e => { e.target.style.opacity = '0.3' }}
          />
          {/* Overlay */}
          <div className={cn(
            'absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity',
            'flex flex-col items-center justify-center gap-2', previewShape,
          )}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-semibold text-brand-800 hover:bg-neutral-100 transition-colors"
            >
              <Upload size={12} /> Change
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-danger rounded-lg text-xs font-semibold text-white hover:bg-red-600 transition-colors"
            >
              <X size={12} /> Remove
            </button>
          </div>

          {/* Uploaded badge */}
          <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow-sm">
            <CheckCircle2 size={12} />
          </div>

          <input ref={inputRef} type="file" accept={accept.join(',')} onChange={handleInput} className="hidden" />
        </div>
      ) : (
        /* Drop zone */
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={cn(
            'relative border-2 border-dashed rounded-2xl transition-all cursor-pointer',
            'flex flex-col items-center justify-center gap-3 p-6 sm:p-8 text-center',
            dragging  ? 'border-brand bg-brand-50 scale-[1.01]'
                      : error || uploadErr
                        ? 'border-danger/40 bg-danger/5'
                        : 'border-neutral-200 hover:border-brand-300 hover:bg-brand-50/40',
            uploading && 'pointer-events-none',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept.join(',')}
            onChange={handleInput}
            className="hidden"
          />

          {uploading ? (
            <>
              <Loader2 size={32} className="text-brand animate-spin" />
              <p className="text-sm font-semibold text-brand-800">Uploading…</p>
            </>
          ) : (
            <>
              <div className={cn(
                'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-colors',
                dragging ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-400',
              )}>
                <Icon size={20} className="sm:hidden" />
                <Icon size={24} className="hidden sm:block" />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-800">
                  {dragging ? 'Drop here' : 'Click or drag to upload'}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  JPEG, PNG, WebP · Max {maxSizeMb}MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Errors */}
      {(uploadErr || error) && (
        <div className="flex items-start gap-2 bg-danger/5 border border-danger/20 rounded-xl px-3 py-2.5">
          <AlertCircle size={13} className="text-danger shrink-0 mt-0.5" />
          <p className="text-xs text-danger font-medium">{uploadErr || error}</p>
        </div>
      )}
    </div>
  )
}