'use client'
// FILE: src/components/vendor/videos/VideoForm.jsx

import { useState, useEffect }    from 'react'
import { useRouter }   from 'next/navigation'
import {
  Video, Tag, Globe, Calendar, ChevronLeft,
  Save, Eye, AlertCircle, Loader2, Image, CheckCircle2
} from 'lucide-react'
import Step1Capture    from '@/components/vendor/videos/VideoUploader'
import ProductTagger   from '@/components/vendor/videos/ProductTagger'
import { createVideo, updateVideo } from '@/lib/actions/videos'
import { cn }          from '@/utils/cn'


const VIDEO_CATEGORIES = [
  'Fashion & Apparel', 'Electronics & Gadgets', 'Food & Groceries',
  'Beauty & Skincare', 'Home & Living', 'Sports & Fitness',
  'Books & Stationery', 'Health & Wellness', 'Kids & Toys',
  'Art & Crafts', 'Automotive', 'Other',
]

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-surface-2 rounded-2xl border border-border shadow-sm">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-surface-3/30 rounded-t-2xl overflow-hidden">
        <h3 className="font-bold text-primary text-sm flex items-center gap-2">
          <Icon size={14} className="text-brand" /> {title}
        </h3>
      </div>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">{children}</div>
    </div>
  )
}

export default function VideoForm({ video, products = [], vendorId }) {
  const router    = useRouter()
  const isEditing = !!video

  const [form, setForm] = useState({
    title:          video?.title         ?? '',
    description:    video?.description   ?? '',
    status:         video?.status        ?? 'draft',
    thumbnail_url:  video?.thumbnail_url ?? '',
    video_url:      video?.video_url     ?? '',
    duration_seconds: video?.duration_seconds ?? 0,
    scheduled_at:   video?.scheduled_at  ?? '',
    seo_title:      video?.seo_title     ?? '',
    seo_description: video?.seo_description ?? '',
    category:       video?.category       ?? '',
    hashtags:       video?.hashtags       ?? [],  // array of strings e.g. ['fashion','sale']
  })

  const [tags,     setTags]    = useState(
    (video?.video_tags ?? []).map(t => ({
      id:         t.id,
      product_id: t.product?.id ?? t.product_id,
      product:    t.product,
      position_x: t.position_x,
      position_y: t.position_y,
    }))
  )
  const [errors,   setErrors]  = useState({})
  const [loading,  setLoading] = useState(false)
  const [saveAs,   setSaveAs]  = useState(null)
  
  // Wizard state (skip steps if editing)
  const [step, setStep] = useState(isEditing ? 3 : 1)

  // Auto-generate details when a product is tagged
  useEffect(() => {
    if (tags.length > 0) {
      const p = tags[0].product
      if (!p) return

      setForm(f => {
        const next = { ...f }
        let changed = false

        if (!f.title) {
          next.title = `${p.name} Showcase`
          changed = true
        }
        if (!f.description) {
          next.description = `Shop the ${p.name} right from this video! ${p.description ? p.description.substring(0, 100) + '...' : ''}`
          changed = true
        }
        if (!f.seo_title) {
          next.seo_title = `Buy ${p.name} Online`
          changed = true
        }
        if (!f.seo_description) {
          next.seo_description = `Watch our latest video featuring the ${p.name}. Tap to shop directly!`
          changed = true
        }
        if (!f.category && p.category) {
          // If the product category matches one of our VIDEO_CATEGORIES, use it
          const match = VIDEO_CATEGORIES.find(c => c.toLowerCase() === p.category.toLowerCase())
          if (match) {
            next.category = match
            changed = true
          } else {
            // Fallback to 'Other' if it doesn't match perfectly
            next.category = 'Other'
            changed = true
          }
        } else if (!f.category) {
          next.category = 'Other'
          changed = true
        }

        return changed ? next : f
      })
    }
  }, [tags])

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }))
  }

  const handleVideoComplete = ({ url, duration }) => {
    set('video_url', url)
    if (duration) set('duration_seconds', duration)
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim())    e.title     = 'Title is required'
    if (!form.video_url.trim()) e.video_url = 'Please upload a video first'
    if (form.status === 'scheduled' && !form.scheduled_at)
      e.scheduled_at = 'Pick a publish date for scheduled videos'
    return e
  }

  const submit = async (status) => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    setSaveAs(status)
    setLoading(true)

    const payload = {
      ...form,
      status,
      tags: tags.map(t => ({
        product_id: t.product_id,
        position_x: t.position_x,
        position_y: t.position_y,
      })),
    }

    const res = isEditing
      ? await updateVideo(video.id, payload)
      : await createVideo(payload)

    setLoading(false)
    setSaveAs(null)

    if (res?.error) { setErrors({ _form: res.error }); return }
    router.push('/vendor/videos')
  }

  // ── Step 1: Capture & Upload ──────────────────────────────────────────
  if (step === 1) {
    return (
      <Step1Capture 
        vendorId={vendorId}
        onCancel={() => router.push('/vendor/videos')}
        onComplete={({ url, duration }) => {
          set('video_url', url)
          if (duration) set('duration_seconds', duration)
          setStep(2)
        }}
      />
    )
  }

  // ── Step 2: Product Tagging ───────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-6 z-[110] flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <button 
            onClick={() => setStep(1)} 
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 pointer-events-auto active:scale-90 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex gap-2 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">
            <div className="w-6 h-1.5 rounded-full bg-white/30" />
            <div className="w-6 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            <div className="w-6 h-1.5 rounded-full bg-white/30" />
          </div>
          <div className="w-10" />
        </div>

        {/* Tagger */}
        <div className="flex-1 w-full relative">
          <ProductTagger
            videoUrl={form.video_url}
            products={products}
            tags={tags}
            onChange={setTags}
            fullScreen={true}
          />
        </div>

        {/* Footer Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 z-[110] bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center pointer-events-none">
          <p className="text-white font-bold text-sm mb-4 drop-shadow-md">Tap anywhere to tag products</p>
          <button 
            onClick={() => setStep(3)} 
            className="w-full py-4 bg-white text-black rounded-2xl font-black text-sm shadow-xl shadow-black/50 active:scale-95 transition-all flex items-center justify-center gap-2 pointer-events-auto"
          >
            NEXT: ADD DETAILS
          </button>
        </div>
      </div>
    )
  }

  // ── Step 3: Details & Publish ─────────────────────────────────────────
  return (
    <div className="space-y-6 pb-safe sm:pb-10 max-w-2xl mx-auto sm:px-6 pt-6 sm:pt-10 animate-in slide-in-from-right duration-300">
      
      {/* Step Header */}
      <div className="flex items-center justify-between px-4 sm:px-0">
        <button onClick={() => setStep(isEditing ? 3 : 2)}
          className="w-10 h-10 rounded-full border border-border bg-surface-2 flex items-center justify-center text-primary active:scale-90 transition-all">
          <ChevronLeft size={20} />
        </button>
        {!isEditing && (
          <div className="flex gap-2">
            <div className="w-6 h-1.5 rounded-full bg-surface-3" />
            <div className="w-6 h-1.5 rounded-full bg-surface-3" />
            <div className="w-6 h-1.5 rounded-full bg-brand" />
          </div>
        )}
        <div className="w-10" />
      </div>

      <div className="px-4 sm:px-0 mb-6">
        <h1 className="text-2xl font-black text-primary tracking-tight">{isEditing ? 'Edit Video' : 'Final Details'}</h1>
        <p className="text-sm text-muted mt-1 font-medium">Add descriptions and get ready to post</p>
      </div>

      <div className="space-y-6 px-4 sm:px-0">
        <Section icon={Video} title="Details">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-primary">Title *</label>
            <input
              placeholder="e.g. Summer Collection Try-On"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              maxLength={100}
              className={cn(
                'w-full rounded-2xl border bg-surface-3 px-4 py-3.5 text-sm text-primary placeholder:text-muted',
                'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all shadow-sm',
                errors.title ? 'border-danger/50' : 'border-border',
              )}
            />
            {errors.title && <p className="text-xs text-danger font-medium mt-1">{errors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-primary">Description</label>
            <textarea
              placeholder="Tell viewers what this video is about, what products are featured…"
              rows={4}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface-3 px-4 py-3.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all resize-none shadow-sm"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-primary">Category</label>
            <div className="relative">
              <select
                value={form.category}
                onChange={e => set('category', e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface-3 px-4 py-3.5 text-sm text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all shadow-sm color-scheme-dark"
              >
                <option value="">Select a category…</option>
                {VIDEO_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Hashtags */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-primary">Hashtags</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm font-bold">#</span>
              <input
                placeholder="fashion sale trending"
                value={Array.isArray(form.hashtags) ? form.hashtags.join(' ') : form.hashtags}
                onChange={e => set('hashtags', e.target.value.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(Boolean))}
                className="w-full pl-8 pr-4 py-3.5 rounded-2xl border border-border bg-surface-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all shadow-sm"
              />
            </div>
            {form.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {(Array.isArray(form.hashtags) ? form.hashtags : []).map(tag => (
                  <span key={tag} className="text-[10px] font-black text-brand bg-brand/10 border border-brand/20 px-2.5 py-1.5 rounded-lg uppercase tracking-wider">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* SEO */}
        <Section icon={Globe} title="SEO">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-primary">SEO Title</label>
            <input
              placeholder={form.title || 'Video title'}
              value={form.seo_title}
              onChange={e => set('seo_title', e.target.value)}
              maxLength={70}
              className="w-full rounded-2xl border border-border bg-surface-3 px-4 py-3.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-primary">SEO Description</label>
            <textarea
              placeholder="Brief summary for search engines…"
              rows={3}
              value={form.seo_description}
              onChange={e => set('seo_description', e.target.value)}
              maxLength={160}
              className="w-full rounded-2xl border border-border bg-surface-3 px-4 py-3.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all resize-none shadow-sm"
            />
          </div>
        </Section>

        {/* Schedule */}
        <Section icon={Calendar} title="Publishing">
          <div className="space-y-3">
            {['draft', 'published', 'scheduled'].map(s => (
              <button key={s} type="button"
                onClick={() => set('status', s)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98]',
                  form.status === s
                    ? 'border-brand bg-brand/5 ring-4 ring-brand/10'
                    : 'border-border hover:border-brand/30 hover:bg-surface-3',
                )}
              >
                <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                  form.status === s ? 'border-brand bg-brand' : 'border-muted')}>
                  {form.status === s && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <p className={cn('text-sm font-bold capitalize', form.status === s ? 'text-brand' : 'text-primary')}>{s}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {s === 'draft'     && 'Save without publishing'}
                    {s === 'published' && 'Live on the feed immediately'}
                    {s === 'scheduled' && 'Publish at a future date'}
                  </p>
                </div>
              </button>
            ))}

            {form.status === 'scheduled' && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 pt-2">
                <label className="text-xs font-bold text-primary">Publish Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={e => set('scheduled_at', e.target.value)}
                  className={cn(
                    'w-full rounded-2xl border bg-surface-3 px-4 py-3.5 text-sm text-primary color-scheme-dark shadow-sm',
                    'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all',
                    errors.scheduled_at ? 'border-danger/50' : 'border-border',
                  )}
                />
                {errors.scheduled_at && <p className="text-xs text-danger font-medium">{errors.scheduled_at}</p>}
              </div>
            )}
          </div>
        </Section>

        {/* Error */}
        {errors._form && (
          <div className="flex items-start gap-2 bg-danger/5 border border-danger/20 rounded-2xl p-4 animate-in shake">
            <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
            <p className="text-sm text-danger font-medium leading-relaxed">{errors._form}</p>
          </div>
        )}

        {/* Save Buttons (Fixed to bottom on mobile, inline on desktop) */}
        <div className="fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-0 bg-surface-1 sm:bg-transparent border-t border-border sm:border-transparent z-40 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.2)] sm:shadow-none">
          <button
            onClick={() => submit(form.status === 'draft' ? 'draft' : form.status)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-700 disabled:opacity-60 text-white font-black rounded-2xl py-4 text-sm transition-all shadow-brand shadow-xl active:scale-[0.98]"
          >
            {loading && saveAs === form.status
              ? <Loader2 size={18} className="animate-spin" />
              : <><CheckCircle2 size={18} /> {isEditing ? 'SAVE CHANGES' : form.status === 'published' ? 'POST NOW' : form.status === 'scheduled' ? 'SCHEDULE POST' : 'SAVE DRAFT'}</>
            }
          </button>
        </div>
        <div className="h-20 sm:hidden" /> {/* Spacer for fixed button */}
      </div>
    </div>
  )
}