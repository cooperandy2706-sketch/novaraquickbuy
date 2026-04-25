'use client'
// FILE: src/app/(vendor)/vendor/import/ImportClient.jsx

import { useState, useTransition } from 'react'
import { useRouter }               from 'next/navigation'
import {
  Upload, Package, BarChart3,
  CheckCircle2, ArrowRight, RefreshCw,
  AlertCircle, ChevronLeft, Sparkles,
} from 'lucide-react'
import ImportUploader      from '@/components/vendor/import/ImportUploader'
import ImportColumnMapper  from '@/components/vendor/import/ImportColumnMapper'
import ImportPreviewTable  from '@/components/vendor/import/ImportPreviewTable'
import ImportTemplate      from '@/components/vendor/import/ImportTemplate'
import { validateImport, executeImport, executeStockImport, detectConflicts } from '@/lib/actions/import'
import ImportConflictResolver  from '@/components/vendor/import/ImportConflictResolver'
import { cn } from '@/utils/cn'

const IMPORT_TYPES = [
  {
    value: 'products',
    label: 'Products',
    desc:  'Create or update products with full details — name, price, images, variants, SEO',
    icon:  Package,
    color: 'bg-brand-50 text-brand border-brand-200',
  },
  {
    value: 'stock',
    label: 'Stock Levels Only',
    desc:  'Update inventory quantities for existing products using SKU matching',
    icon:  BarChart3,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
]

const STEPS = [
  { num: 1, label: 'Choose Type'  },
  { num: 2, label: 'Upload File'  },
  { num: 3, label: 'Review'       },
  { num: 4, label: 'Import'       },
]

export default function ImportClient() {
  const router                       = useRouter()
  const [isPending, startTransition] = useTransition()

  const [step,        setStep]        = useState(1)
  const [importType,  setImportType]  = useState('products')
  const [parsed,      setParsed]      = useState(null)   // { headers, rows }
  const [validation,  setValidation]  = useState(null)
  const [validating,  setValidating]  = useState(false)
  const [importing,   setImporting]   = useState(false)
  const [result,      setResult]      = useState(null)
  const [importError, setImportError] = useState(null)
  const [conflicts,   setConflicts]   = useState([])   // existing SKU conflicts
  const [decisions,   setDecisions]   = useState({})   // per-row { sku: 'update'|'skip' }
  const [showConflicts, setShowConflicts] = useState(false)

  // ── Step 1 → 2: choose type ───────────────────────────────────────────────
  const handleTypeSelect = (type) => {
    setImportType(type)
    setStep(2)
    setParsed(null)
    setValidation(null)
  }

  // ── Step 2 → 3: file parsed ───────────────────────────────────────────────
  const handleParsed = async (data) => {
    if (!data) { setParsed(null); setValidation(null); return }
    setParsed(data)

    if (importType === 'products') {
      setValidating(true)
      const v = await validateImport(data.rows, data.headers)
      setValidation(v)

      // Detect DB conflicts for per-row resolution
      if (v.valid > 0) {
        const validRows = v.results.filter(r => r.errors.length === 0).map(r => r.row)
        const c = await detectConflicts(validRows)
        if (c?.conflicts?.length > 0) {
          setConflicts(c.conflicts)
        } else {
          setConflicts([])
        }
      }
      setValidating(false)
    }

    setStep(3)
  }

  // ── Step 3 → 4: run import ────────────────────────────────────────────────
  const handleImport = async () => {
    if (!parsed?.rows?.length) return
    setImporting(true)
    setImportError(null)

    const res = importType === 'stock'
      ? await executeStockImport(parsed.rows)
      : await executeImport(parsed.rows, { perRowDecisions: decisions })

    setImporting(false)

    if (res?.error) { setImportError(res.error); return }
    setResult(res)
    setStep(4)
  }

  const reset = () => {
    setStep(1)
    setParsed(null)
    setValidation(null)
    setResult(null)
    setImportError(null)
  }

  const canImport = importType === 'stock'
    ? parsed?.rows?.length > 0
    : validation?.valid > 0

  // ── Step progress indicator ───────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center gap-0">
      {STEPS.map((s, i) => {
        const done    = step > s.num
        const current = step === s.num
        const last    = i === STEPS.length - 1
        return (
          <div key={s.num} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all',
                done    && 'bg-brand text-white',
                current && 'bg-brand-800 text-white ring-4 ring-brand-200 scale-110',
                !done && !current && 'bg-neutral-200 text-neutral-400',
              )}>
                {done ? '✓' : s.num}
              </div>
              <span className={cn(
                'text-[9px] font-semibold mt-1 hidden sm:block whitespace-nowrap',
                current ? 'text-brand' : done ? 'text-brand' : 'text-muted',
              )}>
                {s.label}
              </span>
            </div>
            {!last && (
              <div className={cn('flex-1 h-0.5 mx-1 transition-all', done ? 'bg-brand' : 'bg-border')} />
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-6 pb-10 max-w-3xl">

      {/* Header */}
      <div className="flex items-center gap-4">
        {step > 1 && step < 4 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted hover:text-brand hover:border-brand-200 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-brand-900">Import Products</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Bulk import products or update stock levels from CSV, Excel or JSON
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator />

      {/* ── STEP 1: Choose type ──────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm font-bold text-primary">What would you like to import?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {IMPORT_TYPES.map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.value}
                  onClick={() => handleTypeSelect(t.value)}
                  className="flex flex-col items-start gap-4 p-6 bg-surface-2 rounded-2xl border-2 border-border hover:border-brand hover:shadow-md text-left transition-all duration-150 group active:scale-[0.98]"
                >
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center border', t.color)}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-primary text-base">{t.label}</p>
                    <p className="text-sm text-muted mt-1 leading-relaxed">{t.desc}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand group-hover:gap-2.5 transition-all">
                    Get started <ArrowRight size={13} />
                  </div>
                </button>
              )
            })}
          </div>

          {/* Template section always visible on step 1 */}
          <ImportTemplate importType={importType} />
        </div>
      )}

      {/* ── STEP 2: Upload ───────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-6">
          <ImportTemplate importType={importType} />
          <div className="bg-surface-2 rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-surface-3/30 flex items-center gap-2">
              <Upload size={14} className="text-brand" />
              <h3 className="font-bold text-primary text-sm">
                Upload your {importType === 'stock' ? 'stock update' : 'product'} file
              </h3>
            </div>
            <div className="p-6">
              <ImportUploader onParsed={handleParsed} loading={validating} />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Review ──────────────────────────────────────────────── */}
      {step === 3 && parsed && (
        <div className="space-y-5">

          {validating ? (
            <div className="flex flex-col items-center py-16 gap-4">
              <RefreshCw size={32} className="text-brand animate-spin" />
              <p className="text-sm font-bold text-primary">Validating your data…</p>
            </div>
          ) : (
            <>
              {importType === 'products' && (
                <>
                  <ImportColumnMapper headers={parsed.headers} validation={validation} />
                  <ImportPreviewTable preview={validation?.preview} headers={parsed.headers} />
                </>
              )}

              {importType === 'stock' && (
                <div className="bg-surface-2 rounded-2xl border border-border shadow-sm p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <BarChart3 size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">
                        {parsed.rows.length} stock row{parsed.rows.length !== 1 ? 's' : ''} ready
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        Products will be matched by SKU. Unmatched SKUs will be listed after import.
                      </p>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="overflow-x-auto rounded-xl border border-neutral-200">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-neutral-100 bg-neutral-50">
                          <th className="text-left px-4 py-2.5 font-bold text-neutral-400 uppercase tracking-wide">SKU</th>
                          <th className="text-right px-4 py-2.5 font-bold text-neutral-400 uppercase tracking-wide">New Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {parsed.rows.slice(0, 8).map((r, i) => {
                          const sku = r.sku ?? r.SKU ?? r['item code'] ?? '—'
                          const qty = r.stock_quantity ?? r.quantity ?? r.qty ?? r.stock ?? '—'
                          return (
                            <tr key={i} className="hover:bg-surface-3 transition-colors">
                              <td className="px-4 py-2.5 font-mono text-primary">{sku}</td>
                              <td className="px-4 py-2.5 text-right font-bold text-brand">{qty}</td>
                            </tr>
                          )
                        })}
                        {parsed.rows.length > 8 && (
                          <tr>
                            <td colSpan={2} className="px-4 py-2.5 text-center text-neutral-400 italic">
                              …and {parsed.rows.length - 8} more rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Conflict resolver inline banner */}
              {conflicts.length > 0 && !showConflicts && (
                <div className="flex items-center gap-4 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3.5 shadow-sm">
                  <AlertCircle size={16} className="text-amber-600 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-600">
                      {conflicts.length} existing product{conflicts.length !== 1 ? 's' : ''} detected
                    </p>
                    <p className="text-xs text-amber-600/80 mt-0.5 font-medium">
                      Choose whether to update or skip each one before importing.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowConflicts(true)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Resolve <ArrowRight size={12} />
                  </button>
                </div>
              )}

              {conflicts.length > 0 && showConflicts && (
                <ImportConflictResolver
                  conflicts={conflicts}
                  onResolved={(d) => { setDecisions(d); setShowConflicts(false) }}
                  onBack={() => setShowConflicts(false)}
                />
              )}

              {/* Import error */}
              {importError && (
                <div className="flex items-start gap-3 bg-danger/5 border border-danger/20 rounded-xl px-4 py-3.5">
                  <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
                  <p className="text-sm text-danger font-medium">{importError}</p>
                </div>
              )}

              {/* Import button — hidden while conflict resolver is open */}
              {!showConflicts && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="px-5 py-3.5 rounded-xl border border-border text-sm font-bold text-secondary hover:bg-surface-3 transition-all"
                  >
                    ← Change File
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!canImport || importing || (conflicts.length > 0 && Object.keys(decisions).length === 0)}
                    className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl py-3.5 text-sm transition-all shadow-brand active:scale-[0.98]"
                  >
                    {importing ? (
                      <><RefreshCw size={15} className="animate-spin" /> Importing…</>
                    ) : (
                      <>
                        <Upload size={15} />
                        Import {importType === 'stock'
                          ? `${parsed.rows.length} stock update${parsed.rows.length !== 1 ? 's' : ''}`
                          : `${validation?.valid ?? 0} product${(validation?.valid ?? 0) !== 1 ? 's' : ''}`
                        }
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── STEP 4: Result ──────────────────────────────────────────────── */}
      {step === 4 && result && (
        <div className="space-y-5">
          <div className="bg-surface-2 rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-4 border-emerald-500/20 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-primary">Import complete!</h2>
              <p className="text-sm text-muted">
                Your {importType === 'stock' ? 'stock levels have' : 'products have'} been imported successfully.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-0 border-t border-neutral-100 divide-x divide-neutral-100">
              {[
                { label: 'Total Processed', value: result.total,   color: 'text-brand-900'   },
                { label: importType === 'stock' ? 'Updated' : 'Created', value: result.created ?? result.updated, color: 'text-emerald-700' },
                { label: importType === 'stock' ? 'Not Found' : 'Updated', value: result.updated ?? result.notFound?.length ?? 0, color: 'text-blue-700' },
              ].map(s => (
                <div key={s.label} className="p-5 text-center">
                  <p className={cn('text-2xl font-bold tabular-nums', s.color)}>{s.value}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Errors from import */}
            {result.errors?.length > 0 && (
              <div className="p-5 border-t border-border space-y-2">
                <p className="text-xs font-bold text-danger">Partial errors ({result.errors.length})</p>
                {result.errors.slice(0, 3).map((e, i) => (
                  <p key={i} className="text-xs text-danger/80">{e}</p>
                ))}
              </div>
            )}

            {/* Not found SKUs for stock import */}
            {result.notFound?.length > 0 && (
              <div className="p-5 border-t border-neutral-100">
                <p className="text-xs font-bold text-amber-700 mb-1.5">SKUs not found in your store</p>
                <p className="text-xs text-neutral-500 font-mono">
                  {result.notFound.slice(0, 10).join(', ')}
                  {result.notFound.length > 10 && ` …+${result.notFound.length - 10} more`}
                </p>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="flex items-start gap-3 bg-brand/10 border border-brand/20 rounded-xl px-4 py-3.5 shadow-sm">
            <Sparkles size={15} className="text-brand shrink-0 mt-0.5" />
            <p className="text-xs text-brand font-medium">
              <span className="font-bold">Tip:</span> Your products are saved as <span className="font-bold underline">drafts</span> by default. Go to Products to review and publish them.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 py-3.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-all"
            >
              Import More
            </button>
            <button
              onClick={() => startTransition(() => router.push('/vendor/products'))}
              className="flex-1 flex items-center justify-center gap-2 bg-brand text-white font-bold rounded-xl py-3.5 text-sm shadow-brand hover:bg-brand-700 transition-all"
            >
              View Products <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}