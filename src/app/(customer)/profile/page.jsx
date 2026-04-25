'use client'
// FILE: src/app/(customer)/profile/page.jsx
// Dark-mode enhanced — dark: variants applied throughout.
// ThemeToggle embedded in the Settings tab.

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore }  from '@/store/authStore'
import { useAuth }       from '@/hooks/useAuth'
import { cn }            from '@/utils/cn'
import ThemeToggle       from '@/components/ui/ThemeToggle'
import toast             from 'react-hot-toast'
import { startVendorOnboarding } from '@/lib/actions/onboarding'
import {
  User, Package, Heart, Star, Settings, HelpCircle,
  Camera, Edit2, Check, X, ChevronRight, LogOut,
  BadgeCheck, Store, MessageCircle, Bell, Lock,
  Phone, Mail, MapPin, Calendar, ShoppingBag,
  ArrowRight, Loader2, AlertCircle, Send,
  Trash2, Eye, EyeOff, UserCheck, RefreshCw, Palette,
} from 'lucide-react'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'

// ─────────────────────────────────────────────────────────────
const fmtGHS   = (v, cur = 'GHS') => formatCurrency(v, cur)
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '?'
const AVATAR_COLORS = ['#16A34A','#0D9488','#6366F1','#EC4899','#EA580C','#0EA5E9','#D97706','#A855F7']
const avatarColor = (name = '') => {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

const TABS = [
  { id: 'overview',  label: 'Overview',  icon: User        },
  { id: 'orders',    label: 'Orders',    icon: Package     },
  { id: 'following', label: 'Following', icon: Heart       },
  { id: 'reviews',   label: 'Reviews',   icon: Star        },
  { id: 'settings',  label: 'Settings',  icon: Settings    },
  { id: 'help',      label: 'Help',      icon: HelpCircle  },
]

// ─────────────────────────────────────────────────────────────
// AVATAR UPLOADER
// ─────────────────────────────────────────────────────────────
function AvatarUploader({ profile, onUploaded }) {
  const [uploading, setUploading] = useState(false)
  const fileRef  = useRef(null)
  const supabase = createClient()
  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    setUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `avatars/${profile.id}_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', profile.id)
      onUploaded(publicUrl)
      toast.success('Profile photo updated!')
    } catch (err) {
      toast.error(err.message ?? 'Upload failed')
    } finally { setUploading(false) }
  }
  return (
    <>
      <button onClick={() => fileRef.current?.click()} disabled={uploading}
        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand border-2 border-surface flex items-center justify-center shadow-lg hover:bg-brand-600 transition-colors">
        {uploading ? <Loader2 size={14} className="text-white animate-spin" /> : <Camera size={14} className="text-white" />}
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// EDIT FIELD
// ─────────────────────────────────────────────────────────────
function EditField({ label, value, onSave, type = 'text', icon: Icon }) {
  const [editing, setEditing] = useState(false)
  const [val,     setVal]     = useState(value ?? '')
  const [saving,  setSaving]  = useState(false)
  const handleSave = async () => {
    if (val.trim() === (value ?? '').trim()) { setEditing(false); return }
    setSaving(true)
    await onSave(val.trim())
    setSaving(false)
    setEditing(false)
  }
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      {Icon && <Icon size={15} className="text-muted shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-0.5">{label}</p>
        {editing ? (
          <input type={type} value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
            autoFocus
            className="w-full text-sm font-medium text-primary border-b-2 border-brand outline-none bg-transparent pb-0.5" />
        ) : (
          <p className="text-sm font-medium text-primary truncate">
            {value || <span className="text-muted italic text-xs">Not set</span>}
          </p>
        )}
      </div>
      {editing ? (
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={handleSave} disabled={saving}
            className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center hover:bg-brand-600 transition-colors">
            {saving ? <Loader2 size={11} className="text-white animate-spin" /> : <Check size={11} className="text-white" />}
          </button>
          <button onClick={() => { setVal(value ?? ''); setEditing(false) }}
            className="w-7 h-7 rounded-lg bg-surface-3 flex items-center justify-center hover:bg-surface-2 transition-colors">
            <X size={11} className="text-secondary" />
          </button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:bg-surface-3 hover:text-secondary transition-colors shrink-0">
          <Edit2 size={12} />
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SECTION WRAPPER
// ─────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, danger }) {
  return (
    <div className={cn(
      'rounded-2xl border p-4 bg-surface-2',
      danger
        ? 'border-red-500/20'
        : 'border-border',
    )}>
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
        <Icon size={15} className={danger ? 'text-danger' : 'text-secondary'} />
        <h3 className={cn('text-sm font-bold', danger ? 'text-danger' : 'text-primary')}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TOGGLE
// ─────────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <button onClick={onChange}
      className={cn(
        'w-11 h-6 rounded-full border-2 relative transition-all shrink-0',
        on ? 'bg-brand border-brand' : 'bg-surface-3 border-border',
      )}>
      <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all', on ? 'left-5' : 'left-0.5')} />
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// ORDER STATUS BADGE
// ─────────────────────────────────────────────────────────────
function OrderStatusBadge({ status }) {
  const MAP = {
    pending:          'bg-amber-500/10 text-amber-500 border-amber-500/20',
    confirmed:        'bg-blue-500/10 text-blue-500 border-blue-500/20',
    shipped:          'bg-violet-500/10 text-violet-500 border-violet-500/20',
    out_for_delivery: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    delivered:        'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    cancelled:        'bg-danger/10 text-danger border-danger/20',
  }
  const LABELS = {
    pending: 'Pending', confirmed: 'Confirmed', shipped: 'Shipped',
    out_for_delivery: 'Delivering', delivered: 'Delivered', cancelled: 'Cancelled',
  }
  return (
    <span className={cn('text-[10px] font-bold px-2 py-1 rounded-lg border shrink-0', MAP[status] ?? 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700')}>
      {LABELS[status] ?? status}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// FAQ ITEM
// ─────────────────────────────────────────────────────────────
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-surface-2 rounded-xl border border-border overflow-hidden">
      <button onClick={() => setOpen(p => !p)}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-surface-3 transition-colors">
        <span className="text-sm font-semibold text-primary pr-4">{q}</span>
        <ChevronRight size={14} className={cn('text-muted shrink-0 transition-transform', open && 'rotate-90')} />
      </button>
      {open && (
        <div className="px-4 pb-3 border-t border-border">
          <p className="text-sm text-secondary leading-relaxed pt-2">{a}</p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, href }) {
  const inner = (
    <div className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-surface-2 border border-border hover:border-brand/40 hover:shadow-sm transition-all group">
      <div className="w-9 h-9 rounded-xl bg-surface-3 flex items-center justify-center group-hover:bg-brand/10 transition-colors">
        <Icon size={17} className="text-secondary group-hover:text-brand" />
      </div>
      <p className="text-2xl font-black text-primary leading-none">{value}</p>
      <p className="text-xs font-medium text-muted text-center">{label}</p>
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>
}

// ─────────────────────────────────────────────────────────────
// OVERVIEW TAB
// ─────────────────────────────────────────────────────────────
function OverviewTab({ profile, stats, recentOrders, ordersLoading }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Orders"    value={stats.orders}    icon={Package}     href="/orders"   />
        <StatCard label="Following" value={stats.following} icon={Heart}       />
        <StatCard label="Reviews"   value={stats.reviews}   icon={Star}        />
        <StatCard label="Wishlists" value={stats.wishlist}  icon={ShoppingBag} href="/wishlist" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-primary">Recent Orders</h3>
          <Link href="/orders" className="text-xs font-semibold text-brand flex items-center gap-1 hover:text-brand-600">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {ordersLoading ? (
          <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-brand" /></div>
        ) : recentOrders.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2 text-center bg-surface-2 rounded-2xl border border-border">
            <Package size={28} className="text-muted/30" />
            <p className="text-sm text-muted">No orders yet</p>
            <Link href="/explore" className="text-xs font-semibold text-brand hover:underline">Start shopping →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentOrders.map(order => (
              <Link key={order.id} href={`/orders/${order.id}`}
                className="flex items-center gap-3 p-3 bg-surface-2 rounded-2xl border border-border hover:border-brand/40 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center shrink-0 overflow-hidden">
                  {order.items?.[0]?.image_url
                    ? <img src={order.items[0].image_url} alt="" className="w-full h-full object-cover" />
                    : <Package size={16} className="text-muted" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">
                    {order.items?.[0]?.name ?? `Order #${order.id.slice(0,8)}`}
                    {(order.items?.length ?? 0) > 1 && ` +${order.items.length - 1}`}
                  </p>
                  <p className="text-xs text-secondary">{fmtDate(order.created_at)} · {fmtGHS(order.total_amount)}</p>
                </div>
                <OrderStatusBadge status={order.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 p-4 bg-brand/10 rounded-2xl border border-brand/20">
        <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shrink-0">
          <UserCheck size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-brand">Member since {fmtDate(profile?.created_at)}</p>
          <p className="text-xs text-brand/80">Thank you for shopping on Novara!</p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ORDERS TAB
// ─────────────────────────────────────────────────────────────
function OrdersTab({ orders, loading }) {
  if (loading) return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-brand" /></div>
  if (!orders.length) return (
    <div className="flex flex-col items-center py-16 gap-3 text-center">
      <Package size={48} className="text-muted/30" />
      <p className="text-sm font-semibold text-muted">No orders yet</p>
      <Link href="/explore" className="btn btn-primary btn-sm">Start shopping</Link>
    </div>
  )
  return (
    <div className="space-y-3">
      {orders.map(order => (
        <Link key={order.id} href={`/orders/${order.id}`}
          className="block p-4 bg-surface-2 rounded-2xl border border-border hover:border-brand/40 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-primary">#{order.id.slice(0,8).toUpperCase()}</p>
              <p className="text-xs text-secondary">{fmtDate(order.created_at)}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-2">
            {order.items?.slice(0, 4).map((item, i) => (
              <div key={i} className="w-10 h-10 rounded-xl bg-surface-3 overflow-hidden shrink-0">
                {item.image_url
                  ? <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-lg">🛍️</div>}
              </div>
            ))}
            {(order.items?.length ?? 0) > 4 && (
              <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center text-xs font-bold text-secondary shrink-0">
                +{order.items.length - 4}
              </div>
            )}
            <div className="ml-auto text-right">
              <p className="text-sm font-black text-primary">{fmtGHS(order.total_amount)}</p>
              <p className="text-xs text-muted">{order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// FOLLOWING TAB
// ─────────────────────────────────────────────────────────────
function FollowingTab({ vendors, loading, onUnfollow, onMessage }) {
  if (loading) return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-brand" /></div>
  if (!vendors.length) return (
    <div className="flex flex-col items-center py-16 gap-3 text-center">
      <Heart size={48} className="text-muted/30" />
      <p className="text-sm font-semibold text-muted">Not following any vendors yet</p>
      <Link href="/explore" className="btn btn-primary btn-sm">Discover vendors</Link>
    </div>
  )
  return (
    <div className="space-y-3">
      {vendors.map(vendor => (
        <div key={vendor.id}
          className="flex items-center gap-3 p-4 bg-surface-2 rounded-2xl border border-border hover:border-brand/20 transition-all">
          <Link href={`/store/${vendor.id}`} className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-surface-3 flex items-center justify-center font-bold text-muted text-lg">
              {vendor.logo_url
                ? <img src={vendor.logo_url} alt="" className="w-full h-full object-cover" />
                : vendor.store_name?.[0]?.toUpperCase()}
            </div>
            {vendor.verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-brand border-2 border-surface flex items-center justify-center">
                <BadgeCheck size={11} className="text-white" />
              </div>
            )}
          </Link>
          <Link href={`/store/${vendor.id}`} className="flex-1 min-w-0">
            <p className="text-sm font-bold text-primary truncate">{vendor.store_name}</p>
            <p className="text-xs text-secondary truncate">
              {vendor.store_category}{vendor.product_count > 0 && ` · ${vendor.product_count} products`}
            </p>
            {vendor.trust_score > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={10} className="text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-semibold text-secondary">{Number(vendor.trust_score).toFixed(1)}</span>
              </div>
            )}
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => onMessage(vendor)}
              className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center text-brand hover:bg-brand/20 transition-colors" title="Message">
              <MessageCircle size={15} />
            </button>
            <button onClick={() => onUnfollow(vendor.id)}
              className="px-3 h-8 rounded-xl text-xs font-semibold text-secondary bg-surface-3 hover:bg-danger/10 hover:text-danger transition-colors border border-border">
              Unfollow
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// REVIEWS TAB
// ─────────────────────────────────────────────────────────────
function ReviewsTab({ reviews, loading }) {
  if (loading) return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-brand" /></div>
  if (!reviews.length) return (
    <div className="flex flex-col items-center py-16 gap-3 text-center">
      <Star size={48} className="text-muted/30" />
      <p className="text-sm font-semibold text-muted">No reviews yet</p>
      <p className="text-xs text-muted/60">After buying a product, you can leave a review.</p>
    </div>
  )
  return (
    <div className="space-y-3">
      {reviews.map(review => (
        <div key={review.id} className="p-4 bg-surface-2 rounded-2xl border border-border">
          <div className="flex items-start gap-3">
            <Link href={`/product/${review.product_id}`}
              className="w-12 h-12 rounded-xl overflow-hidden bg-surface-3 shrink-0">
              {review.product?.images?.[0]
                ? <img src={review.product.images[0]} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>}
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/product/${review.product_id}`}>
                <p className="text-sm font-semibold text-primary truncate hover:text-brand transition-colors">
                  {review.product?.name ?? 'Product'}
                </p>
              </Link>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={11}
                      fill={i < review.rating ? '#F59E0B' : 'none'}
                      className={i < review.rating ? 'text-amber-400' : 'text-muted/30'} />
                  ))}
                </div>
                <span className="text-[10px] text-muted">{fmtDate(review.created_at)}</span>
              </div>
              {review.comment && (
                <p className="text-sm text-secondary mt-1.5 leading-relaxed">{review.comment}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SETTINGS TAB
// ─────────────────────────────────────────────────────────────
function SettingsTab({ profile, onUpdate }) {
  const [changingPw,        setChangingPw]        = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pwForm,   setPwForm]   = useState({ next: '', confirm: '' })
  const [pwLoading,setPwLoading]= useState(false)
  const [showPw,   setShowPw]   = useState(false)
  const supabase = createClient()

  const handlePasswordChange = async () => {
    if (pwForm.next !== pwForm.confirm) { toast.error('Passwords do not match'); return }
    if (pwForm.next.length < 8)         { toast.error('At least 8 characters'); return }
    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pwForm.next })
    setPwLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Password updated!')
    setChangingPw(false)
    setPwForm({ next: '', confirm: '' })
  }

  const notifPrefs = profile?.notification_prefs ?? {}
  const toggleNotifPref = async (key) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] }
    await onUpdate({ notification_prefs: updated })
  }

  return (
    <div className="space-y-4">

      {/* Appearance */}
      <Section title="Appearance" icon={Palette}>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-primary">Theme</p>
            <p className="text-xs text-muted mt-0.5">Choose light, dark, or follow your device</p>
          </div>
          <ThemeToggle showLabels />
        </div>
      </Section>

      {/* Personal info */}
      <Section title="Personal Information" icon={User}>
        <EditField label="Full Name"    value={profile?.full_name}    icon={User}   onSave={v => onUpdate({ full_name: v })} />
        <EditField label="Display Name" value={profile?.display_name} icon={User}   onSave={v => onUpdate({ display_name: v })} />
        <EditField label="Phone Number" value={profile?.phone}        icon={Phone}  onSave={v => onUpdate({ phone: v })} type="tel" />
        <EditField label="Location"     value={profile?.location}     icon={MapPin} onSave={v => onUpdate({ location: v })} />
        <div className="flex items-center gap-3 py-3">
          <Mail size={15} className="text-muted shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-0.5">Email</p>
            <p className="text-sm font-medium text-primary truncate">{profile?.email}</p>
          </div>
          <span className="text-[10px] font-semibold text-muted bg-surface-3 px-2 py-1 rounded-lg">Verified</span>
        </div>
      </Section>

      {/* Password */}
      <Section title="Password & Security" icon={Lock}>
        {!changingPw ? (
          <button onClick={() => setChangingPw(true)}
            className="flex items-center justify-between w-full py-3 text-sm font-medium text-secondary hover:text-brand transition-colors">
            <div className="flex items-center gap-3">
              <Lock size={15} className="text-muted" />
              Change password
            </div>
            <ChevronRight size={14} className="text-muted" />
          </button>
        ) : (
          <div className="space-y-3 py-1">
            {['next', 'confirm'].map(key => (
              <div key={key} className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder={key === 'next' ? 'New password' : 'Confirm password'}
                  value={pwForm[key]}
                  onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand transition-colors pr-10 bg-surface-2 text-primary placeholder:text-muted"
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={handlePasswordChange} disabled={pwLoading}
                className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {pwLoading && <Loader2 size={13} className="animate-spin" />}
                Update Password
              </button>
              <button onClick={() => setChangingPw(false)}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-secondary hover:bg-surface-3 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* Notifications */}
      <Section title="Notification Preferences" icon={Bell}>
        {[
          { key: 'order_updates', label: 'Order updates',    desc: 'Shipping and delivery alerts' },
          { key: 'messages',      label: 'Messages',         desc: 'DMs and circle activity'      },
          { key: 'promotions',    label: 'Promotions',       desc: 'Deals and new arrivals'        },
          { key: 'wishlist',      label: 'Wishlist alerts',  desc: 'Price drops, back in stock'   },
          { key: 'reviews',       label: 'Review reminders', desc: 'Prompts after purchases'      },
        ].map(p => (
          <div key={p.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div>
              <p className="text-sm font-medium text-primary">{p.label}</p>
              <p className="text-xs text-muted mt-0.5">{p.desc}</p>
            </div>
            <Toggle on={notifPrefs[p.key] !== false} onChange={() => toggleNotifPref(p.key)} />
          </div>
        ))}
      </Section>

      {/* Danger zone */}
      <Section title="Danger Zone" icon={AlertCircle} danger>
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-3 w-full py-3 text-sm font-medium text-danger hover:text-danger/80 transition-colors">
            <Trash2 size={15} /> Delete my account
          </button>
        ) : (
          <div className="py-1 space-y-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
              <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">Are you sure?</p>
              <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">This permanently deletes your account and all data. It cannot be undone.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { toast.error('Please contact support@novara.app to delete your account.'); setShowDeleteConfirm(false) }}
                className="flex-1 py-2.5 rounded-xl bg-danger text-white text-sm font-semibold hover:bg-danger/80 transition-colors">
                Yes, delete
              </button>
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-secondary hover:bg-surface-3 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// HELP TAB
// ─────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q: 'How does escrow payment work?',       a: 'Your payment is held securely by Novara. The vendor only receives funds after you confirm delivery or 48 hours pass without a dispute.' },
  { q: 'How do I track my order?',            a: 'Go to the Orders tab. Each order shows real-time status updates directly from the vendor.' },
  { q: 'Can I return a product?',             a: 'Yes. Open the order within 7 days of delivery and tap "Request Return". Novara mediates all disputes.' },
  { q: 'How do I contact a vendor directly?', a: 'On any product page or vendor store page, tap "Chat with Vendor" to start a direct conversation in the Messages tab.' },
  { q: 'How do I become a vendor?',           a: 'Visit novaraquickbuy.vercel.app/vendor/apply or go to Settings → Upgrade to Vendor. It takes under 5 minutes.' },
  { q: 'Is my payment information secure?',   a: 'Yes. Novara uses Paystack, Flutterwave and Stripe — all PCI-DSS compliant. We never store your card details.' },
]
const SUPPORT_CATEGORIES = [
  { id: 'general', label: 'General' }, { id: 'order', label: 'Order Issue' },
  { id: 'payment', label: 'Payment' }, { id: 'account', label: 'My Account' },
  { id: 'vendor', label: 'Vendor Report' }, { id: 'technical', label: 'Technical Bug' },
]

function HelpTab({ profile }) {
  const [form,    setForm]    = useState({ subject: '', message: '', category: 'general' })
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)
  const supabase = createClient()

  const handleSend = async () => {
    if (!form.subject.trim() || !form.message.trim()) { toast.error('Please fill all fields'); return }
    setSending(true)
    await supabase.from('support_tickets').insert({
      user_id: profile?.id, email: profile?.email, name: profile?.full_name,
      category: form.category, subject: form.subject.trim(), message: form.message.trim(), status: 'open',
    })
    setSending(false)
    setSent(true)
    toast.success("Message sent! We'll reply within 24 hours.")
  }

  if (sent) return (
    <div className="flex flex-col items-center py-16 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center">
        <Check size={28} className="text-brand" />
      </div>
      <h3 className="text-base font-bold text-primary">We got your message!</h3>
      <p className="text-sm text-secondary max-w-xs">We'll reply to <strong>{profile?.email}</strong> within 24 hours.</p>
      <button onClick={() => { setSent(false); setForm({ subject: '', message: '', category: 'general' }) }}
        className="btn btn-secondary btn-sm">Send another</button>
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-bold text-primary mb-3">Frequently Asked Questions</h3>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
        </div>
      </div>
      <div className="bg-surface-2 rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Send size={15} className="text-brand" />
          <h3 className="text-sm font-bold text-primary">Contact Support</h3>
        </div>
        <div className="mb-4">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {SUPPORT_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setForm(p => ({ ...p, category: cat.id }))}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                  form.category === cat.id
                    ? 'bg-brand text-white border-brand'
                    : 'bg-surface-3 text-secondary border-border hover:border-brand/40',
                )}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Subject</label>
            <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
              placeholder="Brief description of your issue"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand transition-colors bg-surface-3 text-primary placeholder:text-muted" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Message</label>
            <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              placeholder="Describe your issue in detail. Include order numbers if relevant."
              rows={4}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand transition-colors resize-none bg-surface-3 text-primary placeholder:text-muted" />
          </div>
        </div>
        <button onClick={handleSend} disabled={sending || !form.subject.trim() || !form.message.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {sending ? 'Sending…' : 'Send to Support'}
        </button>
        <p className="text-center text-xs text-muted mt-3">
          Or email <a href="mailto:support@novara.app" className="text-brand hover:underline font-semibold">support@novara.app</a>
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router   = useRouter()
  const supabase = createClient()
  const { user, loading: authLoading } = useAuthStore()
  const { handleSignOut, isVendor } = useAuth()
  const currency = useLocaleStore(s => s.currency)

  const [tab,     setTab]     = useState('overview')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [orders,  setOrders]  = useState([])
  const [vendors, setVendors] = useState([])
  const [reviews, setReviews] = useState([])
  const [stats,   setStats]   = useState({ orders: 0, following: 0, reviews: 0, wishlist: 0 })
  const [ordersLoading,  setOrdersLoading]  = useState(false)
  const [vendorsLoading, setVendorsLoading] = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    supabase.from('users').select('*').eq('id', user.id).single()
      .then(({ data }) => {
        setProfile(data ?? { id: user.id, email: user.email, ...user.user_metadata })
        setLoading(false)
      })
  }, [user?.id, authLoading, router])

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('buyer_id', user.id),
      supabase.from('vendor_follows').select('id', { count: 'exact', head: true }).eq('follower_id', user.id),
      supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('reviewer_id', user.id),
      supabase.from('wishlist_lists').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_archived', false),
    ]).then(([o, f, r, w]) => setStats({ orders: o.count??0, following: f.count??0, reviews: r.count??0, wishlist: w.count??0 }))
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    if (tab === 'overview' || tab === 'orders') {
      setOrdersLoading(true)
      supabase.from('orders')
        .select('id, status, total_amount, created_at, items:order_items(id, name, image_url, quantity, price)')
        .eq('buyer_id', user.id).order('created_at', { ascending: false })
        .limit(tab === 'overview' ? 3 : 20)
        .then(({ data }) => { 
          // Map stored currency if available
          setOrders(data?.map(o => ({ ...o, currency: o.currency || 'GHS' })) ?? []); 
          setOrdersLoading(false) 
        })
    }
    if (tab === 'following') {
      setVendorsLoading(true)
      supabase.from('vendor_follows')
        .select('vendor:vendors(id, store_name, logo_url, verified, store_category, trust_score, product_count)')
        .eq('follower_id', user.id).order('created_at', { ascending: false }).limit(30)
        .then(({ data }) => { setVendors(data?.map(r => r.vendor).filter(Boolean) ?? []); setVendorsLoading(false) })
    }
    if (tab === 'reviews') {
      setReviewsLoading(true)
      supabase.from('reviews')
        .select('id, rating, comment, created_at, product_id, product:products(id, name, images)')
        .eq('reviewer_id', user.id).order('created_at', { ascending: false }).limit(20)
        .then(({ data }) => { setReviews(data ?? []); setReviewsLoading(false) })
    }
  }, [tab, user?.id])

  const updateProfile = useCallback(async (fields) => {
    if (!user) return
    const { error } = await supabase.from('users').update(fields).eq('id', user.id)
    if (error) { toast.error(error.message); return }
    setProfile(p => ({ ...p, ...fields }))
    toast.success('Saved!')
  }, [user?.id])

  const unfollowVendor = useCallback(async (vendorId) => {
    await supabase.from('vendor_follows').delete().eq('follower_id', user.id).eq('vendor_id', vendorId)
    setVendors(p => p.filter(v => v.id !== vendorId))
    setStats(p => ({ ...p, following: Math.max(0, p.following - 1) }))
    toast.success('Unfollowed')
  }, [user?.id])

  const messageVendor = useCallback((vendor) => router.push(`/chat?vendor=${vendor.id}`), [])

  if (loading || !profile) return (
    <div className="flex items-center justify-center min-h-[60vh] bg-surface">
      <Loader2 size={28} className="animate-spin text-brand" />
    </div>
  )

  const displayName = profile.full_name ?? profile.display_name ?? profile.email ?? 'User'
  const bgColor     = avatarColor(displayName)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-12 min-h-dvh">

      {/* PROFILE CARD */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 overflow-hidden mb-6 shadow-sm">
        <div className="h-20 bg-gradient-to-r from-brand-900 via-brand-700 to-brand dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900" />
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <div
                className="w-20 h-20 rounded-2xl border-4 border-white dark:border-neutral-900 shadow-lg overflow-hidden flex items-center justify-center text-2xl font-black text-white"
                style={{ background: profile.avatar_url ? 'transparent' : bgColor }}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : getInitials(displayName)}
              </div>
              <AvatarUploader profile={profile} onUploaded={url => setProfile(p => ({ ...p, avatar_url: url }))} />
            </div>
            <div className="flex items-center gap-2 mt-12 flex-wrap justify-end">
              {isVendor ? (
                <Link href="/vendor/dashboard"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand text-xs font-bold border border-brand-100 dark:border-brand-800/40 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors">
                  <Store size={13} /> Vendor Dashboard
                </Link>
              ) : (
                <button 
                  onClick={async () => { 
                    setUpgrading(true)
                    const res = await startVendorOnboarding()
                    if (res?.error) {
                      toast.error(res.error)
                      setUpgrading(false)
                    } else {
                      router.push('/vendor/onboarding')
                    }
                  }}
                  disabled={upgrading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand text-xs font-bold border border-brand-100 dark:border-brand-800/40 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors disabled:opacity-50"
                >
                  {upgrading ? <Loader2 size={13} className="animate-spin" /> : <Store size={13} />}
                  {upgrading ? 'Upgrading...' : 'Become a Vendor'}
                </button>
              )}
              <button onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                <LogOut size={13} /> Sign out
              </button>
            </div>
          </div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">{displayName}</h1>
                {profile.role === 'vendor' && <BadgeCheck size={17} className="text-brand" />}
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">{profile.email}</p>
              <div className="flex items-center gap-3 flex-wrap">
                {profile.location && (
                  <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400"><MapPin size={11} />{profile.location}</span>
                )}
                <span className="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500"><Calendar size={11} />Joined {fmtDate(profile.created_at)}</span>
                <span className="text-xs font-semibold text-brand bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded-full border border-brand-100 dark:border-brand-800/40 capitalize">
                  {profile.role ?? 'Customer'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all border',
                tab === t.id
                  ? 'bg-brand text-white border-brand shadow-sm'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700',
              )}>
              <Icon size={13} />{t.label}
            </button>
          )
        })}
      </div>

      {/* TAB CONTENT */}
      {tab === 'overview'  && <OverviewTab  profile={profile} stats={stats} recentOrders={orders} ordersLoading={ordersLoading} />}
      {tab === 'orders'    && <OrdersTab    orders={orders}   loading={ordersLoading}  />}
      {tab === 'following' && <FollowingTab vendors={vendors} loading={vendorsLoading} onUnfollow={unfollowVendor} onMessage={messageVendor} />}
      {tab === 'reviews'   && <ReviewsTab   reviews={reviews} loading={reviewsLoading} />}
      {tab === 'settings'  && <SettingsTab  profile={profile} onUpdate={updateProfile} />}
      {tab === 'help'      && <HelpTab      profile={profile} />}
    </div>
  )
}