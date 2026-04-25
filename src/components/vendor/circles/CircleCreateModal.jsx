'use client'
// FILE: src/components/vendor/circles/CircleCreateModal.jsx

import { useState, useRef } from 'react'
import { X, Loader2, Users, Crown, ShoppingBag, Zap, Megaphone, Upload, Camera } from 'lucide-react'
import { createCircle, updateCircle } from '@/lib/actions/circles'
import { createClient } from '@/lib/supabase/client'
import { cn }          from '@/utils/cn'

const CIRCLE_TYPES = [
  { value: 'general',       label: 'General',       desc: 'Open community for all customers',     icon: Users,      color: 'bg-brand/10 border-brand/20 text-brand'           },
  { value: 'vip',           label: 'VIP',           desc: 'Exclusive circle for top customers',   icon: Crown,      color: 'bg-amber-500/10 border-amber-500/20 text-amber-600'       },
  { value: 'wholesale',     label: 'Wholesale',     desc: 'For bulk buyers and resellers',        icon: ShoppingBag,color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' },
  { value: 'flash_sale',    label: 'Flash Sale',    desc: 'Limited-time deals and drops',         icon: Zap,        color: 'bg-orange-500/10 border-orange-500/20 text-orange-600'    },
  { value: 'announcements', label: 'Announcements', desc: 'One-way broadcast to subscribers',    icon: Megaphone,  color: 'bg-violet-500/10 border-violet-500/20 text-violet-600'    },
]

const EMOJI_CATEGORIES = [
  { label: 'Commerce',      emojis: ['🛍️','💰','💎','🏆','🎯','📦','🚀','💼','🏪','🤝','💳','📊'] },
  { label: 'Community',     emojis: ['👥','👑','⭐','🌟','✨','💫','🎪','🎭','🌍','🤗','💪','🙌'] },
  { label: 'Announcements', emojis: ['💬','📣','📢','🔔','✉️','📱','💡','🔥','⚡','📡','🗣️','📝'] },
  { label: 'Celebration',   emojis: ['🎉','🎁','🎀','🎊','🥳','🎈','🏅','🥇','🎖️','🎗️','🎟️','🎠'] },
  { label: 'Nature',        emojis: ['🌈','☀️','🌙','❄️','🌊','🌺','🌸','🍀','🌴','🦋','🌻','🌹'] },
  { label: 'Symbols',       emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','♾️','✅','🔑','🛡️'] },
]
const EMOJIS = EMOJI_CATEGORIES.flatMap(c => c.emojis)


async function uploadCoverImage(file, circleId) {
  const supabase = createClient()
  const ext  = file.name.split('.').pop()
  const path = `covers/${circleId ?? `new-${Date.now()}`}.${ext}`
  const { data, error } = await supabase.storage
    .from('circle-media')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw new Error(error.message)
  const { data: { publicUrl } } = supabase.storage.from('circle-media').getPublicUrl(data.path)
  return publicUrl
}

export default function CircleCreateModal({ circle, onClose, onSaved }) {
  const isEditing = !!circle
  const coverRef = useRef(null)

  const [coverPreview,   setCoverPreview]   = useState(circle?.cover_url ?? null)
  const [coverFile,      setCoverFile]      = useState(null)
  const [uploadingCover, setUploadingCover] = useState(false)

  const [form, setForm] = useState({
    name:        circle?.name        ?? '',
    description: circle?.description ?? '',
    type:        circle?.type        ?? 'general',
    emoji:       circle?.emoji       ?? '💬',
    cover_url:   circle?.cover_url   ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCoverPick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Cover must be an image'); return }
    if (file.size > 5 * 1024 * 1024)    { setError('Cover must be under 5MB'); return }
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Circle name is required'); return }
    setLoading(true)
    setError(null)

    let cover_url = form.cover_url
    if (coverFile) {
      setUploadingCover(true)
      try {
        cover_url = await uploadCoverImage(coverFile, circle?.id)
      } catch (e) {
        setError('Cover upload failed: ' + e.message)
        setLoading(false)
        setUploadingCover(false)
        return
      }
      setUploadingCover(false)
    }

    const payload = { ...form, cover_url }
    const res = isEditing
      ? await updateCircle(circle.id, payload)
      : await createCircle(payload)

    setLoading(false)
    if (res?.error) { setError(res.error); return }
    onSaved?.(res.data)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4"
      onClick={onClose}>
      <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-neutral-100 sticky top-0 bg-white/80 backdrop-blur-xl z-10">
          <div>
            <p className="font-black text-brand-900 text-lg uppercase tracking-tight">{isEditing ? 'Edit Circle' : 'Create Circle'}</p>
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-0.5">Define your community</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-brand transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto no-scrollbar pb-safe">

          {/* Emoji picker */}
          <div className="space-y-4">
            <label className="text-xs font-black text-brand-900 uppercase tracking-widest px-1">Select Emoji</label>
            <div className="space-y-4">
              {EMOJI_CATEGORIES.map(cat => (
                <div key={cat.label}>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 px-1">{cat.label}</p>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                    {cat.emojis.map(e => (
                      <button key={e} type="button" onClick={() => set('emoji', e)}
                        className={cn(
                          'w-12 h-12 rounded-2xl text-2xl flex items-center justify-center transition-all active:scale-[0.85]',
                          form.emoji === e
                            ? 'bg-brand/10 border-2 border-brand shadow-sm scale-110'
                            : 'bg-neutral-50 border border-neutral-100 hover:border-brand/40',
                        )}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Name & Description */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black text-brand-900 uppercase tracking-widest px-1">Circle Name *</label>
              <input
                placeholder="e.g. VIP Customers, Flash Sale Members…"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                maxLength={60}
                className={cn(
                  'w-full rounded-2xl border bg-neutral-50 px-5 py-4 text-sm font-bold text-brand-900 placeholder:text-neutral-400',
                  'focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all',
                  error && !form.name.trim() ? 'border-danger/50' : 'border-neutral-100',
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-brand-900 uppercase tracking-widest px-1">Description</label>
              <textarea
                placeholder="What is this circle for? Help members understand what to expect."
                rows={3}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 px-5 py-4 text-sm font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all resize-none"
              />
            </div>
          </div>

          {/* Type */}
          <div className="space-y-4">
            <label className="text-xs font-black text-brand-900 uppercase tracking-widest px-1">Circle Type</label>
            <div className="grid grid-cols-1 gap-2.5">
              {CIRCLE_TYPES.map(t => {
                const Icon = t.icon
                return (
                  <button key={t.value} type="button" onClick={() => set('type', t.value)}
                    className={cn(
                      'w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98]',
                      form.type === t.value
                        ? 'border-brand bg-brand-50 shadow-sm'
                        : 'border-neutral-50 bg-neutral-50 hover:border-brand/20',
                    )}>
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2',
                      form.type === t.value ? 'bg-white border-brand/20 text-brand' : 'bg-white border-neutral-100 text-neutral-400')}>
                      <Icon size={18} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <p className={cn('text-sm font-black uppercase tracking-tight', form.type === t.value ? 'text-brand-900' : 'text-neutral-600')}>{t.label}</p>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">{t.desc}</p>
                    </div>
                    <div className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                      form.type === t.value ? 'border-brand bg-brand' : 'border-neutral-200')}>
                      {form.type === t.value && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cover image upload */}
          <div className="space-y-4">
            <label className="text-xs font-black text-brand-900 uppercase tracking-widest px-1">Cover Image <span className="text-neutral-400 font-bold lowercase tracking-normal">(optional)</span></label>
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverPick} />
            <div
              onClick={() => coverRef.current?.click()}
              className={cn(
                'relative w-full h-40 rounded-3xl border-2 border-dashed overflow-hidden cursor-pointer transition-all group',
                coverPreview
                  ? 'border-neutral-200 hover:border-brand shadow-sm'
                  : 'border-neutral-100 hover:border-brand/20 bg-neutral-50',
              )}
            >
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="cover" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                    <div className="flex items-center gap-2 bg-white text-brand-900 text-[11px] font-black uppercase tracking-widest px-4 py-2.5 rounded-2xl shadow-xl">
                      <Camera size={16} /> Change Cover
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-neutral-400">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-neutral-100">
                    <Upload size={20} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black uppercase tracking-widest">Upload Cover</p>
                    <p className="text-[10px] font-bold text-neutral-300 mt-1">JPG, PNG, WebP · Max 5MB</p>
                  </div>
                </div>
              )}
              {uploadingCover && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <Loader2 size={24} className="text-white animate-spin" />
                </div>
              )}
            </div>
            {coverPreview && (
              <button onClick={(e) => { e.stopPropagation(); setCoverPreview(null); setCoverFile(null); set('cover_url', '') }}
                className="text-[11px] font-black uppercase tracking-widest text-danger hover:text-danger/70 transition-colors ml-1">
                Remove cover
              </button>
            )}
          </div>

          {error && (
            <div className="bg-danger/5 border border-danger/20 rounded-2xl px-5 py-4 text-xs text-danger font-black uppercase tracking-widest flex items-center gap-2 animate-in slide-in-from-top-2">
              <X size={14} className="shrink-0" /> {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button onClick={onClose}
              className="flex-1 py-4.5 rounded-2xl border-2 border-neutral-100 text-sm font-black uppercase tracking-widest text-neutral-400 hover:bg-neutral-50 transition-all active:scale-[0.98]">
              Cancel
            </button>
            <button onClick={handleSave} disabled={loading}
              className="flex-[2] flex items-center justify-center gap-2 py-4.5 rounded-2xl bg-brand hover:bg-brand-700 disabled:opacity-60 text-white font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-brand/20 active:scale-[0.98]">
              {loading ? <Loader2 size={16} className="animate-spin" /> : (isEditing ? 'Update Circle' : 'Create Circle')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}