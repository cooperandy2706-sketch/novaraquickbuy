'use client'
// FILE: src/components/vendor/campaigns/CampaignForm.jsx

import { useState }    from 'react'
import { useRouter }   from 'next/navigation'
import {
  ChevronLeft, Tag, Zap, Image as ImageIcon,
  Megaphone, Star, Save, CheckCircle2,
  Loader2, AlertCircle, Package, Video,
  Calendar, Clock, Percent, DollarSign,
  Users, Info, RefreshCw,
} from 'lucide-react'
import { createCampaign, updateCampaign } from '@/lib/actions/campaigns'
import { cn }                              from '@/utils/cn'
import { useLocaleStore }                  from '@/store/localeStore'
import { formatCurrency }                  from '@/utils/formatCurrency'

const TYPE_META = {
  promo_code:      { icon: Tag,       label: 'Promo Code',      color: 'text-violet-600' },
  flash_sale:      { icon: Zap,       label: 'Flash Sale',       color: 'text-orange-600' },
  hero_banner:     { icon: ImageIcon, label: 'Hero Banner',      color: 'text-blue-600'   },
  broadcast:       { icon: Megaphone, label: 'Broadcast',        color: 'text-emerald-600'},
  sponsored_video: { icon: Star,      label: 'Sponsored Video',  color: 'text-amber-600'  },
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
      <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/60 flex items-center gap-2 rounded-t-2xl overflow-hidden">
        <Icon size={14} className="text-brand" />
        <h3 className="font-bold text-brand-800 text-sm">{title}</h3>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  )
}

function Field({ label, hint, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-brand-800">{label}</label>
      {hint && <p className="text-xs text-neutral-400">{hint}</p>}
      {children}
      {error && <p className="text-xs text-danger font-medium">{error}</p>}
    </div>
  )
}

function Input({ ...props }) {
  return (
    <input {...props}
      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all" />
  )
}

function ProductPicker({ products, selected, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-2.5 max-h-[60vh] overflow-y-auto no-scrollbar pb-2">
      {products.map(p => {
        const checked = selected.includes(p.id)
        return (
          <button key={p.id} type="button"
            onClick={() => onChange(checked ? selected.filter(x => x !== p.id) : [...selected, p.id])}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all active:scale-[0.98]',
              checked ? 'border-brand bg-brand-50 shadow-sm' : 'border-neutral-100 hover:border-neutral-200 bg-surface-1',
            )}>
            <div className="w-12 h-12 rounded-xl bg-white border border-neutral-100 overflow-hidden shrink-0 shadow-sm">
              {p.thumbnail_url
                ? <img src={p.thumbnail_url} alt={p.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-neutral-200"><Package size={18} /></div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-brand-900 truncate uppercase tracking-tight">{p.name}</p>
              <p className="text-xs font-black text-brand mt-0.5">{formatCurrency(p.price ?? 0, useLocaleStore.getState().currency)}</p>
            </div>
            <div className={cn('w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors',
              checked ? 'border-brand bg-brand' : 'border-neutral-200')}>
              {checked && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default function CampaignForm({ mode, campaign, type, products, circles, videos, subscription }) {
  const router   = useRouter()
  const currency = useLocaleStore(s => s.currency)
  const isEditing = mode === 'edit'
  const meta     = TYPE_META[type] ?? TYPE_META.promotion
  const Icon     = meta.icon

  const [form, setForm] = useState({
    name:             campaign?.name             ?? '',
    budget:           campaign?.budget           ?? '',
    starts_at:        campaign?.starts_at        ? campaign.starts_at.slice(0,16) : '',
    ends_at:          campaign?.ends_at          ? campaign.ends_at.slice(0,16)   : '',
    // Promo
    discount_type:    campaign?.discount_type    ?? 'percentage',
    discount_value:   campaign?.discount_value   ?? '',
    discount_code:    campaign?.discount_code    ?? '',
    min_order_value:  campaign?.min_order_value  ?? '',
    usage_limit:      campaign?.usage_limit      ?? '',
    // Hero banner
    hero_slot:        campaign?.hero_slot        ?? true,
    hero_image_url:   campaign?.hero_image_url   ?? '',
    hero_headline:    campaign?.hero_headline    ?? '',
    hero_cta:         campaign?.hero_cta         ?? 'Shop Now',
    // Sponsored
    video_id:         campaign?.video_id         ?? '',
    // Broadcast
    broadcast_message:campaign?.broadcast_message ?? '',
    target_circle_ids:campaign?.target_circle_ids ?? [],
  })

  const [selectedProducts, setSelectedProducts] = useState(
    campaign?.campaign_products?.map(cp => cp.product?.id).filter(Boolean) ?? []
  )
  const [errors,    setErrors]    = useState({})
  const [loading,   setLoading]   = useState(false)
  const [saveMode,  setSaveMode]  = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (type === 'promotion') {
      if (!form.discount_value) e.discount_value = 'Discount value is required'
      if (!form.discount_code.trim()) e.discount_code = 'Promo code is required'
    }
    if (type === 'flash_sale' && !selectedProducts.length) e.products = 'Select at least one product'
    if (type === 'broadcast' && !form.broadcast_message.trim()) e.broadcast_message = 'Message is required'
    if (type === 'sponsored' && !form.video_id) e.video_id = 'Select a video to sponsor'
    return e
  }

  const submit = async (status = 'draft') => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaveMode(status)
    setLoading(true)

    const payload = {
      type,
      name:             form.name.trim(),
      budget:           form.budget    ? Number(form.budget)    : null,
      startsAt:         form.starts_at ? new Date(form.starts_at).toISOString() : null,
      endsAt:           form.ends_at   ? new Date(form.ends_at).toISOString()   : null,
      productIds:       selectedProducts,
      discountType:     form.discount_type    || null,
      discountValue:    form.discount_value   ? Number(form.discount_value) : null,
      discountCode:     form.discount_code    || null,
      minOrderValue:    form.min_order_value  ? Number(form.min_order_value) : null,
      usageLimit:       form.usage_limit      ? Number(form.usage_limit)     : null,
      heroSlot:         type === 'hero_banner',
      heroImageUrl:     form.hero_image_url   || null,
      heroHeadline:     form.hero_headline    || null,
      heroCta:          form.hero_cta         || 'Shop Now',
      videoId:          form.video_id         || null,
      broadcastMessage: form.broadcast_message || null,
      targetCircleIds:  form.target_circle_ids,
    }

    const res = isEditing
      ? await updateCampaign(campaign.id, { ...payload, status })
      : await createCampaign({ ...payload, status: status === 'active' ? 'active' : 'draft' })

    setLoading(false)
    setSaveMode(null)

    if (res?.error) { setErrors({ _form: res.error }); return }
    router.push('/vendor/marketing/campaigns')
  }

  const sym = formatCurrency(0, currency).replace(/[0-9.,\s]/g, '')

  return (
    <div className="space-y-6 pb-10 max-w-2xl">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/vendor/marketing/campaigns')}
          className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-brand hover:border-brand-200 transition-all">
          <ChevronLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Icon size={16} className={meta.color} />
            <h1 className="text-xl font-bold text-brand-900">
              {isEditing ? `Edit ${meta.label}` : `New ${meta.label}`}
            </h1>
          </div>
          <p className="text-sm text-neutral-400 mt-0.5">{isEditing ? `Campaign ID: ${campaign.id.slice(0,8)}` : 'Create a new campaign'}</p>
        </div>
      </div>

      {/* Basics */}
      <Section title="Campaign Details" icon={Tag}>
        <Field label="Campaign Name *" error={errors.name}>
          <Input placeholder="e.g. Summer Sale 20% Off" value={form.name} onChange={e => set('name', e.target.value)} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Start Date" hint="Leave blank to start immediately">
            <Input type="datetime-local" value={form.starts_at} onChange={e => set('starts_at', e.target.value)}
              min={new Date().toISOString().slice(0,16)} />
          </Field>
          <Field label="End Date" hint="Leave blank for no expiry">
            <Input type="datetime-local" value={form.ends_at} onChange={e => set('ends_at', e.target.value)}
              min={form.starts_at || new Date().toISOString().slice(0,16)} />
          </Field>
        </div>

        {(type === 'sponsored' || type === 'broadcast') && (
          <Field label={`Budget (${currency})`} hint="Optional — max spend for this campaign">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">{sym}</span>
              <Input type="number" min="0" placeholder="0" value={form.budget}
                onChange={e => set('budget', e.target.value)} className="pl-9" />
            </div>
          </Field>
        )}
      </Section>

      {/* ── TYPE-SPECIFIC FIELDS ─────────────────────────────────────────── */}

      {/* Promo code */}
      {type === 'promotion' && (
        <Section title="Discount Settings" icon={Percent}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Discount Type">
              <div className="flex gap-2">
                {[
                  { val: 'percentage', label: '% Off'  },
                  { val: 'fixed',      label: 'Fixed'  },
                ].map(o => (
                  <button key={o.val} type="button" onClick={() => set('discount_type', o.val)}
                    className={cn('flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all',
                      form.discount_type === o.val ? 'border-brand bg-brand-50 text-brand-800' : 'border-neutral-200 text-neutral-600 hover:border-brand-200')}>
                    {o.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Discount Value *" error={errors.discount_value}>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-semibold text-sm">
                  {form.discount_type === 'percentage' ? '%' : sym}
                </span>
                <Input type="number" min="1" placeholder="20"
                  value={form.discount_value} onChange={e => set('discount_value', e.target.value)}
                  className="pl-9" />
              </div>
            </Field>
          </div>

          <Field label="Promo Code *" hint="Uppercase letters and numbers only" error={errors.discount_code}>
            <Input
              placeholder="SUMMER20"
              value={form.discount_code}
              onChange={e => set('discount_code', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              className="font-mono tracking-widest uppercase"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Min Order Value" hint={`Minimum ${sym} to apply code`}>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">{sym}</span>
                <Input type="number" min="0" placeholder="0" value={form.min_order_value}
                  onChange={e => set('min_order_value', e.target.value)} className="pl-9" />
              </div>
            </Field>
            <Field label="Usage Limit" hint="Max redemptions (blank = unlimited)">
              <Input type="number" min="1" placeholder="Unlimited" value={form.usage_limit}
                onChange={e => set('usage_limit', e.target.value)} />
            </Field>
          </div>
        </Section>
      )}

      {/* Flash sale */}
      {type === 'flash_sale' && (
        <Section title="Sale Products" icon={Package}>
          <p className="text-xs text-neutral-400 -mt-2">Select products that will go on sale. Buyers will see a countdown timer.</p>
          {errors.products && <p className="text-xs text-danger">{errors.products}</p>}
          {products.length === 0
            ? <p className="text-sm text-neutral-400 text-center py-4">No active products found. Add products first.</p>
            : <ProductPicker products={products} selected={selectedProducts} onChange={setSelectedProducts} />
          }
        </Section>
      )}

      {/* Hero banner */}
      {type === 'hero_banner' && (
        <Section title="Hero Banner Settings" icon={ImageIcon}>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Your product will appear in the rotating hero carousel on the Explore page — the most visible spot on Novara.
              Select the product and customise the banner text.
            </p>
          </div>

          <Field label="Featured Product *" hint="This product will show in the hero carousel">
            {errors.products && <p className="text-xs text-danger mb-1">{errors.products}</p>}
            {products.length === 0
              ? <p className="text-sm text-neutral-400">No active products found.</p>
              : (
                <div className="grid grid-cols-1 gap-2.5 max-h-[40vh] overflow-y-auto no-scrollbar pb-2">
                  {products.map(p => {
                    const checked = selectedProducts.includes(p.id)
                    return (
                      <button key={p.id} type="button"
                        onClick={() => setSelectedProducts(checked ? [] : [p.id])}
                        className={cn(
                          'w-full flex items-center gap-4 px-4 py-3 rounded-2xl border-2 text-left transition-all active:scale-[0.98]',
                          checked ? 'border-brand bg-brand-50 shadow-sm' : 'border-neutral-100 hover:border-neutral-200 bg-surface-1',
                        )}>
                        <div className="w-12 h-12 rounded-xl bg-white border border-neutral-100 overflow-hidden shrink-0 shadow-sm">
                          {p.thumbnail_url
                            ? <img src={p.thumbnail_url} alt={p.name} className="w-full h-full object-cover" />
                            : <Package size={18} className="text-neutral-200" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-brand-900 uppercase tracking-tight truncate">{p.name}</p>
                          <p className="text-xs font-black text-brand mt-0.5">{formatCurrency(p.price ?? 0, currency)}</p>
                        </div>
                        <div className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                          checked ? 'border-brand bg-brand' : 'border-neutral-200')}>
                          {checked && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            }
          </Field>

          <Field label="Banner Headline" hint="Short punchy headline shown on the carousel">
            <Input placeholder="e.g. New Arrivals — Shop Now" value={form.hero_headline}
              onChange={e => set('hero_headline', e.target.value)} maxLength={60} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Call-to-Action Button">
              <Input placeholder="Shop Now" value={form.hero_cta}
                onChange={e => set('hero_cta', e.target.value)} maxLength={20} />
            </Field>
          </div>
        </Section>
      )}

      {/* Sponsored video */}
      {type === 'sponsored' && (
        <Section title="Sponsored Video" icon={Video}>
          <p className="text-xs text-neutral-400 -mt-2">Your video will appear higher in the buyer feed for the campaign duration.</p>
          {errors.video_id && <p className="text-xs text-danger">{errors.video_id}</p>}
          {videos.length === 0
            ? <p className="text-sm text-neutral-400">No published videos found. Publish a video first.</p>
            : (
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-none">
                {videos.map(v => (
                  <button key={v.id} type="button"
                    onClick={() => set('video_id', v.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all',
                      form.video_id === v.id ? 'border-brand bg-brand-50' : 'border-neutral-200 hover:border-neutral-300',
                    )}>
                    <div className="w-12 h-16 rounded-xl bg-neutral-900 overflow-hidden shrink-0 border border-neutral-200">
                      {v.thumbnail_url
                        ? <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-neutral-500"><Video size={14} /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-brand-800 truncate">{v.title}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-400">
                        <span>👁 {v.views ?? 0}</span>
                        <span>❤️ {v.likes ?? 0}</span>
                      </div>
                    </div>
                    {form.video_id === v.id && <CheckCircle2 size={16} className="text-brand shrink-0" />}
                  </button>
                ))}
              </div>
            )
          }
        </Section>
      )}

      {/* Broadcast */}
      {type === 'broadcast' && (
        <Section title="Broadcast Message" icon={Megaphone}>
          <Field label="Message *" hint="This will be sent as an announcement to all selected circle members"
            error={errors.broadcast_message}>
            <textarea rows={4} placeholder="📣 Exclusive flash sale for circle members — 30% off all orders today only! Use code CIRCLE30 at checkout."
              value={form.broadcast_message} onChange={e => set('broadcast_message', e.target.value)}
              maxLength={500}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all resize-none" />
            <div className="flex justify-end">
              <span className={cn('text-[10px]', form.broadcast_message.length > 450 ? 'text-amber-500' : 'text-neutral-400')}>
                {form.broadcast_message.length}/500
              </span>
            </div>
          </Field>

          <Field label="Target Circles" hint="Select circles to broadcast to (all circles = all members)">
            {circles.length === 0
              ? <p className="text-sm text-neutral-400">No circles found. Create circles first.</p>
              : (
                <div className="space-y-2">
                  {circles.map(c => {
                    const checked = form.target_circle_ids.includes(c.id)
                    return (
                      <button key={c.id} type="button"
                        onClick={() => set('target_circle_ids',
                          checked
                            ? form.target_circle_ids.filter(x => x !== c.id)
                            : [...form.target_circle_ids, c.id]
                        )}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all',
                          checked ? 'border-emerald-400 bg-emerald-50' : 'border-neutral-200 hover:border-neutral-300',
                        )}>
                        <span className="text-2xl leading-none">{c.emoji ?? '💬'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-brand-800 truncate">{c.name}</p>
                          <p className="text-xs text-neutral-400">{c.member_count ?? 0} members</p>
                        </div>
                        {checked && <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )
            }
          </Field>
        </Section>
      )}

      {/* Error */}
      {errors._form && (
        <div className="flex items-start gap-2 bg-danger/5 border border-danger/20 rounded-xl px-4 py-3">
          <AlertCircle size={14} className="text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-danger font-medium">{errors._form}</p>
        </div>
      )}

      {/* Actions */}
      <div className={cn(
        "flex gap-3",
        "fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-neutral-100 sm:relative sm:p-0 sm:bg-transparent sm:border-0 z-20"
      )}>
        <button onClick={() => submit('draft')} disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-neutral-100 text-sm font-black uppercase tracking-widest text-neutral-500 hover:bg-neutral-50 disabled:opacity-50 transition-all active:scale-[0.98]">
          {loading && saveMode === 'draft' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span className="hidden sm:inline">Save</span> Draft
        </button>
        <button onClick={() => submit('active')} disabled={loading}
          className="flex-[2] sm:flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-brand hover:bg-brand-700 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-brand/20 transition-all active:scale-[0.98]">
          {loading && saveMode === 'active' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} strokeWidth={3} />}
          {isEditing ? 'Update' : 'Launch'}
        </button>
      </div>
    </div>
  )
}