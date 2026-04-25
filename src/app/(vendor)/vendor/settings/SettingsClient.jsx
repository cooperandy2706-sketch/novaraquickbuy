'use client'
// FILE: src/app/(vendor)/vendor/settings/SettingsClient.jsx

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Store, Building2, CreditCard, Truck,
  Bell, Shield, Trash2, ChevronRight,
  Save, Loader2, CheckCircle2, AlertCircle,
  Camera, Upload, ExternalLink, Eye, EyeOff,
  BadgeCheck, Clock, Crown, Instagram,
  Twitter, Facebook, Globe, AtSign,
  Package, MessageSquare, Star, Zap,
  Volume2, VolumeX, Settings2,
} from 'lucide-react'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'
import {
  updateStoreProfile,
  updateBusinessInfo,
  updatePayoutDetails,
  updateShippingSettings,
  updateNotificationPrefs,
  updatePassword,
  updatePreferences,
  deactivateStore,
} from '@/lib/actions/settings'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/utils/cn'

// ── Reusable field wrapper ────────────────────────────────────────────────────
function Field({ label, hint, error, required, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] leading-tight">
          {label}{required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      </div>
      {hint && <p className="text-[11px] text-neutral-400 font-medium leading-relaxed opacity-80">{hint}</p>}
      <div className="relative">
        {children}
      </div>
      {error && (
        <div className="flex items-center gap-1.5 mt-1.5 text-rose-500 animate-in fade-in slide-in-from-top-1">
          <AlertCircle size={12} strokeWidth={3} />
          <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
        </div>
      )}
    </div>
  )
}

function Input({ className, ...props }) {
  return (
    <input {...props}
      className={cn(
        'w-full rounded-2xl border border-neutral-100 bg-neutral-50/30 px-5 py-4 text-sm text-brand-900 font-black tracking-tight',
        'placeholder:text-neutral-300 placeholder:font-bold focus:outline-none focus:ring-4 focus:ring-brand/10',
        'focus:border-brand transition-all disabled:opacity-60 disabled:bg-neutral-50',
        className,
      )}
    />
  )
}

function Select({ children, className, ...props }) {
  return (
    <div className="relative">
      <select {...props}
        className={cn(
          'w-full rounded-2xl border border-neutral-100 bg-neutral-50/30 px-5 py-4 text-sm text-brand-900 font-black tracking-tight',
          'focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all appearance-none cursor-pointer pr-10',
          className,
        )}>
        {children}
      </select>
      <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 rotate-90 pointer-events-none" />
    </div>
  )
}

// ── Save feedback button ──────────────────────────────────────────────────────
function SaveButton({ loading, saved, disabled, onClick, label = 'Save Changes' }) {
  return (
    <button onClick={onClick} disabled={loading || disabled}
      className={cn(
        'flex items-center justify-center gap-3 px-8 py-4.5 rounded-2xl font-black text-sm transition-all active:scale-[0.98] disabled:opacity-40 uppercase tracking-widest',
        saved
          ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20'
          : 'bg-brand hover:bg-brand-700 text-white shadow-xl shadow-brand/20',
      )}>
      {loading
        ? <RefreshCw size={16} className="animate-spin" />
        : saved
          ? <><CheckCircle2 size={16} strokeWidth={3} /> Saved!</>
          : <><Save size={16} strokeWidth={3} /> {label}</>
      }
    </button>
  )
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label, desc }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-4 py-5 group text-left transition-all"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-brand-900 tracking-tight leading-tight group-hover:text-brand transition-colors">{label}</p>
        {desc && <p className="text-[11px] text-neutral-400 font-bold mt-1 leading-relaxed opacity-80">{desc}</p>}
      </div>
      <div className={cn(
        'relative w-12 h-6.5 rounded-full transition-all duration-300 shrink-0 shadow-inner',
        checked ? 'bg-brand' : 'bg-neutral-100',
      )}>
        <div className={cn(
          'absolute top-0.5 w-5.5 h-5.5 rounded-full bg-white shadow-lg transition-all duration-300 ease-spring',
          checked ? 'left-[22px]' : 'left-0.5',
        )} />
      </div>
    </button>
  )
}

// ── Image uploader ────────────────────────────────────────────────────────────
function AvatarUploader({ current, bucket, path, onUploaded, shape = 'circle' }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(current)
  const ref = useRef(null)

  const handle = async (file) => {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const fullPath = `${path}.${ext}`
    const { data, error } = await supabase.storage
      .from(bucket).upload(fullPath, file, { upsert: true, contentType: file.type })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path)
      setPreview(publicUrl)
      onUploaded(publicUrl)
    }
    setUploading(false)
  }

  const isCircle = shape === 'circle'

  return (
    <div className={cn('relative group cursor-pointer', isCircle ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-full h-32 sm:h-40')}
      onClick={() => ref.current?.click()}>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files?.[0] && handle(e.target.files[0])} />
      <div className={cn(
        'w-full h-full overflow-hidden border-2 border-dashed border-neutral-100 bg-neutral-50/30 transition-all group-hover:border-brand/30',
        isCircle ? 'rounded-full' : 'rounded-3xl',
      )}>
        {preview
          ? <img src={preview} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          : <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300 gap-2">
            <Upload size={isCircle ? 24 : 32} />
            {!isCircle && <span className="text-[10px] font-black uppercase tracking-widest">Select Banner</span>}
          </div>
        }
      </div>
      <div className={cn(
        'absolute inset-0 flex items-center justify-center backdrop-blur-[2px]',
        'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
        isCircle ? 'rounded-full' : 'rounded-3xl',
        'bg-brand-900/40',
      )}>
        {uploading
          ? <RefreshCw size={24} className="text-white animate-spin" />
          : <div className="flex flex-col items-center gap-1">
              <Camera size={24} className="text-white" strokeWidth={2.5} />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Change</span>
            </div>
        }
      </div>
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, desc, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden transition-all">
      <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-neutral-50 bg-neutral-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
            <Icon size={18} strokeWidth={2.5} className="text-brand" />
          </div>
          <div>
            <h3 className="font-black text-brand-900 text-sm sm:text-base uppercase tracking-tight">{title}</h3>
            {desc && <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5 opacity-80">{desc}</p>}
          </div>
        </div>
      </div>
      <div className="p-6 sm:p-8 space-y-6">{children}</div>
    </div>
  )
}

// ── CURRENCIES ────────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', flag: '🇬🇭', locale: 'en-GH' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬', locale: 'en-NG' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪', locale: 'en-KE' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', flag: '🇹🇿', locale: 'sw-TZ' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', flag: '🇺🇬', locale: 'en-UG' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦', locale: 'en-ZA' },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', flag: '🌍', locale: 'fr-SN' },
  { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA', flag: '🌍', locale: 'fr-CM' },
  { code: 'RWF', symbol: 'RF', name: 'Rwandan Franc', flag: '🇷🇼', locale: 'rw-RW' },
  { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', flag: '🇪🇹', locale: 'am-ET' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', flag: '🇪🇬', locale: 'ar-EG' },
  { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham', flag: '🇲🇦', locale: 'ar-MA' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', flag: '🇸🇦', locale: 'ar-SA' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪', locale: 'ar-AE' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', locale: 'en-IN' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', flag: '🇵🇰', locale: 'ur-PK' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', flag: '🇧🇩', locale: 'bn-BD' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', locale: 'en-US' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', locale: 'en-GB' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', locale: 'de-DE' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', locale: 'en-AU' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', locale: 'en-SG' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾', locale: 'ms-MY' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩', locale: 'id-ID' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷', locale: 'pt-BR' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', flag: '🇲🇽', locale: 'es-MX' },
]

// Map: country → default currency code
const COUNTRY_CURRENCY_MAP = {
  'Ghana': 'GHS', 'Nigeria': 'NGN', 'Kenya': 'KES',
  'Tanzania': 'TZS', 'Uganda': 'UGX', 'South Africa': 'ZAR',
  'Senegal': 'XOF', 'Ivory Coast': 'XOF', 'Cameroon': 'XAF',
  'Rwanda': 'RWF', 'Ethiopia': 'ETB', 'Egypt': 'EGP',
  'Morocco': 'MAD', 'Saudi Arabia': 'SAR', 'UAE': 'AED',
  'India': 'INR', 'Pakistan': 'PKR', 'Bangladesh': 'BDT',
  'United States': 'USD', 'United Kingdom': 'GBP', 'Canada': 'CAD',
  'Australia': 'AUD', 'Germany': 'EUR', 'France': 'EUR',
  'Singapore': 'SGD', 'Malaysia': 'MYR', 'Indonesia': 'IDR',
  'Brazil': 'BRL', 'Mexico': 'MXN',
}

// Timezone map: country → IANA timezone
const COUNTRY_TIMEZONE_MAP = {
  'Ghana': 'Africa/Accra', 'Nigeria': 'Africa/Lagos',
  'Kenya': 'Africa/Nairobi', 'Tanzania': 'Africa/Dar_es_Salaam',
  'Uganda': 'Africa/Kampala', 'South Africa': 'Africa/Johannesburg',
  'Senegal': 'Africa/Dakar', 'Ivory Coast': 'Africa/Abidjan',
  'Cameroon': 'Africa/Douala', 'Rwanda': 'Africa/Kigali',
  'Ethiopia': 'Africa/Addis_Ababa', 'Egypt': 'Africa/Cairo',
  'Morocco': 'Africa/Casablanca', 'Saudi Arabia': 'Asia/Riyadh',
  'UAE': 'Asia/Dubai', 'India': 'Asia/Kolkata',
  'Pakistan': 'Asia/Karachi', 'Bangladesh': 'Asia/Dhaka',
  'United States': 'America/New_York', 'United Kingdom': 'Europe/London',
  'Canada': 'America/Toronto', 'Australia': 'Australia/Sydney',
  'Germany': 'Europe/Berlin', 'France': 'Europe/Paris',
  'Singapore': 'Asia/Singapore', 'Malaysia': 'Asia/Kuala_Lumpur',
  'Indonesia': 'Asia/Jakarta', 'Brazil': 'America/Sao_Paulo',
  'Mexico': 'America/Mexico_City',
}

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '03/24/2026' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '24/03/2026' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2026-03-24' },
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY', example: '24 Mar 2026' },
]

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'pt', label: 'Português' },
  { code: 'ha', label: 'Hausa' },
  { code: 'yo', label: 'Yorùbá' },
  { code: 'ig', label: 'Igbo' },
  { code: 'am', label: 'አማርኛ' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'ms', label: 'Bahasa Melayu' },
]

const COUNTRIES = [
  'Ghana', 'Nigeria', 'Kenya', 'Tanzania', 'Uganda', 'South Africa', 'Senegal',
  'Ivory Coast', 'Cameroon', 'Rwanda', 'Ethiopia', 'Egypt', 'Morocco',
  'Saudi Arabia', 'UAE', 'India', 'Pakistan', 'Bangladesh',
  'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Singapore', 'Malaysia', 'Indonesia', 'Brazil', 'Mexico',
]

const CATEGORIES = [
  { value: 'fashion', label: 'Fashion & Apparel' },
  { value: 'electronics', label: 'Electronics & Gadgets' },
  { value: 'food', label: 'Food & Groceries' },
  { value: 'beauty', label: 'Beauty & Skincare' },
  { value: 'home', label: 'Home & Living' },
  { value: 'sports', label: 'Sports & Fitness' },
  { value: 'books', label: 'Books & Stationery' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'health', label: 'Health & Wellness' },
  { value: 'kids', label: 'Kids & Toys' },
  { value: 'art', label: 'Art & Crafts' },
  { value: 'other', label: 'Other' },
]

const PAYMENT_METHODS = [
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'momo', label: 'Mobile Money' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'stripe', label: 'Stripe' },
]

const TABS = [
  { id: 'store', label: 'Store', icon: Store },
  { id: 'business', label: 'Business', icon: Building2 },
  { id: 'payout', label: 'Payout', icon: CreditCard },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'preferences', label: 'Preferences', icon: Settings2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
]

export default function SettingsClient({ settings, subscription }) {
  const currency = useLocaleStore(s => s.currency)
  const router = useRouter()
  const vendor = settings?.vendor ?? {}
  const user = settings?.user ?? {}
  const isSubscribed = subscription?.isActive ?? false
  const daysLeft = subscription?.daysLeft ?? 0

  const [tab, setTab] = useState('store')

  // ── Store profile form ────────────────────────────────────────────────────
  const [store, setStore] = useState({
    store_name: vendor.store_name ?? '',
    store_handle: vendor.store_handle ?? '',
    store_tagline: vendor.store_tagline ?? '',
    store_description: vendor.store_description ?? '',
    store_category: vendor.store_category ?? '',
    store_logo_url: vendor.store_logo_url ?? '',
    store_banner_url: vendor.store_banner_url ?? '',
    store_website: vendor.store_website ?? '',
    social_instagram: vendor.social_instagram ?? '',
    social_twitter: vendor.social_twitter ?? '',
    social_facebook: vendor.social_facebook ?? '',
    social_tiktok: vendor.social_tiktok ?? '',
  })
  const [storeSaving, setStoreSaving] = useState(false)
  const [storeSaved, setStoreSaved] = useState(false)
  const [storeError, setStoreError] = useState(null)

  const handleSaveStore = async () => {
    if (!store.store_name.trim()) { setStoreError('Store name is required'); return }
    setStoreSaving(true); setStoreError(null)
    const res = await updateStoreProfile(store)
    setStoreSaving(false)
    if (res?.error) { setStoreError(res.error); return }
    setStoreSaved(true); setTimeout(() => setStoreSaved(false), 3000)
  }

  // ── Business form ─────────────────────────────────────────────────────────
  const [biz, setBiz] = useState({
    business_type: vendor.business_type ?? 'individual',
    business_reg_name: vendor.business_reg_name ?? '',
    business_reg_number: vendor.business_reg_number ?? '',
    business_email: vendor.business_email ?? '',
    business_phone: vendor.business_phone ?? '',
    business_address: vendor.business_address ?? '',
    business_city: vendor.business_city ?? '',
    business_country: vendor.business_country ?? '',
  })
  const [bizSaving, setBizSaving] = useState(false)
  const [bizSaved, setBizSaved] = useState(false)
  const [bizError, setBizError] = useState(null)

  const handleSaveBiz = async () => {
    setBizSaving(true); setBizError(null)
    const res = await updateBusinessInfo(biz)
    setBizSaving(false)
    if (res?.error) { setBizError(res.error); return }
    setBizSaved(true); setTimeout(() => setBizSaved(false), 3000)
  }

  // ── Payout form ───────────────────────────────────────────────────────────
  const [payout, setPayout] = useState({
    payment_method: vendor.payment_method ?? 'bank',
    payment_account_name: vendor.payment_account_name ?? '',
    payment_account_num: vendor.payment_account_num ?? '',
    payment_bank_name: vendor.payment_bank_name ?? '',
    payment_mobile_num: vendor.payment_mobile_num ?? '',
    payment_swift_code: vendor.payment_swift_code ?? '',
    payment_iban: vendor.payment_iban ?? '',
  })
  const [payoutSaving, setPayoutSaving] = useState(false)
  const [payoutSaved, setPayoutSaved] = useState(false)
  const [payoutError, setPayoutError] = useState(null)

  const handleSavePayout = async () => {
    setPayoutSaving(true); setPayoutError(null)
    const res = await updatePayoutDetails(payout)
    setPayoutSaving(false)
    if (res?.error) { setPayoutError(res.error); return }
    setPayoutSaved(true); setTimeout(() => setPayoutSaved(false), 3000)
  }

  // ── Shipping form ─────────────────────────────────────────────────────────
  const [ship, setShip] = useState({
    delivery_methods: vendor.delivery_methods ?? ['standard'],
    ships_nationwide: vendor.ships_nationwide ?? true,
    base_shipping_fee: vendor.base_shipping_fee ?? 0,
    free_shipping_threshold: vendor.free_shipping_threshold ?? '',
    avg_processing_days: vendor.avg_processing_days ?? 1,
  })
  const [shipSaving, setShipSaving] = useState(false)
  const [shipSaved, setShipSaved] = useState(false)

  const toggleDelivery = (method) => {
    setShip(s => ({
      ...s,
      delivery_methods: s.delivery_methods.includes(method)
        ? s.delivery_methods.filter(m => m !== method)
        : [...s.delivery_methods, method],
    }))
  }

  const handleSaveShipping = async () => {
    setShipSaving(true)
    const res = await updateShippingSettings(ship)
    setShipSaving(false)
    if (!res?.error) { setShipSaved(true); setTimeout(() => setShipSaved(false), 3000) }
  }

  // ── Preferences form ──────────────────────────────────────────────────────
  const [prefs, setPrefs] = useState({
    pref_country: vendor.pref_country ?? 'Ghana',
    pref_currency: vendor.pref_currency ?? 'GHS',
    pref_language: vendor.pref_language ?? 'en',
    pref_timezone: vendor.pref_timezone ?? 'Africa/Accra',
    pref_date_format: vendor.pref_date_format ?? 'DD/MM/YYYY',
    pref_weight_unit: vendor.pref_weight_unit ?? 'kg',
    pref_distance_unit: vendor.pref_distance_unit ?? 'km',
  })
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [prefsSaved, setPrefsSaved] = useState(false)
  const [prefsError, setPrefsError] = useState(null)

  // When country changes → auto-fill currency + timezone
  const handleCountryChange = (country) => {
    const currency = COUNTRY_CURRENCY_MAP[country] ?? prefs.pref_currency
    const timezone = COUNTRY_TIMEZONE_MAP[country] ?? prefs.pref_timezone
    setPrefs(p => ({ ...p, pref_country: country, pref_currency: currency, pref_timezone: timezone }))
  }

  // When currency changes manually
  const handleCurrencyChange = (code) => {
    setPrefs(p => ({ ...p, pref_currency: code }))
  }

  const handleSavePrefs = async () => {
    setPrefsSaving(true); setPrefsError(null)
    const res = await updatePreferences(prefs)
    setPrefsSaving(false)
    if (res?.error) { setPrefsError(res.error); return }
    setPrefsSaved(true); setTimeout(() => setPrefsSaved(false), 3000)
  }

  // Live currency preview based on current selection
  const selectedCurrency = CURRENCIES.find(c => c.code === prefs.pref_currency) ?? CURRENCIES[0]
  const previewPrice = formatCurrency(49999, selectedCurrency.code)

  // ── Notifications form ────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState({
    notif_new_order: vendor.notif_new_order ?? true,
    notif_order_update: vendor.notif_order_update ?? true,
    notif_new_message: vendor.notif_new_message ?? true,
    notif_low_stock: vendor.notif_low_stock ?? true,
    notif_low_stock_threshold: vendor.notif_low_stock_threshold ?? 5,
    notif_review: vendor.notif_review ?? true,
    notif_circle: vendor.notif_circle ?? true,
    notif_campaign: vendor.notif_campaign ?? true,
    notif_payout: vendor.notif_payout ?? true,
    notif_email: vendor.notif_email ?? true,
    notif_push: vendor.notif_push ?? true,
  })
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifSaved, setNotifSaved] = useState(false)

  const handleSaveNotifs = async () => {
    setNotifSaving(true)
    const res = await updateNotificationPrefs(notifs)
    setNotifSaving(false)
    if (!res?.error) { setNotifSaved(true); setTimeout(() => setNotifSaved(false), 3000) }
  }

  // ── Password form ─────────────────────────────────────────────────────────
  const [pwd, setPwd] = useState({ current: '', newPwd: '', confirm: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdError, setPwdError] = useState(null)
  const [pwdSaved, setPwdSaved] = useState(false)

  const handleSavePwd = async () => {
    if (!pwd.newPwd) { setPwdError('New password is required'); return }
    if (pwd.newPwd.length < 8) { setPwdError('Password must be at least 8 characters'); return }
    if (pwd.newPwd !== pwd.confirm) { setPwdError('Passwords do not match'); return }
    setPwdSaving(true); setPwdError(null)
    const res = await updatePassword(pwd.current, pwd.newPwd)
    setPwdSaving(false)
    if (res?.error) { setPwdError(res.error); return }
    setPwdSaved(true); setPwd({ current: '', newPwd: '', confirm: '' })
    setTimeout(() => setPwdSaved(false), 3000)
  }

  // ── Deactivate ────────────────────────────────────────────────────────────
  const [showDeactivate, setShowDeactivate] = useState(false)
  const [deactivateReason, setDeactivateReason] = useState('')
  const [deactivating, setDeactivating] = useState(false)

  const handleDeactivate = async () => {
    if (!deactivateReason.trim()) return
    setDeactivating(true)
    const res = await deactivateStore(deactivateReason)
    if (!res?.error) router.push('/vendor/onboarding')
    setDeactivating(false)
  }

  const verStatus = vendor.verification_status ?? 'unverified'
  const verBadgeColor =
    verStatus === 'verified' ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : verStatus === 'pending' ? 'text-amber-600 bg-amber-50 border-amber-200'
        : 'text-neutral-500 bg-neutral-100 border-neutral-200'

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-1">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-brand/10 text-brand text-[10px] font-black rounded-full uppercase tracking-widest">Configuration Engine</span>
            <span className="w-1 h-1 rounded-full bg-neutral-300" />
            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Store Node: {vendor.id?.slice(0, 8)}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-brand-900 tracking-tighter uppercase">
            Store <span className="text-brand">Settings</span>
          </h1>
          <p className="text-sm text-neutral-400 font-bold mt-2 uppercase tracking-widest opacity-80">
            Global parameters and brand identity
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center bg-white border border-neutral-100 rounded-[2.5rem] p-1.5 gap-1.5 shadow-sm overflow-x-auto no-scrollbar scroll-smooth">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2.5 px-6 py-3 rounded-full text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-[0.15em]',
                tab === t.id
                  ? 'bg-brand text-white shadow-xl shadow-brand/20'
                  : 'text-neutral-400 hover:text-brand-900 hover:bg-neutral-50',
              )}>
              <Icon size={14} strokeWidth={3} />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── STORE PROFILE ──────────────────────────────────────────────────── */}
      {tab === 'store' && (
        <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Section icon={Store} title="Store Identity" desc="How buyers see your brand across Novara">

            {/* Status badges */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn('inline-flex items-center gap-2 text-[10px] font-black px-4 py-2 rounded-full border shadow-sm uppercase tracking-widest', verBadgeColor)}>
                <BadgeCheck size={14} strokeWidth={3} />
                {verStatus === 'verified' ? 'Verified Partner'
                  : verStatus === 'pending' ? 'Verification Pending'
                    : 'Unverified Store'}
              </span>
              {isSubscribed && (
                <span className="inline-flex items-center gap-2 text-[10px] font-black px-4 py-2 rounded-full border bg-amber-400 text-white border-amber-300 shadow-lg shadow-amber-500/20 uppercase tracking-widest">
                  <Crown size={14} strokeWidth={3} /> Pro Member · {daysLeft}D Left
                </span>
              )}
            </div>

            {/* Store Assets Preview */}
            <div className="space-y-8 pt-4">
              <div className="relative">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Branding Assets</p>
                <div className="space-y-6">
                   {/* Banner */}
                   <div className="relative">
                     <AvatarUploader
                       current={store.store_banner_url}
                       bucket="vendor-logos"
                       path={`banners/${vendor.id}`}
                       onUploaded={url => setStore(s => ({ ...s, store_banner_url: url }))}
                       shape="wide"
                     />
                     {/* Logo Overlay on Banner for Preview feel */}
                     <div className="absolute -bottom-6 left-6 sm:left-8">
                       <AvatarUploader
                         current={store.store_logo_url}
                         bucket="vendor-logos"
                         path={`logos/${vendor.id}`}
                         onUploaded={url => setStore(s => ({ ...s, store_logo_url: url }))}
                         shape="circle"
                       />
                     </div>
                   </div>
                   <div className="pt-8 pl-4 sm:pl-6">
                      <p className="text-[11px] text-neutral-400 font-bold leading-relaxed max-w-md opacity-80 italic">
                        "Your logo and banner define your brand identity. High-quality visuals increase buyer trust by up to 40%."
                      </p>
                   </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Store Name" required error={storeError && !store.store_name ? storeError : null}>
                  <Input value={store.store_name}
                    onChange={e => setStore(s => ({ ...s, store_name: e.target.value }))}
                    placeholder="e.g. Urban Threads" />
                </Field>
                <Field label="Store Handle" hint="Your unique @handle for URLs">
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-300 text-sm font-black">@</span>
                    <Input value={store.store_handle}
                      onChange={e => setStore(s => ({ ...s, store_handle: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                      placeholder="username" className="pl-10" />
                  </div>
                </Field>
              </div>

              <Field label="Tagline" hint="Short brand summary (max 100 chars)">
                <Input value={store.store_tagline}
                  onChange={e => setStore(s => ({ ...s, store_tagline: e.target.value }))}
                  placeholder="Elevating your everyday style" maxLength={100} />
              </Field>

              <Field label="Store Description">
                <textarea rows={4} value={store.store_description}
                  onChange={e => setStore(s => ({ ...s, store_description: e.target.value }))}
                  placeholder="Tell your story, your mission, and what makes your products unique…"
                  className="w-full rounded-3xl border border-neutral-100 bg-neutral-50/30 px-6 py-5 text-sm text-brand-900 font-bold placeholder:text-neutral-300 focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all resize-none leading-relaxed" />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Primary Category">
                  <Select value={store.store_category}
                    onChange={e => setStore(s => ({ ...s, store_category: e.target.value }))}>
                    <option value="">Select Category</option>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </Select>
                </Field>
                <Field label="Official Website">
                  <div className="relative">
                    <Globe size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-300 pointer-events-none" />
                    <Input value={store.store_website}
                      onChange={e => setStore(s => ({ ...s, store_website: e.target.value }))}
                      placeholder="https://yourstore.com" className="pl-11" />
                  </div>
                </Field>
              </div>
            </div>
          </Section>

          <Section icon={Instagram} title="Social Connectivity" desc="Link your handles to grow your following">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { key: 'social_instagram', icon: Instagram, placeholder: 'instagram.com/handle', label: 'Instagram' },
                { key: 'social_twitter', icon: Twitter, placeholder: 'twitter.com/handle', label: 'Twitter / X' },
                { key: 'social_facebook', icon: Facebook, placeholder: 'facebook.com/page', label: 'Facebook' },
                { key: 'social_tiktok', icon: AtSign, placeholder: 'tiktok.com/@handle', label: 'TikTok' },
              ].map(s => (
                <Field key={s.key} label={s.label}>
                  <div className="relative">
                    <s.icon size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-300 pointer-events-none" />
                    <Input value={store[s.key]}
                      onChange={e => setStore(st => ({ ...st, [s.key]: e.target.value }))}
                      placeholder={s.placeholder} className="pl-11" />
                  </div>
                </Field>
              ))}
            </div>
          </Section>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
             <div className="flex-1">
               <p className="text-[11px] text-neutral-400 font-black uppercase tracking-widest opacity-60">Last sync: Just now</p>
             </div>
             <SaveButton loading={storeSaving} saved={storeSaved} onClick={handleSaveStore} />
          </div>
        </div>
      )}

      {/* ── BUSINESS INFO ──────────────────────────────────────────────────── */}
      {tab === 'business' && (
        <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Section icon={Building2} title="Legal Business Profile" desc="Registered business and contact information">
            <Field label="Business Type">
              <Select value={biz.business_type}
                onChange={e => setBiz(b => ({ ...b, business_type: e.target.value }))}>
                <option value="individual">Individual / Sole Trader</option>
                <option value="small_business">Small Business</option>
                <option value="company">Registered Company</option>
                <option value="cooperative">Cooperative</option>
              </Select>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field label="Legal / Registered Name">
                <Input value={biz.business_reg_name}
                  onChange={e => setBiz(b => ({ ...b, business_reg_name: e.target.value }))}
                  placeholder="Your legal entity name" />
              </Field>
              <Field label="Registration Number" hint="Official registration ID">
                <Input value={biz.business_reg_number}
                  onChange={e => setBiz(b => ({ ...b, business_reg_number: e.target.value }))}
                  placeholder="e.g. BN-1234567" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field label="Contact Email" required>
                <Input type="email" value={biz.business_email}
                  onChange={e => setBiz(b => ({ ...b, business_email: e.target.value }))}
                  placeholder="business@email.com" />
              </Field>
              <Field label="Contact Phone" required>
                <Input type="tel" value={biz.business_phone}
                  onChange={e => setBiz(b => ({ ...b, business_phone: e.target.value }))}
                  placeholder="+1 234 567 8900" />
              </Field>
            </div>
            <Field label="Business Address">
              <Input value={biz.business_address}
                onChange={e => setBiz(b => ({ ...b, business_address: e.target.value }))}
                placeholder="Street address, suite, etc." />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field label="City">
                <Input value={biz.business_city}
                  onChange={e => setBiz(b => ({ ...b, business_city: e.target.value }))}
                  placeholder="City" />
              </Field>
              <Field label="Country">
                <Select value={biz.business_country}
                  onChange={e => setBiz(b => ({ ...b, business_country: e.target.value }))}>
                  <option value="">Select country…</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
            </div>
          </Section>

          <Section icon={Shield} title="Account & Verification" desc="Your account standing on Novara">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
               <div className="p-6 bg-neutral-50/50 rounded-3xl border border-neutral-100 flex flex-col gap-1">
                 <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest opacity-60">Account Email</p>
                 <p className="text-sm font-black text-brand-900 truncate">{user.email}</p>
               </div>
               <div className="p-6 bg-neutral-50/50 rounded-3xl border border-neutral-100 flex flex-col gap-1">
                 <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest opacity-60">Member Since</p>
                 <p className="text-sm font-black text-brand-900">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : '—'}
                 </p>
               </div>
               <div className={cn(
                 'p-6 rounded-3xl border flex flex-col gap-1',
                 verBadgeColor.replace('bg-', 'bg-opacity-10 bg-')
               )}>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</p>
                 <p className="text-sm font-black uppercase tracking-tight">
                    {verStatus === 'verified' ? '✓ Verified' : verStatus === 'pending' ? '⏳ Pending' : '✗ Unverified'}
                 </p>
               </div>
            </div>
          </Section>

          <div className="flex justify-end pt-4">
            <SaveButton loading={bizSaving} saved={bizSaved} onClick={handleSaveBiz} />
          </div>
        </div>
      )}

      {/* ── PAYOUT ─────────────────────────────────────────────────────────── */}
      {tab === 'payout' && (
        <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Section icon={CreditCard} title="Settlement Details" desc="Securely receive your earnings">
            <div className="bg-amber-50 rounded-3xl border border-amber-100 p-6 flex flex-col sm:flex-row items-start gap-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 flex items-center justify-center shrink-0">
                 <AlertCircle size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-black text-amber-900 uppercase tracking-tight">Escrow Payout Notice</p>
                <p className="text-[11px] text-amber-800/80 font-bold leading-relaxed mt-1">
                  Payments are released automatically after buyers confirm delivery or the protection period ends. 
                  Ensure your details are accurate to avoid settlement delays.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <Field label="Payout Method" required>
                <Select value={payout.payment_method}
                  onChange={e => setPayout(p => ({ ...p, payment_method: e.target.value }))}>
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </Select>
              </Field>
              <Field label="Account Holder Name" required>
                <Input value={payout.payment_account_name}
                  onChange={e => setPayout(p => ({ ...p, payment_account_name: e.target.value }))}
                  placeholder="Full name as it appears on bank" />
              </Field>
            </div>

            <Field label="Account Number / Wallet ID" required>
              <Input value={payout.payment_account_num}
                onChange={e => setPayout(p => ({ ...p, payment_account_num: e.target.value }))}
                placeholder="0000 0000 0000 0000" className="font-mono text-base" />
            </Field>

            {payout.payment_method === 'bank' && (
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-6 animate-in slide-in-from-top-2">
                <Field label="Bank Name">
                  <Input value={payout.payment_bank_name}
                    onChange={e => setPayout(p => ({ ...p, payment_bank_name: e.target.value }))}
                    placeholder="e.g. Standard Chartered Bank" />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Field label="SWIFT / BIC Code">
                    <Input value={payout.payment_swift_code}
                      onChange={e => setPayout(p => ({ ...p, payment_swift_code: e.target.value }))}
                      placeholder="e.g. SCBLNG" className="font-mono uppercase" />
                  </Field>
                  <Field label="IBAN Number" hint="For cross-border payments">
                    <Input value={payout.payment_iban}
                      onChange={e => setPayout(p => ({ ...p, payment_iban: e.target.value }))}
                      placeholder="NG73 1234 5678…" className="font-mono uppercase" />
                  </Field>
                </div>
              </div>
            )}

            {['mpesa', 'momo'].includes(payout.payment_method) && (
              <Field label="Mobile Money Number">
                <Input type="tel" value={payout.payment_mobile_num}
                  onChange={e => setPayout(p => ({ ...p, payment_mobile_num: e.target.value }))}
                  placeholder="+254 7XX XXX XXX" />
              </Field>
            )}
          </Section>

          <Section icon={Crown} title="Pro Membership Status" desc="Manage your growth subscription">
            {isSubscribed ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-2">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Crown size={32} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-black text-brand-900 uppercase tracking-tight">Pro Plan Active</p>
                      <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full border border-emerald-200 uppercase tracking-widest">Active</span>
                    </div>
                    <p className="text-xs text-neutral-400 font-bold mt-1 uppercase tracking-widest">{daysLeft} days remaining in your period</p>
                  </div>
                </div>
                <Link href="/vendor/marketing/subscribe"
                  className="w-full sm:w-auto px-8 py-4 bg-white border border-neutral-100 rounded-2xl text-[10px] font-black text-brand hover:border-brand transition-all flex items-center justify-center gap-2 shadow-sm uppercase tracking-widest">
                  Renew or Upgrade <ChevronRight size={14} strokeWidth={3} />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-2">
                <div className="text-center sm:text-left">
                  <p className="text-lg font-black text-brand-900 uppercase tracking-tight">Free Tier</p>
                  <p className="text-xs text-neutral-400 font-bold mt-1 uppercase tracking-widest">Unlock premium tools and campaign visibility</p>
                </div>
                <Link href="/vendor/marketing/subscribe"
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-brand text-white text-xs font-black hover:bg-brand-700 transition-all shadow-xl shadow-brand/20 uppercase tracking-widest">
                  <Crown size={16} strokeWidth={3} className="text-amber-300" /> Get Pro Now
                </Link>
              </div>
            )}
          </Section>

          <div className="flex justify-end pt-4">
            <SaveButton loading={payoutSaving} saved={payoutSaved} onClick={handleSavePayout} />
          </div>
        </div>
      )}

      {/* ── SHIPPING ───────────────────────────────────────────────────────── */}
      {tab === 'shipping' && (
        <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Section icon={Truck} title="Logistics & Delivery" desc="Configure how you reach your customers">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { value: 'standard', label: 'Standard Delivery', desc: 'Default shipping (3-5 days)', icon: Truck },
                { value: 'express', label: 'Express Priority', desc: 'Next-day delivery (24h)', icon: Zap },
                { value: 'pickup', label: 'Store Pickup', desc: 'Self-collection points', icon: Building2 },
                { value: 'digital', label: 'Digital Transfer', desc: 'Instant file downloads', icon: Globe },
              ].map(m => {
                const checked = ship.delivery_methods.includes(m.value)
                return (
                  <button key={m.value} type="button" onClick={() => toggleDelivery(m.value)}
                    className={cn(
                      'w-full flex items-center gap-4 px-6 py-5 rounded-[1.5rem] border-2 text-left transition-all group relative overflow-hidden',
                      checked ? 'border-brand bg-brand/5 shadow-lg shadow-brand/5' : 'border-neutral-100 hover:border-neutral-200 bg-white',
                    )}>
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300',
                      checked ? 'bg-brand text-white' : 'bg-neutral-50 text-neutral-400',
                    )}>
                      <m.icon size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-black uppercase tracking-tight', checked ? 'text-brand-900' : 'text-neutral-400 group-hover:text-neutral-600')}>{m.label}</p>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5 opacity-60">{m.desc}</p>
                    </div>
                    <div className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                      checked ? 'bg-brand border-brand' : 'border-neutral-100',
                    )}>
                      {checked && <CheckCircle2 size={12} strokeWidth={3} className="text-white" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </Section>

          <Section icon={Package} title="Rates & Processing" desc="Automate your shipping cost calculations">
            <div className="p-2">
              <Toggle
                checked={ship.ships_nationwide}
                onChange={v => setShip(s => ({ ...s, ships_nationwide: v }))}
                label="Enable Nationwide Shipping"
                desc="Expand your reach to every region in your primary country"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-4">
              <Field label="Base Shipping Fee">
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-300 text-sm font-black pointer-events-none">
                    {currency.symbol}
                  </span>
                  <Input type="number" min="0" step="0.01"
                    value={ship.base_shipping_fee}
                    onChange={e => setShip(s => ({ ...s, base_shipping_fee: e.target.value }))}
                    placeholder="0.00" className="pl-11 text-base" />
                </div>
              </Field>
              <Field label="Free Shipping From" hint="Minimum order total">
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-300 text-sm font-black pointer-events-none">
                    {currency.symbol}
                  </span>
                  <Input type="number" min="0" step="0.01"
                    value={ship.free_shipping_threshold}
                    onChange={e => setShip(s => ({ ...s, free_shipping_threshold: e.target.value }))}
                    placeholder="0.00" className="pl-11 text-base" />
                </div>
              </Field>
              <Field label="Order Processing" hint="Est. prep time">
                <Select value={ship.avg_processing_days}
                  onChange={e => setShip(s => ({ ...s, avg_processing_days: e.target.value }))}>
                  {[1, 2, 3, 5, 7, 14].map(d => (
                    <option key={d} value={d}>{d} Day{d !== 1 ? 's' : ''}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </Section>

          <div className="flex justify-end pt-4">
            <SaveButton loading={shipSaving} saved={shipSaved} onClick={handleSaveShipping} />
          </div>
        </div>
      )}

      {/* ── PREFERENCES ────────────────────────────────────────────────────── */}
      {tab === 'preferences' && (
        <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Live preview card */}
          <div className="rounded-[2.5rem] border border-neutral-100 bg-gradient-to-br from-brand/10 to-white p-8 sm:p-10 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand/60 mb-6">Display Engine Preview</p>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[2rem] bg-white shadow-xl shadow-brand/10 flex items-center justify-center text-4xl border border-brand/5 animate-in zoom-in-50 duration-500">
                    {selectedCurrency.flag}
                  </div>
                  <div>
                    <p className="text-4xl font-black text-brand-900 tracking-tighter leading-none">{previewPrice}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="px-2 py-1 bg-brand text-white text-[10px] font-black rounded-lg uppercase tracking-widest">{selectedCurrency.code}</span>
                      <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest opacity-80">{selectedCurrency.name}</p>
                    </div>
                  </div>
                </div>
                <div className="pt-6 sm:pt-0 sm:pl-8 sm:border-l border-brand/10 text-left sm:text-right space-y-1.5 shrink-0">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest opacity-60">System Context</p>
                  <p className="text-xs font-black text-brand-900 uppercase tracking-tight">{prefs.pref_country}</p>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{prefs.pref_timezone?.split('/').pop().replace('_', ' ')}</p>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{prefs.pref_date_format}</p>
                </div>
              </div>
            </div>
          </div>

          <Section icon={Globe} title="Regional Settings" desc="Configure your store's primary market">
            <Field label="Market Country" hint="Sets default currency and local timezone automatically">
              <Select
                value={prefs.pref_country}
                onChange={e => handleCountryChange(e.target.value)}
              >
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>

            <div className="pt-4">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4">Select Store Currency</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCurrencyChange(c.code)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all group',
                      prefs.pref_currency === c.code
                        ? 'border-brand bg-brand/5 shadow-lg shadow-brand/5'
                        : 'border-neutral-50 hover:border-neutral-200 bg-white'
                    )}
                  >
                    <span className="text-xl leading-none shrink-0 group-hover:scale-110 transition-transform">{c.flag}</span>
                    <div className="min-w-0">
                      <span className={cn('text-xs font-black uppercase tracking-tight block', prefs.pref_currency === c.code ? 'text-brand' : 'text-brand-900')}>{c.code}</span>
                      <span className="text-[9px] text-neutral-300 font-bold uppercase tracking-widest truncate block mt-0.5">{c.symbol}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section icon={Settings2} title="Interface & Measurement" desc="Dashboard display and reporting formats">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <Field label="Dashboard Language">
                <Select
                  value={prefs.pref_language}
                  onChange={e => setPrefs(p => ({ ...p, pref_language: e.target.value }))}
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </Select>
              </Field>

              <Field label="System Timezone">
                <Select
                  value={prefs.pref_timezone}
                  onChange={e => setPrefs(p => ({ ...p, pref_timezone: e.target.value }))}
                >
                  {Object.entries(COUNTRY_TIMEZONE_MAP).map(([country, tz]) => (
                    <option key={tz} value={tz}>
                      {tz.replace('_', ' ')} · {country}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Preferred Date Format">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DATE_FORMATS.map(f => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setPrefs(p => ({ ...p, pref_date_format: f.value }))}
                    className={cn(
                      'px-4 py-4 rounded-2xl border-2 text-left transition-all',
                      prefs.pref_date_format === f.value
                        ? 'border-brand bg-brand/5'
                        : 'border-neutral-50 hover:border-neutral-200 bg-white'
                    )}
                  >
                    <p className={cn('text-[10px] font-black uppercase tracking-widest', prefs.pref_date_format === f.value ? 'text-brand' : 'text-brand-900')}>
                      {f.label}
                    </p>
                    <p className="text-[10px] text-neutral-400 font-bold mt-1 opacity-60">{f.example}</p>
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
              <Field label="Mass / Weight Units">
                <div className="flex p-1 bg-neutral-50 rounded-2xl border border-neutral-100">
                  {['kg', 'lb'].map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setPrefs(p => ({ ...p, pref_weight_unit: u }))}
                      className={cn(
                        'flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all',
                        prefs.pref_weight_unit === u
                          ? 'bg-white text-brand shadow-sm'
                          : 'text-neutral-400 hover:text-brand-900'
                      )}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Distance Units">
                <div className="flex p-1 bg-neutral-50 rounded-2xl border border-neutral-100">
                  {['km', 'mi'].map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setPrefs(p => ({ ...p, pref_distance_unit: u }))}
                      className={cn(
                        'flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all',
                        prefs.pref_distance_unit === u
                          ? 'bg-white text-brand shadow-sm'
                          : 'text-neutral-400 hover:text-brand-900'
                      )}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </Section>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
             <div className="flex-1">
               <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest italic opacity-60 leading-relaxed max-w-sm">
                 * Changes to regional preferences only affect your dashboard experience and reporting. Buyer prices remain in store currency.
               </p>
             </div>
             <SaveButton loading={prefsSaving} saved={prefsSaved} onClick={handleSavePrefs} />
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS ──────────────────────────────────────────────────── */}
      {tab === 'notifications' && (
        <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Section icon={Bell} title="Event Subscriptions"
            desc="Control what activities trigger system alerts">
            <div className="divide-y divide-neutral-50">
              <Toggle checked={notifs.notif_new_order} onChange={v => setNotifs(n => ({ ...n, notif_new_order: v }))}
                label="New Sales Orders" desc="Immediate alerts when a buyer completes a checkout" />
              <Toggle checked={notifs.notif_order_update} onChange={v => setNotifs(n => ({ ...n, notif_order_update: v }))}
                label="Status Transitions" desc="Logistics updates, delivery confirmations, and disputes" />
              <Toggle checked={notifs.notif_new_message} onChange={v => setNotifs(n => ({ ...n, notif_new_message: v }))}
                label="Direct Messages" desc="In-app chat alerts from buyers and administrators" />
              <Toggle checked={notifs.notif_review} onChange={v => setNotifs(n => ({ ...n, notif_review: v }))}
                label="Marketplace Feedback" desc="New ratings and detailed customer reviews" />
              <Toggle checked={notifs.notif_circle} onChange={v => setNotifs(n => ({ ...n, notif_circle: v }))}
                label="Community Insights" desc="Activity in your subscribed merchant circles" />
              <Toggle checked={notifs.notif_payout} onChange={v => setNotifs(n => ({ ...n, notif_payout: v }))}
                label="Settlement Alerts" desc="Confirmation when funds are released to your bank" />
              <div className="pt-4 space-y-4">
                <Toggle checked={notifs.notif_low_stock} onChange={v => setNotifs(n => ({ ...n, notif_low_stock: v }))}
                  label="Inventory Thresholds" desc="Automated alerts when product stock levels are critical" />
                {notifs.notif_low_stock && (
                  <div className="ml-10 p-6 bg-neutral-50 rounded-3xl border border-neutral-100 animate-in slide-in-from-top-4">
                    <Field label="Minimum Alert Threshold" hint="Unit count to trigger alert">
                      <Input type="number" min="1" max="500"
                        value={notifs.notif_low_stock_threshold}
                        onChange={e => setNotifs(n => ({ ...n, notif_low_stock_threshold: e.target.value }))}
                        className="max-w-[160px] text-center" />
                    </Field>
                  </div>
                )}
              </div>
            </div>
          </Section>

          <Section icon={Volume2} title="Delivery Channels"
            desc="Configure your preferred alert destination">
            <div className="divide-y divide-neutral-50">
              <Toggle checked={notifs.notif_email} onChange={v => setNotifs(n => ({ ...n, notif_email: v }))}
                label="Email Broadcasts" desc={`Official records sent to ${user.email}`} />
              <Toggle checked={notifs.notif_push} onChange={v => setNotifs(n => ({ ...n, notif_push: v }))}
                label="Native Push Alerts" desc="Browser and mobile system-level notifications" />
            </div>
          </Section>

          <div className="flex justify-end pt-4">
            <SaveButton loading={notifSaving} saved={notifSaved} onClick={handleSaveNotifs} />
          </div>
        </div>
      )}

      {/* ── SECURITY ───────────────────────────────────────────────────────── */}
      {tab === 'security' && (
        <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Section icon={Shield} title="Access & Security" desc="Manage your account credentials">
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-6">
              <Field label="Current Password">
                <div className="relative">
                  <Input type={showPwd ? 'text' : 'password'}
                    value={pwd.current}
                    onChange={e => setPwd(p => ({ ...p, current: e.target.value }))}
                    placeholder="Verification required" />
                  <button type="button" onClick={() => setShowPwd(s => !s)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-brand transition-colors">
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="New Secure Password" hint="Minimum 8 characters">
                  <Input type={showPwd ? 'text' : 'password'}
                    value={pwd.newPwd}
                    onChange={e => setPwd(p => ({ ...p, newPwd: e.target.value }))}
                    placeholder="New password" />
                </Field>
                <Field label="Repeat New Password">
                  <Input type={showPwd ? 'text' : 'password'}
                    value={pwd.confirm}
                    onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Confirm password" />
                </Field>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <SaveButton loading={pwdSaving} saved={pwdSaved}
                disabled={!pwd.newPwd || pwd.newPwd !== pwd.confirm} onClick={handleSavePwd} label="Update Credentials" />
            </div>
          </Section>

          <Section icon={BadgeCheck} title="Trust & Verification" desc="Your marketplace standing">
            <div className={cn('p-8 rounded-[2.5rem] border-2 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left transition-all', 
              verStatus === 'verified' ? 'bg-emerald-50/30 border-emerald-100' : 'bg-neutral-50 border-neutral-100')}>
              <div className={cn('w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg', 
                verStatus === 'verified' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-neutral-200 text-neutral-400')}>
                <BadgeCheck size={32} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="text-lg font-black text-brand-900 uppercase tracking-tight">
                  {verStatus === 'verified' ? 'Verified Merchant Partner'
                    : verStatus === 'pending' ? 'Identity Verification Pending'
                      : 'Merchant Identity Unverified'}
                </p>
                <p className="text-[11px] text-neutral-400 font-bold mt-1 uppercase tracking-widest leading-relaxed">
                  {verStatus === 'verified'
                    ? 'Your store proudly displays the verified badge to all customers.'
                    : verStatus === 'pending'
                      ? 'Our compliance team is currently reviewing your documentation.'
                      : 'Complete identity verification to increase sales by up to 50%.'}
                </p>
              </div>
              {verStatus === 'unverified' && (
                <Link href="/vendor/onboarding?step=6"
                  className="w-full sm:w-auto px-8 py-4 bg-brand text-white rounded-2xl text-[10px] font-black hover:bg-brand-700 transition-all shadow-xl shadow-brand/20 uppercase tracking-widest flex items-center justify-center gap-2">
                  Verify Now <ExternalLink size={14} strokeWidth={3} />
                </Link>
              )}
            </div>
          </Section>

          {/* Danger zone */}
          <div className="bg-rose-50/30 rounded-[2.5rem] border-2 border-rose-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-rose-100 bg-rose-50/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                  <Trash2 size={20} className="text-rose-500" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-black text-rose-900 text-sm uppercase tracking-tight">Critical Actions</h3>
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-0.5 opacity-80">Irreversible store operations</p>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-6">
              {!showDeactivate ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <p className="text-sm font-black text-brand-900 uppercase tracking-tight">Deactivate Marketplace Presence</p>
                    <p className="text-[11px] text-neutral-400 font-bold mt-1 uppercase tracking-widest opacity-60">
                      Take your store offline. All data and inventory will be preserved.
                    </p>
                  </div>
                  <button onClick={() => setShowDeactivate(true)}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl border-2 border-rose-100 text-rose-500 text-[10px] font-black hover:bg-rose-500 hover:text-white transition-all uppercase tracking-widest">
                    Begin Deactivation
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-top-4">
                  <p className="text-sm font-black text-rose-900 uppercase tracking-tight">Confirm Deactivation</p>
                  <textarea rows={3}
                    value={deactivateReason}
                    onChange={e => setDeactivateReason(e.target.value)}
                    placeholder="Optional: Please share why you are leaving…"
                    className="w-full rounded-[1.5rem] border border-rose-100 bg-white px-6 py-5 text-sm placeholder:text-neutral-300 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all resize-none font-bold" />
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={() => setShowDeactivate(false)}
                      className="flex-1 py-4.5 rounded-2xl border-2 border-neutral-100 text-[10px] font-black text-neutral-400 hover:text-brand-900 transition-all uppercase tracking-widest">
                      Cancel
                    </button>
                    <button onClick={handleDeactivate}
                      disabled={deactivating}
                      className="flex-1 flex items-center justify-center gap-3 py-4.5 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white font-black text-[10px] shadow-xl shadow-rose-500/20 uppercase tracking-widest">
                      {deactivating ? <RefreshCw size={16} className="animate-spin" /> : <><Trash2 size={16} strokeWidth={3} /> Finalize Deactivation</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}