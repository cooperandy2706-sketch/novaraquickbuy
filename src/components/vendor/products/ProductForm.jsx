'use client'
// FILE: src/components/vendor/products/ProductForm.jsx

import { useState, useCallback } from 'react'
import { useRouter }             from 'next/navigation'
import {
  Package, Image as ImageIcon, Tag, DollarSign,
  BarChart3, Layers, Globe, ChevronRight, ChevronLeft,
  Plus, Trash2, AlertCircle, Info, Save,
} from 'lucide-react'
import { createProduct, updateProduct } from '@/lib/actions/products'
import { useAuth }                      from '@/hooks/useAuth'
import ProductImageUploader             from '@/components/vendor/products/ProductImageUploader'
import { cn } from '@/utils/cn'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'

const CATEGORIES = [
  'Fashion & Apparel', 'Electronics & Gadgets', 'Food & Groceries',
  'Beauty & Skincare', 'Home & Living', 'Sports & Fitness',
  'Books & Stationery', 'Automotive', 'Health & Wellness',
  'Kids & Toys', 'Art & Crafts', 'Other',
]

const PRODUCT_TYPES = [
  { value: 'physical',  label: 'Physical',  desc: 'Shipped to the buyer',             emoji: '📦' },
  { value: 'digital',   label: 'Digital',   desc: 'Downloadable file or link',         emoji: '💾' },
  { value: 'service',   label: 'Service',   desc: 'Booking or service appointment',    emoji: '🛎' },
  { value: 'variable',  label: 'Variable',  desc: 'Has sizes, colors or other options', emoji: '🎨' },
]

const VARIANT_TYPES = ['Size', 'Color', 'Material', 'Style', 'Weight', 'Pack Size', 'Custom']

// ── Reusable field wrapper ────────────────────────────────────────────────────
function Field({ label, required, hint, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-primary">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-muted leading-relaxed">{hint}</p>}
      {children}
      {error && <p className="text-xs text-danger font-medium mt-1">{error}</p>}
    </div>
  )
}

function TextInput({ icon: Icon, error, textarea, rows = 3, ...props }) {
  const base = cn(
    'w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm text-primary placeholder:text-muted',
    'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all',
    Icon && 'pl-10',
    error ? 'border-danger/50 bg-danger/5' : 'border-border hover:border-brand/40',
  )
  return (
    <div className="relative">
      {Icon && <Icon size={15} className="absolute left-3.5 top-3.5 text-muted pointer-events-none" />}
      {textarea
        ? <textarea {...props} rows={rows} className={base} />
        : <input {...props} className={base} />
      }
    </div>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-surface-2 rounded-2xl border border-border shadow-sm text-primary">
      <div className="px-6 py-4 border-b border-border bg-surface-3/30 rounded-t-2xl overflow-hidden">
        <h3 className="font-bold text-primary text-sm flex items-center gap-2">
          <Icon size={14} className="text-brand" /> {title}
        </h3>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  )
}

// ── Main form component ───────────────────────────────────────────────────────
export default function ProductForm({ product }) {
  const router    = useRouter()
  const currency  = useLocaleStore(s => s.currency)
  const sym       = formatCurrency(0, currency).replace(/[0-9.,\s]/g, '')
  const isEditing  = !!product
  const { profile } = useAuth()
  const vendorId    = profile?.vendor?.id ?? null

  const [form, setForm] = useState({
    name:             product?.name             ?? '',
    description:      product?.description      ?? '',
    product_type:     product?.product_type     ?? 'physical',
    category:         product?.category         ?? '',
    price:            product?.price            ?? '',
    compare_at_price: product?.compare_at_price ?? '',
    cost_per_item:    product?.cost_per_item    ?? '',
    sku:              product?.sku              ?? '',
    barcode:          product?.barcode          ?? '',
    stock_quantity:   product?.stock_quantity   ?? '',
    is_digital:       product?.is_digital       ?? false,
    digital_url:      product?.digital_url      ?? '',
    images:           product?.images           ?? [],
    status:           product?.status           ?? 'draft',
    // SEO
    seo_title:        product?.seo_title        ?? '',
    seo_description:  product?.seo_description  ?? '',
    // Shipping
    weight:           product?.weight           ?? '',
    weight_unit:      product?.weight_unit      ?? 'kg',
    requires_shipping:product?.requires_shipping ?? true,
  })

  const [variants, setVariants] = useState(product?.variants ?? [])
  const [errors,   setErrors]   = useState({})
  const [loading,  setLoading]  = useState(false)
  const [saveAs,   setSaveAs]   = useState(null) // 'draft' or 'active'

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }))
  }


  // ── Variants ──────────────────────────────────────────────────────────────
  const addVariant = () => setVariants(v => [...v, { name: '', options: {}, price: '', stock_quantity: '', sku: '' }])
  const setVariant = (i, patch) => setVariants(v => v.map((vt, j) => j === i ? { ...vt, ...patch } : vt))
  const removeVariant = (i) => setVariants(v => v.filter((_, j) => j !== i))

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.name.trim())  e.name     = 'Product name is required'
    if (!form.price)        e.price    = 'Price is required'
    if (Number(form.price) < 0) e.price = 'Price must be positive'
    if (!form.category)     e.category = 'Select a category'
    if (form.product_type !== 'digital' && form.track_inventory && form.stock_quantity === '')
      e.stock_quantity = 'Stock quantity is required'
    return e
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const submit = async (status) => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    setSaveAs(status)
    setLoading(true)

    const { variants, weight, weight_unit, digital_url, ...productData } = form
    
    // Convert weight to grams
    let weight_grams = null
    if (weight) {
      const w = Number(weight)
      if (weight_unit === 'kg') weight_grams = Math.round(w * 1000)
      else if (weight_unit === 'lb') weight_grams = Math.round(w * 453.592)
      else if (weight_unit === 'oz') weight_grams = Math.round(w * 28.3495)
      else weight_grams = Math.round(w)
    }

    const payload = {
      ...productData,
      status,
      digital_url,
      weight_grams,
      price:            Number(form.price),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      cost_per_item:    form.cost_per_item    ? Number(form.cost_per_item)    : null,
      stock_quantity:   form.stock_quantity   ? Number(form.stock_quantity)   : 0,
      images:           form.images.filter(Boolean),
      variants:         form.product_type === 'variable' ? variants : [],
    }

    const res = isEditing
      ? await updateProduct(product.id, payload)
      : await createProduct(payload)

    setLoading(false)
    setSaveAs(null)

    if (res?.error) { setErrors({ _form: res.error }); return }
    router.push('/vendor/products')
  }

  const isDigital  = form.product_type === 'digital'
  const isVariable = form.product_type === 'variable'
  const isService  = form.product_type === 'service'

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/vendor/products')}
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted hover:text-brand hover:border-brand/40 hover:bg-brand/10 transition-all"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-primary">
            {isEditing ? 'Edit Product' : 'New Product'}
          </h1>
          <p className="text-sm text-secondary mt-0.5">
            {isEditing ? `Editing: ${product.name}` : 'Fill in the details below'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT COLUMN (2/3) ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Product type */}
          <Section icon={Package} title="Product Type *">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRODUCT_TYPES.map(pt => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => set('product_type', pt.value)}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3.5 rounded-xl border text-left transition-all',
                    form.product_type === pt.value
                      ? 'border-brand bg-brand/10 ring-2 ring-brand/20'
                      : 'border-border hover:border-brand/40 hover:bg-brand/5',
                  )}
                >
                  <span className="text-xl leading-none mt-0.5">{pt.emoji}</span>
                  <div>
                    <p className={cn('text-sm font-semibold', form.product_type === pt.value ? 'text-brand' : 'text-primary')}>
                      {pt.label}
                    </p>
                    <p className="text-xs text-muted mt-0.5">{pt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Section>

          {/* Basic info */}
          <Section icon={Tag} title="Product Information">
            <Field label="Product Name" required error={errors.name}>
              <TextInput
                icon={Tag}
                placeholder="e.g. Premium Cotton T-Shirt"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                error={errors.name}
                maxLength={200}
              />
            </Field>

            <Field label="Description"
              hint="Describe your product clearly. Good descriptions improve search rankings and conversions.">
              <TextInput
                textarea
                rows={5}
                placeholder="What is this product? What makes it special? Include materials, dimensions, etc."
                value={form.description}
                onChange={e => set('description', e.target.value)}
              />
            </Field>

            <Field label="Category" required error={errors.category}>
              <select
                value={form.category}
                onChange={e => set('category', e.target.value)}
                className={cn(
                  'w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm text-primary appearance-none',
                  'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all',
                  errors.category ? 'border-danger/50 bg-danger/5' : 'border-border hover:border-brand/40',
                )}
              >
                <option value="">Select a category…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </Section>

          {/* Images */}
          <Section icon={ImageIcon} title="Product Images">
            <ProductImageUploader
              images={form.images}
              onChange={(urls) => set('images', urls)}
              vendorId={vendorId}
            />
          </Section>

          {/* Digital download */}
          {isDigital && (
            <Section icon={Globe} title="Digital Product">
              <Field label="Download URL / Delivery Link" required
                hint="The link buyers receive after purchase. Use a secure file host.">
                <TextInput
                  icon={Globe}
                  type="url"
                  placeholder="https://drive.google.com/file/…"
                  value={form.digital_url}
                  onChange={e => set('digital_url', e.target.value)}
                />
              </Field>
            </Section>
          )}

          {/* Variants */}
          {isVariable && (
            <Section icon={Layers} title="Product Variants">
              <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 -mt-2">
                <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-500">
                  Add variants for different options like sizes, colors, or styles. Each variant can have its own price and stock.
                </p>
              </div>
              <div className="space-y-4">
                {variants.map((v, i) => (
                  <div key={i} className="p-4 bg-surface-3 rounded-xl border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-secondary">Variant {i + 1}</p>
                      <button onClick={() => removeVariant(i)}
                        className="text-muted hover:text-danger transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Variant Name">
                        <input
                          placeholder="e.g. Red / Large"
                          value={v.name}
                          onChange={e => setVariant(i, { name: e.target.value })}
                          className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm placeholder:text-muted text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                        />
                      </Field>
                      <Field label="SKU">
                        <input
                          placeholder="Optional"
                          value={v.sku}
                          onChange={e => setVariant(i, { sku: e.target.value })}
                          className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm placeholder:text-muted text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                        />
                      </Field>
                      <Field label="Price (leave blank to use base price)">
                        <div className="flex items-center gap-0 border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand/30 focus-within:border-brand transition-all bg-surface-2">
                          <span className="bg-surface-3 px-3 py-2.5 text-muted text-sm border-r border-border font-semibold">{sym}</span>
                          <input
                            type="number" min="0" step="0.01"
                            placeholder={form.price || '0.00'}
                            value={v.price}
                            onChange={e => setVariant(i, { price: e.target.value })}
                            className="flex-1 bg-transparent px-3 py-2.5 text-sm placeholder:text-muted text-primary focus:outline-none"
                          />
                        </div>
                      </Field>
                      <Field label="Stock Quantity">
                        <input
                          type="number" min="0"
                          placeholder="0"
                          value={v.stock_quantity}
                          onChange={e => setVariant(i, { stock_quantity: e.target.value })}
                          className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm placeholder:text-muted text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                        />
                      </Field>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addVariant}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-xl text-sm font-semibold text-muted hover:border-brand hover:text-brand hover:bg-brand/5 transition-all"
                >
                  <Plus size={15} /> Add Variant
                </button>
              </div>
            </Section>
          )}

          {/* SEO */}
          <Section icon={Globe} title="SEO & Search">
            <Field label="SEO Title"
              hint="Appears in search engine results. If blank, product name is used.">
              <TextInput
                placeholder={form.name || 'Product name'}
                value={form.seo_title}
                onChange={e => set('seo_title', e.target.value)}
                maxLength={70}
              />
              <div className="flex justify-end mt-1">
                <span className={cn('text-[10px]', form.seo_title.length > 60 ? 'text-amber-500' : 'text-muted')}>
                  {form.seo_title.length}/70
                </span>
              </div>
            </Field>
            <Field label="SEO Description"
              hint="Short summary for search results. 120–160 characters is ideal.">
              <TextInput
                textarea
                rows={2}
                placeholder="Brief description for search engines…"
                value={form.seo_description}
                onChange={e => set('seo_description', e.target.value)}
                maxLength={160}
              />
              <div className="flex justify-end mt-1">
                <span className={cn('text-[10px]', form.seo_description.length > 140 ? 'text-amber-500' : 'text-muted')}>
                  {form.seo_description.length}/160
                </span>
              </div>
            </Field>
          </Section>
        </div>

        {/* ── RIGHT COLUMN (1/3) ────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Pricing */}
          <Section icon={DollarSign} title="Pricing">
            <Field label="Price" required error={errors.price}>
              <div className="flex items-center gap-0 border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand/30 focus-within:border-brand transition-all bg-surface-2 shadow-sm"
                style={{ borderColor: errors.price ? '#ef4444' : 'var(--border)' }}>
                <span className="bg-surface-3 px-4 py-3 text-secondary font-bold text-sm border-r border-border">{sym}</span>
                <input
                  type="number" min="0" step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  className="flex-1 bg-transparent px-4 py-3 text-sm text-primary placeholder:text-muted focus:outline-none"
                />
              </div>
            </Field>

            <Field label="Compare-at Price"
              hint="Original price — crossed out to show discount">
              <div className="flex items-center gap-0 border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand/30 focus-within:border-brand transition-all bg-surface-2 shadow-sm">
                <span className="bg-surface-3 px-4 py-3 text-secondary font-bold text-sm border-r border-border">{sym}</span>
                <input
                  type="number" min="0" step="0.01"
                  placeholder="0.00"
                  value={form.compare_at_price}
                  onChange={e => set('compare_at_price', e.target.value)}
                  className="flex-1 bg-transparent px-4 py-3 text-sm text-primary placeholder:text-muted focus:outline-none"
                />
              </div>
              {form.compare_at_price && Number(form.compare_at_price) > Number(form.price) && form.price && (
                <p className="text-xs text-emerald-600 font-semibold mt-1">
                  {Math.round(((form.compare_at_price - form.price) / form.compare_at_price) * 100)}% off
                </p>
              )}
            </Field>

            <Field label="Cost Per Item"
              hint="Your cost — used to calculate profit margin. Not shown to buyers.">
              <div className="flex items-center gap-0 border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand/30 focus-within:border-brand transition-all bg-surface-2 shadow-sm">
                <span className="bg-surface-3 px-4 py-3 text-secondary font-bold text-sm border-r border-border">{sym}</span>
                <input
                  type="number" min="0" step="0.01"
                  placeholder="0.00"
                  value={form.cost_per_item}
                  onChange={e => set('cost_per_item', e.target.value)}
                  className="flex-1 bg-transparent px-4 py-3 text-sm text-primary placeholder:text-muted focus:outline-none"
                />
              </div>
              {form.cost_per_item && form.price && Number(form.cost_per_item) < Number(form.price) && (
                <p className="text-xs text-muted mt-1">
                  Margin: {formatCurrency(form.price - form.cost_per_item, currency)} ({Math.round(((form.price - form.cost_per_item) / form.price) * 100)}%)
                </p>
              )}
            </Field>
          </Section>

          {/* Inventory */}
          {!isService && (
            <Section icon={BarChart3} title="Inventory">
              <Field label="SKU (Stock Keeping Unit)"
                hint="Your internal product code">
                <TextInput
                  placeholder="e.g. SHIRT-RED-M"
                  value={form.sku}
                  onChange={e => set('sku', e.target.value)}
                />
              </Field>

              {!isDigital && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-primary">Track Inventory</p>
                      <p className="text-xs text-muted mt-0.5">Monitor stock levels automatically</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => set('track_inventory', !form.track_inventory)}
                      className={cn(
                        'w-12 h-6 rounded-full transition-all duration-200 relative shrink-0',
                        form.track_inventory ? 'bg-brand' : 'bg-surface-3',
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all',
                        form.track_inventory ? 'left-6' : 'left-0.5',
                      )} />
                    </button>
                  </div>

                  {form.track_inventory && (
                    <Field label="Stock Quantity" required error={errors.stock_quantity}>
                      <input
                        type="number" min="0"
                        placeholder="0"
                        value={form.stock_quantity}
                        onChange={e => set('stock_quantity', e.target.value)}
                        className={cn(
                          'w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm text-primary placeholder:text-muted',
                          'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all',
                          errors.stock_quantity ? 'border-danger/50 bg-danger/5' : 'border-border hover:border-brand/40',
                        )}
                      />
                    </Field>
                  )}
                </>
              )}
            </Section>
          )}

          {/* Shipping */}
          {!isDigital && !isService && (
            <Section icon={Package} title="Shipping">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary">Requires Shipping</p>
                  <p className="text-xs text-muted mt-0.5">Physical item that needs to be shipped</p>
                </div>
                <button
                  type="button"
                  onClick={() => set('requires_shipping', !form.requires_shipping)}
                  className={cn(
                    'w-12 h-6 rounded-full transition-all duration-200 relative shrink-0',
                    form.requires_shipping ? 'bg-brand' : 'bg-surface-3',
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all',
                    form.requires_shipping ? 'left-6' : 'left-0.5',
                  )} />
                </button>
              </div>

              {form.requires_shipping && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Weight">
                    <input
                      type="number" min="0" step="0.01"
                      placeholder="0"
                      value={form.weight}
                      onChange={e => set('weight', e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm placeholder:text-muted text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                    />
                  </Field>
                  <Field label="Unit">
                    <select
                      value={form.weight_unit}
                      onChange={e => set('weight_unit', e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all appearance-none"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="lb">lb</option>
                      <option value="oz">oz</option>
                    </select>
                  </Field>
                </div>
              )}
            </Section>
          )}

          {/* Status + save */}
          <div className="bg-surface-2 rounded-2xl border border-border shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-primary">Visibility</p>
              <span className={cn(
                'text-xs font-semibold px-2.5 py-1 rounded-full border',
                form.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-surface-3 text-muted border-border',
              )}>
                {form.status === 'active' ? '● Active' : '○ Draft'}
              </span>
            </div>

            {errors._form && (
              <div className="flex items-start gap-2 bg-danger/10 border border-danger/20 rounded-xl px-3 py-2.5">
                <AlertCircle size={14} className="text-danger shrink-0 mt-0.5" />
                <p className="text-xs text-danger font-medium">{errors._form}</p>
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={() => submit('active')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-700 disabled:opacity-60 text-white font-bold rounded-xl py-3 text-sm transition-all shadow-brand active:scale-[0.98]"
              >
                {loading && saveAs === 'active'
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Save size={15} /> {isEditing ? 'Save Changes' : 'Publish Product'}</>
                }
              </button>
              <button
                onClick={() => submit('draft')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 border border-border text-secondary hover:bg-surface-3 disabled:opacity-60 font-semibold rounded-xl py-3 text-sm transition-all active:scale-[0.98]"
              >
                {loading && saveAs === 'draft'
                  ? <span className="w-4 h-4 border-2 border-border border-t-brand rounded-full animate-spin" />
                  : 'Save as Draft'
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}