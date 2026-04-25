'use client'
// FILE: src/components/vendor/products/ProductRow.jsx

import { useState }              from 'react'
import Link                      from 'next/link'
import { useRouter }             from 'next/navigation'
import {
  Package, Edit2, Trash2, Eye, EyeOff,
  AlertTriangle, XCircle,
  Copy, MoreVertical, CheckCircle2, ShoppingBag
} from 'lucide-react'
import { toggleProductStatus, deleteProduct, updateStock } from '@/lib/actions/products'
import { cn } from '@/utils/cn'
import { useLocaleStore } from '@/store/localeStore'
import { formatCurrency } from '@/utils/formatCurrency'

const STATUS_STYLES = {
  active:   'bg-emerald-500 text-white border-emerald-600',
  draft:    'bg-neutral-100 text-neutral-500 border-neutral-200',
  archived: 'bg-amber-500 text-white border-amber-600',
}

export default function ProductRow({ product, selected, onSelect, onRefresh, viewMode = 'grid' }) {
  const currency = useLocaleStore(s => s.currency)
  const [loading, setLoading]     = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [editStock, setEditStock] = useState(false)
  const [stockVal,  setStockVal]  = useState(product.stock_quantity ?? 0)

  const isActive  = product.status === 'active'
  const stockOk   = product.stock_quantity > 5
  const stockLow  = product.stock_quantity > 0 && product.stock_quantity <= 5
  const stockOut  = product.stock_quantity === 0

  const handleStatusToggle = async () => {
    setLoading(true)
    const newStatus = isActive ? 'draft' : 'active'
    await toggleProductStatus(product.id, newStatus)
    setLoading(false)
    onRefresh()
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    setLoading(true)
    await deleteProduct(product.id)
    setLoading(false)
    onRefresh()
  }

  const handleStockSave = async () => {
    setLoading(true)
    await updateStock(product.id, Number(stockVal))
    setEditStock(false)
    setLoading(false)
    onRefresh()
  }

  // ── GRID MODE (MOBILE-FIRST CARD) ─────────────────────────────────────────
  if (viewMode === 'grid') {
    return (
      <div className={cn(
        "group relative bg-white rounded-[2rem] border border-neutral-100 p-2.5 sm:p-3 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-neutral-200/50",
        selected && "border-brand ring-2 ring-brand/10 bg-brand/5"
      )}>

        {/* ── Checkbox — top-left overlay ── */}
        <button
          onClick={onSelect}
          className={cn(
            'absolute top-3 left-3 z-20 w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all',
            selected
              ? 'bg-brand border-brand shadow-lg shadow-brand/20'
              : 'bg-white/80 backdrop-blur-md border-white/60 hover:border-brand',
          )}
        >
          {selected && <CheckCircle2 size={13} className="text-white" />}
        </button>

        {/* ── Status Badge — top-right ── */}
        <div className={cn(
          "absolute top-3 right-3 z-20 rounded-full border shadow-sm font-black uppercase tracking-widest",
          "flex items-center justify-center",
          "text-[9px] px-2 py-0.5 sm:px-2.5",
          STATUS_STYLES[product.status]
        )}>
          <span className="inline">{product.status}</span>
        </div>

        {/* ── Thumbnail ── */}
        <Link
          href={`/vendor/products/${product.id}`}
          className="block relative aspect-square rounded-[1.25rem] overflow-hidden bg-neutral-50 mb-3 border border-neutral-100"
        >
          {product.thumbnail_url ? (
            <img
              src={product.thumbnail_url}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-200">
              <Package size={36} strokeWidth={1} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        {/* ── Product Info ── */}
        <div className="px-1 pb-1 space-y-2.5 sm:space-y-3">

          {/* Name + Type */}
          <div className="min-w-0">
            <Link
              href={`/vendor/products/${product.id}`}
              className="text-[11px] sm:text-sm font-black text-neutral-900 truncate block hover:text-brand transition-colors leading-tight"
            >
              {product.name}
            </Link>
            <div className="flex items-center gap-1.5 mt-1 min-w-0">
              <span className="text-[9px] sm:text-[10px] text-neutral-400 font-bold uppercase tracking-widest truncate">
                {product.product_type ?? 'Physical'}
              </span>
              {/* SKU */}
              {product.sku && (
                <span className="flex items-center gap-1 shrink-0">
                  <span className="w-1 h-1 rounded-full bg-neutral-200 shrink-0" />
                  <span className="text-[9px] sm:text-[10px] text-neutral-400 font-mono truncate max-w-[50px] sm:max-w-[60px]">{product.sku}</span>
                </span>
              )}
            </div>
          </div>

          {/* Price + Stock — stack on very narrow cards, row on wider */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="space-y-0.5 shrink-0">
              <p className="text-xs sm:text-sm font-black text-neutral-900 tabular-nums">
                {formatCurrency(product.price ?? 0, currency)}
              </p>
              {product.compare_at_price > product.price && (
                <p className="text-[9px] text-neutral-400 line-through tabular-nums">
                  {formatCurrency(product.compare_at_price, currency)}
                </p>
              )}
            </div>

            {/* Stock pill */}
            {product.is_digital ? (
              <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest shrink-0">Digital</span>
            ) : (
              <div className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border shrink-0",
                stockOut ? "bg-red-50 text-red-500 border-red-100" :
                stockLow ? "bg-amber-50 text-amber-500 border-amber-100" :
                "bg-emerald-50 text-emerald-500 border-emerald-100"
              )}>
                {product.stock_quantity}
                <span className="text-[7px] opacity-60">Qty</span>
              </div>
            )}
          </div>

          {/* Quick Actions Bar */}
          <div className="pt-1 flex items-center gap-1.5">
            <Link
              href={`/vendor/products/${product.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 sm:h-10 rounded-xl bg-neutral-900 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all active:scale-95"
            >
              <Edit2 size={11} /> Edit
            </Link>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-all"
              >
                <MoreVertical size={15} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 bottom-11 z-40 w-44 bg-white rounded-2xl shadow-2xl border border-neutral-100 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <button
                      onClick={() => { setMenuOpen(false); handleStatusToggle() }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-neutral-900 hover:bg-neutral-50 uppercase tracking-widest"
                    >
                      {isActive
                        ? <><EyeOff size={14} className="text-neutral-400" /> Draft</>
                        : <><Eye size={14} className="text-emerald-500" /> Publish</>
                      }
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); handleDelete() }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-red-500 hover:bg-red-50 uppercase tracking-widest border-t border-neutral-50"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }


  // ── LIST MODE (RESPONSIVE: mobile card + desktop grid) ───────────────────────
  return (
    <div className={cn(
      'relative transition-all group',
      selected ? 'bg-brand/5' : 'hover:bg-neutral-50/80',
    )}>

      {/* ── MOBILE ROW (< lg) ─────────────────────────────────────────────── */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-3.5 border-b border-neutral-100">

        {/* Checkbox */}
        <button
          onClick={onSelect}
          className={cn(
            'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0',
            selected ? 'bg-brand border-brand' : 'border-neutral-200 hover:border-brand bg-white',
          )}
        >
          {selected && <CheckCircle2 size={11} className="text-white" />}
        </button>

        {/* Thumbnail */}
        <Link
          href={`/vendor/products/${product.id}`}
          className="w-12 h-12 rounded-xl bg-neutral-50 overflow-hidden shrink-0 border border-neutral-100"
        >
          {product.thumbnail_url
            ? <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-neutral-200"><Package size={20} /></div>
          }
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/vendor/products/${product.id}`}
            className="text-xs font-black text-neutral-900 hover:text-brand truncate block transition-colors uppercase tracking-tight leading-tight"
          >
            {product.name}
          </Link>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={cn(
              'text-[8px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-full border',
              STATUS_STYLES[product.status]
            )}>
              {product.status}
            </span>
            {product.sku && (
              <span className="text-[8px] font-mono text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-md">SKU: {product.sku}</span>
            )}
            {!product.is_digital ? (
              <span className={cn(
                'text-[8px] font-black uppercase tracking-widest',
                stockOut ? 'text-red-500' : stockLow ? 'text-amber-500' : 'text-neutral-400'
              )}>
                {stockOut ? '⚠ Out' : stockLow ? `⚠ ${product.stock_quantity} left` : `${product.stock_quantity} qty`}
              </span>
            ) : (
              <span className="text-[8px] font-black text-neutral-300 uppercase tracking-widest">Digital</span>
            )}
          </div>
        </div>

        {/* Price + Actions — right side */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <p className="text-sm font-black text-neutral-900 tabular-nums">
            {formatCurrency(product.price ?? 0, currency)}
          </p>
          <div className="flex items-center gap-1">
            <Link
              href={`/vendor/products/${product.id}`}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all border border-neutral-100 bg-white"
            >
              <Edit2 size={13} />
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-all border border-neutral-100 bg-white"
            >
              <MoreVertical size={13} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-4 top-14 z-40 w-44 bg-white rounded-2xl shadow-2xl border border-neutral-100 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <button onClick={() => { setMenuOpen(false); handleStatusToggle() }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-neutral-900 hover:bg-neutral-50 uppercase tracking-widest transition-colors">
                {isActive ? <><EyeOff size={14} className="text-neutral-400" /> Set to Draft</> : <><Eye size={14} className="text-emerald-500" /> Publish Live</>}
              </button>
              <button onClick={() => { setMenuOpen(false); handleDelete() }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-red-500 hover:bg-red-50 uppercase tracking-widest transition-colors border-t border-neutral-50">
                <Trash2 size={14} /> Delete Forever
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── DESKTOP ROW (lg+) ─────────────────────────────────────────────── */}
      <div className="hidden lg:grid grid-cols-12 gap-4 items-center px-8 py-5 border-b border-neutral-100">

        {/* Checkbox */}
        <div className="col-span-1">
          <button
            onClick={onSelect}
            className={cn(
              'w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0',
              selected ? 'bg-brand border-brand shadow-lg shadow-brand/20' : 'border-neutral-200 hover:border-brand bg-white',
            )}
          >
            {selected && <CheckCircle2 size={14} className="text-white" />}
          </button>
        </div>

        {/* Product info */}
        <div className="col-span-5 flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-neutral-50 overflow-hidden shrink-0 border border-neutral-100 group-hover:scale-105 transition-transform duration-500">
            {product.thumbnail_url
              ? <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-neutral-200"><Package size={24} /></div>
            }
          </div>
          <div className="min-w-0">
            <Link
              href={`/vendor/products/${product.id}`}
              className="text-sm font-black text-neutral-900 hover:text-brand truncate block transition-colors uppercase tracking-tight"
            >
              {product.name}
            </Link>
            <div className="flex items-center gap-2 mt-1">
              {product.sku && (
                <span className="text-[10px] text-neutral-400 font-mono px-2 py-0.5 bg-neutral-100 rounded-md">SKU: {product.sku}</span>
              )}
              {product.variants?.length > 0 && (
                <span className="text-[10px] text-brand font-black uppercase tracking-widest">{product.variants.length} Variants</span>
              )}
            </div>
          </div>
        </div>

        {/* Type & Status */}
        <div className="col-span-2 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
            <ShoppingBag size={10} /> {product.product_type ?? 'Physical'}
          </div>
          <span className={cn(
            'inline-block text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border shadow-sm',
            STATUS_STYLES[product.status]
          )}>
            {product.status}
          </span>
        </div>

        {/* Stock */}
        <div className="col-span-1 text-right">
          {editStock ? (
            <div className="flex items-center gap-1 justify-end animate-in fade-in slide-in-from-right-2">
              <input
                type="number"
                min="0"
                value={stockVal}
                onChange={e => setStockVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleStockSave(); if (e.key === 'Escape') setEditStock(false) }}
                autoFocus
                className="w-16 text-xs text-right border-2 border-brand bg-white rounded-xl px-2 py-1.5 focus:outline-none shadow-lg text-neutral-900 font-black"
              />
            </div>
          ) : (
            <button
              onClick={() => !product.is_digital && setEditStock(true)}
              className={cn(
                'text-sm font-black tabular-nums transition-all hover:scale-110 px-3 py-1.5 rounded-xl border',
                product.is_digital ? 'text-neutral-300 border-transparent' :
                stockOut ? 'bg-red-50 text-red-500 border-red-100 shadow-sm' :
                stockLow ? 'bg-amber-50 text-amber-500 border-amber-100 shadow-sm' :
                'bg-white text-neutral-900 border-neutral-100 shadow-sm hover:border-brand/40'
              )}
            >
              {product.is_digital ? '∞' : product.stock_quantity}
            </button>
          )}
        </div>

        {/* Price */}
        <div className="col-span-2 text-right">
          <p className="text-base font-black text-neutral-900 tabular-nums tracking-tighter">
            {formatCurrency(product.price ?? 0, currency)}
          </p>
          {product.compare_at_price > product.price && (
            <p className="text-[10px] text-neutral-400 line-through tabular-nums font-bold">
              {formatCurrency(product.compare_at_price, currency)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="col-span-1 flex items-center justify-end gap-2">
          <Link
            href={`/vendor/products/${product.id}`}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all shadow-sm bg-white border border-neutral-100"
            title="Edit product"
          >
            <Edit2 size={16} />
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-all bg-white border border-neutral-100 shadow-sm"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-8 top-16 z-40 w-48 bg-white rounded-2xl shadow-2xl border border-neutral-100 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <button onClick={() => { setMenuOpen(false); handleStatusToggle() }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-neutral-900 hover:bg-neutral-50 uppercase tracking-widest transition-colors">
                  {isActive ? <><EyeOff size={14} className="text-neutral-400" /> Set to Draft</> : <><Eye size={14} className="text-emerald-500" /> Publish Live</>}
                </button>
                <button onClick={() => { setMenuOpen(false); handleDelete() }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-red-500 hover:bg-red-50 uppercase tracking-widest transition-colors border-t border-neutral-50">
                  <Trash2 size={14} /> Delete Forever
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}