'use client'
// FILE: src/components/vendor/import/ImportTemplate.jsx

import { useState }         from 'react'
import { Download, FileText, Table2, Braces, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { getImportTemplate } from '@/lib/actions/import'
import { cn }                from '@/utils/cn'

const FIELD_GUIDE = [
  { field: 'name',             required: true,  type: 'Text',    desc: 'Product display name (max 200 chars)',               example: 'Premium Cotton T-Shirt' },
  { field: 'price',            required: true,  type: 'Number',  desc: 'Selling price (no currency symbol)',                 example: '29.99' },
  { field: 'compare_at_price', required: false, type: 'Number',  desc: 'Original price — crossed out to show discount',     example: '39.99' },
  { field: 'cost_per_item',    required: false, type: 'Number',  desc: 'Your cost — used for margin calculation',           example: '12.00' },
  { field: 'description',      required: false, type: 'Text',    desc: 'Full product description',                          example: 'Soft breathable fabric...' },
  { field: 'sku',              required: false, type: 'Text',    desc: 'Stock Keeping Unit — used to match duplicates',     example: 'SHIRT-WHT-M' },
  { field: 'barcode',          required: false, type: 'Text',    desc: 'EAN, UPC, ISBN or other barcode',                   example: '1234567890123' },
  { field: 'stock_quantity',   required: false, type: 'Number',  desc: 'Starting stock level (defaults to 0)',              example: '50' },
  { field: 'category',         required: false, type: 'Text',    desc: 'Must match a Novara category exactly',              example: 'Fashion & Apparel' },
  { field: 'product_type',     required: false, type: 'Text',    desc: 'physical, digital, service, or variable',           example: 'physical' },
  { field: 'status',           required: false, type: 'Text',    desc: 'active, draft, or archived (defaults to draft)',    example: 'active' },
  { field: 'image_url',        required: false, type: 'URL',     desc: 'Direct URL to product image (HTTPS)',               example: 'https://...' },
  { field: 'weight',           required: false, type: 'Number',  desc: 'Product weight in kg',                              example: '0.5' },
  { field: 'download_url',     required: false, type: 'URL',     desc: 'For digital products — download link',              example: 'https://...' },
  { field: 'seo_title',        required: false, type: 'Text',    desc: 'Search engine title (max 70 chars)',                example: 'Cotton T-Shirt...' },
  { field: 'seo_description',  required: false, type: 'Text',    desc: 'Search engine description (max 160 chars)',         example: 'Shop our...' },
]

const ACCEPTED_ALIASES = {
  name:           ['name', 'product name', 'title', 'item name'],
  price:          ['price', 'sale price', 'unit price', 'selling price'],
  stock_quantity: ['stock', 'quantity', 'qty', 'stock quantity', 'available'],
  category:       ['category'],
  image_url:      ['image', 'image url', 'photo', 'thumbnail'],
}

function downloadCSV(headers, rows, filename) {
  const escape = (v) => {
    const str = String(v ?? '')
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"` : str
  }
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h] ?? '')).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadJSON(rows, filename) {
  const json = JSON.stringify(rows, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ImportTemplate({ importType = 'products' }) {
  const [showGuide,   setShowGuide]   = useState(false)
  const [downloading, setDownloading] = useState(null)

  const handleDownload = async (format) => {
    setDownloading(format)
    const template = await getImportTemplate(importType)
    const date     = new Date().toISOString().slice(0, 10)

    if (format === 'csv') {
      downloadCSV(template.headers, template.sample, `novara-${importType}-template-${date}.csv`)
    } else if (format === 'json') {
      downloadJSON(template.sample, `novara-${importType}-template-${date}.json`)
    } else if (format === 'xlsx') {
      try {
        const XLSX = await import('xlsx')
        const ws   = XLSX.utils.json_to_sheet(template.sample, { header: template.headers })
        const wb   = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Products')
        XLSX.writeFile(wb, `novara-${importType}-template-${date}.xlsx`)
      } catch {
        // Fallback to CSV
        downloadCSV(template.headers, template.sample, `novara-${importType}-template-${date}.csv`)
      }
    }
    setDownloading(null)
  }

  return (
    <div className="bg-surface-2 rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-surface-3/30 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-primary text-sm">Download Template</h3>
          <p className="text-xs text-muted mt-0.5">
            Start with our template to ensure your data is formatted correctly
          </p>
        </div>
        <button
          onClick={() => setShowGuide(g => !g)}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-700 transition-colors"
        >
          {showGuide ? <><ChevronUp size={13} /> Hide guide</> : <><ChevronDown size={13} /> Column guide</>}
        </button>
      </div>

      <div className="p-6 space-y-5">

        {/* Download buttons */}
        <div className="flex flex-wrap gap-3">
          {[
            { format: 'csv',  label: 'CSV Template',   icon: FileText },
            { format: 'xlsx', label: 'Excel Template', icon: Table2   },
            { format: 'json', label: 'JSON Template',  icon: Braces   },
          ].map(({ format, label, icon: Icon }) => (
            <button
              key={format}
              onClick={() => handleDownload(format)}
              disabled={!!downloading}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-secondary',
                'hover:border-brand-200 hover:text-brand hover:bg-brand/10 transition-all shadow-sm disabled:opacity-50 transition-all',
              )}
            >
              {downloading === format
                ? <span className="w-3.5 h-3.5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                : <Icon size={14} />
              }
              {label}
            </button>
          ))}
        </div>

        {/* Info box */}
        <div className="flex items-start gap-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 shadow-sm">
          <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-600 space-y-1 font-medium">
            <p><span className="font-bold">Column headers are flexible</span> — we recognise many common aliases automatically.</p>
            <p>For example: <span className="font-mono bg-blue-500/20 px-1 rounded">qty</span>, <span className="font-mono bg-blue-500/20 px-1 rounded">quantity</span>, and <span className="font-mono bg-blue-500/20 px-1 rounded">stock</span> all map to stock quantity.</p>
            <p><span className="font-bold">Duplicate SKUs</span> — if a product with the same SKU already exists, it will be updated rather than duplicated.</p>
          </div>
        </div>

        {/* Column guide */}
        {showGuide && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted uppercase tracking-wide">Column Reference</p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-3/50">
                    {['Column', 'Required', 'Type', 'Description', 'Example'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 font-bold text-muted uppercase text-[10px] tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {FIELD_GUIDE.map(row => (
                    <tr key={row.field} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-mono font-semibold text-brand-800">{row.field}</span>
                          {ACCEPTED_ALIASES[row.field] && (
                            <div className="text-[10px] text-neutral-400 mt-0.5">
                              also: {ACCEPTED_ALIASES[row.field].slice(1).join(', ')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {row.required
                          ? <span className="text-danger font-bold">Yes</span>
                          : <span className="text-muted/40 font-medium">No</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 font-medium text-[10px]">
                          {row.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-secondary/80 font-medium max-w-[220px]">{row.desc}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-muted bg-surface-3 px-2 py-0.5 rounded-md border border-border">
                          {row.example}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}