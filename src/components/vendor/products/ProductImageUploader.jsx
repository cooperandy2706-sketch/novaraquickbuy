'use client'
// FILE: src/components/vendor/products/ProductImageUploader.jsx

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle, GripVertical } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn }           from '@/utils/cn'

const MAX_IMAGES   = 8
const MAX_SIZE_MB  = 5
const ACCEPTED     = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const BUCKET       = 'product-images'

async function uploadToSupabase(file, vendorId) {
  const supabase  = createClient()
  const ext       = file.name.split('.').pop()
  const filename  = `${vendorId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file, {
      cacheControl: '3600',
      upsert:       false,
      contentType:  file.type,
    })

  if (error) throw new Error(error.message)

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path)

  return publicUrl
}

async function deleteFromSupabase(url) {
  const supabase = createClient()
  // Extract path from public URL
  const path = url.split(`/${BUCKET}/`)[1]
  if (!path) return
  await supabase.storage.from(BUCKET).remove([path])
}

function ImageThumb({ url, index, onRemove, onMoveLeft, onMoveRight, isFirst, isLast, uploading }) {
  return (
    <div className={cn(
      'relative group rounded-xl overflow-hidden border-2 bg-surface-3 transition-all',
      index === 0 ? 'border-brand shadow-sm' : 'border-border',
      uploading && 'opacity-60',
    )}>
      <div className="aspect-square">
        <img
          src={url}
          alt={`Product image ${index + 1}`}
          className="w-full h-full object-cover"
          onError={e => { e.target.style.display = 'none' }}
        />
      </div>

      {/* Primary badge */}
      {index === 0 && (
        <div className="absolute top-1.5 left-1.5 bg-brand text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
          Main
        </div>
      )}

      {/* Overlay actions */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="w-7 h-7 rounded-full bg-danger flex items-center justify-center text-white hover:bg-red-600 transition-colors"
          title="Remove image"
        >
          <X size={13} />
        </button>
        <div className="flex gap-1">
          {!isFirst && (
            <button
              type="button"
              onClick={() => onMoveLeft(index)}
              className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs hover:bg-white/40 transition-colors"
              title="Move left"
            >←</button>
          )}
          {!isLast && (
            <button
              type="button"
              onClick={() => onMoveRight(index)}
              className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs hover:bg-white/40 transition-colors"
              title="Move right"
            >→</button>
          )}
        </div>
      </div>

      {uploading && (
        <div className="absolute inset-0 bg-surface-2/70 flex items-center justify-center">
          <Loader2 size={20} className="text-brand animate-spin" />
        </div>
      )}
    </div>
  )
}

export default function ProductImageUploader({ images = [], onChange, vendorId }) {
  const [dragging,   setDragging]   = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [errors,     setErrors]     = useState([])
  const [uploadingIdxs, setUploadingIdxs] = useState([])
  const inputRef = useRef(null)

  const canAdd = images.length < MAX_IMAGES

  // ── Validate file ────────────────────────────────────────────────────────
  const validateFile = (file) => {
    if (!ACCEPTED.includes(file.type)) return `${file.name}: Only JPEG, PNG, WebP or GIF allowed`
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `${file.name}: Max file size is ${MAX_SIZE_MB}MB`
    return null
  }

  // ── Process files ────────────────────────────────────────────────────────
  const processFiles = useCallback(async (files) => {
    const fileArray = Array.from(files)
    const allowed   = fileArray.slice(0, MAX_IMAGES - images.length)
    const errs      = []

    // Validate all first
    const valid = allowed.filter(f => {
      const err = validateFile(f)
      if (err) { errs.push(err); return false }
      return true
    })

    if (errs.length) setErrors(errs)
    if (!valid.length) return

    setUploading(true)

    // Upload concurrently
    const results = await Promise.allSettled(
      valid.map(file => uploadToSupabase(file, vendorId))
    )

    const urls       = []
    const uploadErrs = []

    results.forEach((r, i) => {
      if (r.status === 'fulfilled') urls.push(r.value)
      else uploadErrs.push(`${valid[i].name}: ${r.reason?.message ?? 'Upload failed'}`)
    })

    if (uploadErrs.length) setErrors(prev => [...prev, ...uploadErrs])
    if (urls.length)       onChange([...images, ...urls])

    setUploading(false)
  }, [images, vendorId, onChange])

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragOver  = (e) => { e.preventDefault(); setDragging(true)  }
  const handleDragLeave = ()  => setDragging(false)
  const handleDrop      = (e) => {
    e.preventDefault()
    setDragging(false)
    setErrors([])
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files)
  }

  const handleFileInput = (e) => {
    setErrors([])
    if (e.target.files?.length) processFiles(e.target.files)
    e.target.value = ''
  }

  // ── Reorder ───────────────────────────────────────────────────────────────
  const moveLeft  = (i) => {
    const next = [...images]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    onChange(next)
  }
  const moveRight = (i) => {
    const next = [...images]
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
    onChange(next)
  }

  // ── Remove ────────────────────────────────────────────────────────────────
  const remove = async (i) => {
    const url  = images[i]
    const next = images.filter((_, j) => j !== i)
    onChange(next)
    // Best-effort delete from storage
    try { await deleteFromSupabase(url) } catch {}
  }

  return (
    <div className="space-y-4">

      {/* Uploaded images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2.5">
          {images.map((url, i) => (
            <ImageThumb
              key={url}
              url={url}
              index={i}
              onRemove={remove}
              onMoveLeft={moveLeft}
              onMoveRight={moveRight}
              isFirst={i === 0}
              isLast={i === images.length - 1}
              uploading={false}
            />
          ))}

          {/* Uploading placeholder */}
          {uploading && (
            <div className="aspect-square rounded-xl border-2 border-dashed border-brand bg-brand/10 flex items-center justify-center">
              <Loader2 size={22} className="text-brand animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Drop zone */}
      {canAdd && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer',
            dragging
              ? 'border-brand bg-brand/10 scale-[1.01]'
              : 'border-border hover:border-brand/40 hover:bg-brand/5',
            uploading && 'pointer-events-none opacity-60',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            multiple
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            {uploading ? (
              <Loader2 size={32} className="text-brand animate-spin" />
            ) : (
              <div className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors',
                dragging ? 'bg-brand text-white' : 'bg-surface-3 text-muted',
              )}>
                <Upload size={24} />
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-primary">
                {uploading
                  ? 'Uploading…'
                  : dragging
                    ? 'Drop images here'
                    : 'Drag & drop images here'
                }
              </p>
              <p className="text-xs text-muted mt-1">
                or <span className="text-brand font-semibold underline">browse files</span>
              </p>
              <p className="text-[11px] text-muted mt-2">
                JPEG, PNG, WebP or GIF · Max {MAX_SIZE_MB}MB each · Up to {MAX_IMAGES} images
              </p>
            </div>
          </div>

          {/* Remaining slots */}
          {images.length > 0 && (
            <p className="text-[11px] text-muted mt-3">
              {MAX_IMAGES - images.length} slot{MAX_IMAGES - images.length !== 1 ? 's' : ''} remaining
            </p>
          )}
        </div>
      )}

      {/* Max reached notice */}
      {!canAdd && (
        <div className="flex items-center gap-2 text-xs text-muted bg-surface-3 border border-border rounded-xl px-4 py-3">
          <ImageIcon size={14} className="shrink-0" />
          Maximum {MAX_IMAGES} images reached. Remove one to add another.
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1.5">
          {errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 bg-danger/5 border border-danger/20 rounded-xl px-3 py-2.5">
              <AlertCircle size={13} className="text-danger shrink-0 mt-0.5" />
              <p className="text-xs text-danger">{err}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reorder hint */}
      {images.length > 1 && (
        <p className="text-[11px] text-muted flex items-center gap-1.5">
          <GripVertical size={11} /> Hover over an image to reorder or remove it. First image is used as the main thumbnail.
        </p>
      )}
    </div>
  )
}