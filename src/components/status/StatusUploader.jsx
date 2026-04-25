'use client'
// FILE: src/components/status/StatusUploader.jsx

import { useState, useRef } from 'react'
import { Camera, Upload, X, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth }     from '@/hooks/useAuth'
import { cn }           from '@/utils/cn'
import toast            from 'react-hot-toast'

/**
 * StatusUploader - A vendor-only component to upload or record ephemeral stories.
 */
export default function StatusUploader({ onComplete, onClose }) {
  const { vendor }   = useAuth()
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const supabase     = createClient()

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    
    // Check constraints (e.g. video length could be checked but browser-side is tricky without metadata)
    if (f.size > 50 * 1024 * 1024) {
       toast.error('File too large (max 50MB)')
       return
    }

    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleUpload = async () => {
    if (!file || !vendor) {
      toast.error('Missing file or vendor profile')
      return
    }
    
    setUploading(true)
    
    try {
      const ext = file.name.split('.').pop() || 'tmp'
      const path = `statuses/${vendor.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      
      // We use 'vendor_statuses' bucket to support both images and videos
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vendor_statuses')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        })
      
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('vendor_statuses')
        .getPublicUrl(uploadData.path)

      // Insert into our new vendor_statuses table
      const { error: dbError } = await supabase
        .from('vendor_statuses')
        .insert({
          vendor_id:  vendor.id,
          media_url:  publicUrl,
          media_type: file.type.startsWith('video') ? 'video' : 'image',
          caption:    caption.trim(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })

      if (dbError) throw dbError
      
      toast.success('Your status is live!')
      onComplete?.()
      onClose()
    } catch (e) {
      console.error('[StatusUpload]:', e)
      toast.error(e.message || 'Failed to post status')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-surface-2 rounded-3xl w-full max-w-sm max-h-[90vh] flex flex-col border border-border/60 shadow-2xl animate-scale-in overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
             <Camera size={18} />
           </div>
           <h3 className="font-extrabold text-primary tracking-tight text-sm sm:text-base">Post a Status</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-surface-3 rounded-full transition-colors text-muted hover:text-primary">
          <X size={20} />
        </button>
      </div>

      <div className="p-5 overflow-y-auto custom-scrollbar">
        {!preview ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
               "border-2 border-dashed border-border rounded-2xl aspect-[9/16] max-h-[360px]",
               "flex flex-col items-center justify-center cursor-pointer transition-all",
               "hover:border-brand/40 hover:bg-brand/5 group"
            )}
          >
            <div className="w-16 h-16 rounded-2xl bg-surface-3 flex items-center justify-center text-muted group-hover:bg-brand group-hover:text-white group-hover:scale-110 transition-all mb-4 shadow-sm">
              <Upload size={28} />
            </div>
            <p className="font-bold text-sm text-primary">Capture or Upload</p>
            <p className="text-[11px] text-muted font-medium mt-1 uppercase tracking-wider">Video or Image • Max 50MB</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*,video/*" 
              className="hidden" 
            />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Preview Section */}
            <div className="relative aspect-[9/16] max-h-[320px] bg-black rounded-2xl overflow-hidden group shadow-xl">
              {file?.type.startsWith('video') ? (
                <video src={preview} className="w-full h-full object-cover" autoPlay muted loop playsInline />
              ) : (
                <img src={preview} alt="" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              <button 
                onClick={() => { setFile(null); setPreview(null); setCaption('') }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-brand transition-all backdrop-blur-md border border-white/20"
              >
                <X size={16} />
              </button>
            </div>

            {/* Caption Input */}
            <div className="relative">
              <textarea 
                placeholder="What's happening?"
                className="w-full bg-surface border border-border rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all min-h-[100px] resize-none shadow-inner"
                value={caption}
                onChange={e => setCaption(e.target.value)}
              />
              <p className="absolute bottom-3 right-3 text-[10px] font-bold text-muted bg-surface-2 px-2 py-1 rounded-md">
                {caption.length} / 250
              </p>
            </div>

            {/* Action Button */}
            <button 
              onClick={handleUpload}
              disabled={uploading}
              className="btn btn-primary btn-full py-4 text-base font-bold shadow-brand flex items-center justify-center gap-2 group active:scale-95"
            >
              {uploading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Uploading your story...</span>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <Check size={14} className="text-white" />
                  </div>
                  <span>Post Status Now</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-surface p-4 border-t border-border/40 text-center shrink-0">
        <p className="text-[10px] font-bold text-muted uppercase tracking-[0.1em]">
          Automatically expires in 24 hours
        </p>
      </div>
    </div>
  )
}
