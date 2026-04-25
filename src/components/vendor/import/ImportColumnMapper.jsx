'use client'
// FILE: src/components/vendor/import/ImportColumnMapper.jsx

import { CheckCircle2, AlertTriangle, XCircle, Info, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

const COLUMN_DISPLAY = {
  name:            { label: 'Product Name',        required: true  },
  price:           { label: 'Price',               required: true  },
  description:     { label: 'Description',         required: false },
  compare_at_price:{ label: 'Compare-at Price',    required: false },
  cost_per_item:   { label: 'Cost Per Item',       required: false },
  sku:             { label: 'SKU',                 required: false },
  barcode:         { label: 'Barcode',             required: false },
  stock_quantity:  { label: 'Stock Quantity',      required: false },
  category:        { label: 'Category',            required: false },
  product_type:    { label: 'Product Type',        required: false },
  status:          { label: 'Status',              required: false },
  image_url:       { label: 'Image URL',           required: false },
  weight:          { label: 'Weight',              required: false },
  download_url:    { label: 'Download URL',        required: false },
  seo_title:       { label: 'SEO Title',           required: false },
  seo_description: { label: 'SEO Description',     required: false },
}

const COLUMN_MAP = {
  'name': 'name', 'product name': 'name', 'title': 'name',
  'price': 'price', 'sale price': 'price', 'unit price': 'price',
  'description': 'description', 'desc': 'description',
  'compare at price': 'compare_at_price', 'original price': 'compare_at_price', 'mrp': 'compare_at_price',
  'cost': 'cost_per_item', 'cost per item': 'cost_per_item', 'cogs': 'cost_per_item',
  'sku': 'sku', 'item code': 'sku', 'product code': 'sku',
  'barcode': 'barcode',
  'stock': 'stock_quantity', 'quantity': 'stock_quantity', 'qty': 'stock_quantity', 'stock quantity': 'stock_quantity', 'available': 'stock_quantity',
  'category': 'category',
  'type': 'product_type', 'product type': 'product_type',
  'status': 'status', 'published': 'status',
  'image': 'image_url', 'image url': 'image_url', 'photo': 'image_url', 'thumbnail': 'image_url',
  'weight': 'weight',
  'download url': 'download_url', 'file url': 'download_url',
  'seo title': 'seo_title', 'meta title': 'seo_title',
  'seo description': 'seo_description', 'meta description': 'seo_description',
}

export default function ImportColumnMapper({ headers, validation }) {
  if (!headers?.length) return null

  const mappedFields = new Set()
  const headerMappings = headers.map(h => {
    const mapped = COLUMN_MAP[h.toLowerCase().trim()]
    if (mapped) mappedFields.add(mapped)
    return { original: h, mapped: mapped ?? null }
  })

  const unmapped  = headers.filter(h => !COLUMN_MAP[h.toLowerCase().trim()])
  const missingRequired = ['name', 'price'].filter(f => !mappedFields.has(f))
  const detected  = Object.entries(COLUMN_DISPLAY).filter(([key]) => mappedFields.has(key))

  return (
    <div className="space-y-5">

      {/* Column mapping visual */}
      <div className="bg-surface-2 rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-surface-3/30">
          <h3 className="font-bold text-primary text-sm">Column Detection</h3>
          <p className="text-xs text-muted mt-0.5">
            {headers.length} column{headers.length !== 1 ? 's' : ''} detected · {detected.length} mapped · {unmapped.length} unrecognised
          </p>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {headerMappings.map(({ original, mapped }) => (
              <div key={original} className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm',
                mapped
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : 'border-border bg-surface-3/50 text-muted',
              )}>
                <div className="font-mono text-xs text-primary/60 min-w-0 flex-1 truncate" title={original}>
                  {original}
                </div>
                {mapped ? (
                  <>
                    <ChevronRight size={13} className="text-neutral-400 shrink-0" />
                    <div className="text-xs font-semibold text-emerald-700 shrink-0">
                      {COLUMN_DISPLAY[mapped]?.label ?? mapped}
                    </div>
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  </>
                ) : (
                  <>
                    <ChevronRight size={13} className="text-muted/30 shrink-0" />
                    <div className="text-xs text-muted/50 italic shrink-0">not mapped</div>
                    <XCircle size={13} className="text-muted/30 shrink-0" />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Required fields missing */}
      {missingRequired.length > 0 && (
        <div className="flex items-start gap-3 bg-danger/5 border border-danger/20 rounded-xl px-4 py-3.5">
          <XCircle size={16} className="text-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-danger">Required columns missing</p>
            <p className="text-xs text-danger/80 mt-0.5">
              Your file must include: <span className="font-semibold">{missingRequired.join(', ')}</span>.
              Check your column headers match the template.
            </p>
          </div>
        </div>
      )}

      {/* Unmapped columns */}
      {unmapped.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3.5 shadow-sm">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-600">Unrecognised columns — will be ignored</p>
            <p className="text-xs text-amber-600/80 mt-0.5 font-medium leading-relaxed">
              {unmapped.join(', ')}
            </p>
            <p className="text-[11px] text-amber-600/60 mt-1 font-medium">
              Rename these to match the template headers if you want them imported.
            </p>
          </div>
        </div>
      )}

      {/* Validation summary */}
      {validation && (
        <div className="bg-surface-2 rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-surface-3/30">
            <h3 className="font-bold text-primary text-sm">Validation Results</h3>
          </div>
          <div className="p-5 space-y-4">

            {/* Counts */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-surface-3/50 rounded-xl border border-border">
                <p className="text-xl font-bold text-primary tabular-nums">{validation.total}</p>
                <p className="text-xs text-muted mt-0.5 font-medium">Total Rows</p>
              </div>
              <div className="text-center p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <p className="text-xl font-bold text-emerald-600 tabular-nums">{validation.valid}</p>
                <p className="text-xs text-emerald-600/80 mt-0.5 font-medium">Ready to Import</p>
              </div>
              <div className={cn(
                'text-center p-3 rounded-xl border',
                validation.invalid > 0 ? 'bg-danger/5 border-danger/20' : 'bg-surface-3/50 border-border',
              )}>
                <p className={cn('text-xl font-bold tabular-nums', validation.invalid > 0 ? 'text-danger' : 'text-muted')}>
                  {validation.invalid}
                </p>
                <p className={cn('text-xs mt-0.5 font-medium', validation.invalid > 0 ? 'text-danger/70' : 'text-muted')}>
                  Errors
                </p>
              </div>
            </div>

            {/* Duplicate SKUs in file */}
            {validation.duplicateSkusInFile?.length > 0 && (
              <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 shadow-sm">
                <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-600">Duplicate SKUs in your file</p>
                  <p className="text-xs text-amber-600/80 mt-0.5 font-medium">
                    {validation.duplicateSkusInFile.map(d => `${d.sku} (rows ${d.rows.join(', ')})`).join(' · ')}
                  </p>
                </div>
              </div>
            )}

            {/* Row errors */}
            {validation.results?.filter(r => r.errors.length > 0).slice(0, 5).map(r => (
              <div key={r.rowIndex} className="flex items-start gap-2.5 bg-danger/10 border border-danger/20 rounded-xl px-4 py-2.5 shadow-sm">
                <XCircle size={13} className="text-danger shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-danger">Row {r.rowIndex}</p>
                  <p className="text-xs text-danger/80 font-medium">{r.errors.join(' · ')}</p>
                </div>
              </div>
            ))}

            {/* Warnings */}
            {validation.results?.flatMap(r => r.warnings).slice(0, 3).map((w, i) => (
              <div key={i} className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">{w}</p>
              </div>
            ))}

            {/* Info */}
            {validation.valid > 0 && (
              <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2.5 shadow-sm">
                <Info size={13} className="text-blue-500 shrink-0" />
                <p className="text-xs text-blue-600 font-medium">
                  <span className="font-bold">{validation.valid} products</span> are ready to import. Existing products with matching SKUs will be updated.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}