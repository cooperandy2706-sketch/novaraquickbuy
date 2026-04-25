'use client'
// FILE: src/components/vendor/analytics/AnalyticsRangeFilter.jsx

import { useState }         from 'react'
import { Calendar, Download, RefreshCw } from 'lucide-react'
import { getAnalyticsCSV }  from '@/lib/actions/analytics'
import { cn }               from '@/utils/cn'

const PRESETS = [
  { label: '7D',  value: '7d'  },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: 'Custom', value: 'custom' },
]

export default function AnalyticsRangeFilter({ range, from, to, onRangeChange, loading }) {
  const [showCustom, setShowCustom] = useState(range === 'custom')
  const [customFrom, setCustomFrom] = useState(from ?? '')
  const [customTo,   setCustomTo]   = useState(to   ?? '')
  const [exporting,  setExporting]  = useState(false)

  const handlePreset = (val) => {
    if (val === 'custom') {
      setShowCustom(true)
      return
    }
    setShowCustom(false)
    onRangeChange({ range: val, from: null, to: null })
  }

  const applyCustom = () => {
    if (!customFrom || !customTo) return
    onRangeChange({ range: 'custom', from: customFrom, to: customTo })
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const csv = await getAnalyticsCSV({ range, from, to })
      if (!csv) return
      const blob = new Blob([csv], { type: 'text/csv' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `novara-analytics-${range}-${new Date().toISOString().slice(0,10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        {/* Preset pills */}
        <div className="flex items-center bg-white border border-neutral-100 rounded-2xl p-1.5 gap-1.5 shadow-sm overflow-x-auto no-scrollbar">
          {PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => handlePreset(p.value)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 whitespace-nowrap uppercase tracking-widest',
                (range === p.value || (p.value === 'custom' && showCustom))
                  ? 'bg-brand text-white shadow-lg shadow-brand/20'
                  : 'text-neutral-400 hover:text-brand-900 hover:bg-neutral-50',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* CSV Export */}
        <button
          onClick={handleExport}
          disabled={exporting || loading}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-neutral-100 rounded-2xl text-xs font-black text-brand-900 hover:border-brand hover:bg-neutral-50 transition-all shadow-sm disabled:opacity-50 uppercase tracking-widest"
        >
          {exporting
            ? <RefreshCw size={14} className="animate-spin text-brand" />
            : <Download size={14} className="text-brand" />
          }
          <span className="hidden sm:inline">{exporting ? 'Exporting…' : 'Export CSV'}</span>
        </button>
      </div>

      {/* Custom date pickers */}
      {showCustom && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-in slide-in-from-top-2">
          <div className="flex-1 flex items-center gap-3 bg-white border border-neutral-100 rounded-2xl px-5 py-4 shadow-sm focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10 transition-all">
            <Calendar size={16} className="text-brand shrink-0" />
            <div className="flex flex-col flex-1">
              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-0.5">Start Date</span>
              <input
                type="date"
                value={customFrom}
                max={customTo || undefined}
                onChange={e => setCustomFrom(e.target.value)}
                className="text-sm text-brand-900 bg-transparent focus:outline-none w-full font-black uppercase tracking-widest"
              />
            </div>
          </div>
          <div className="flex-1 flex items-center gap-3 bg-white border border-neutral-100 rounded-2xl px-5 py-4 shadow-sm focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10 transition-all">
            <Calendar size={16} className="text-brand shrink-0" />
            <div className="flex flex-col flex-1">
              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-0.5">End Date</span>
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                max={new Date().toISOString().slice(0,10)}
                onChange={e => setCustomTo(e.target.value)}
                className="text-sm text-brand-900 bg-transparent focus:outline-none w-full font-black uppercase tracking-widest"
              />
            </div>
          </div>
          <button
            onClick={applyCustom}
            disabled={!customFrom || !customTo}
            className="px-8 py-4.5 bg-brand text-white text-sm font-black rounded-2xl hover:bg-brand-700 disabled:opacity-40 transition-all shadow-xl shadow-brand/20 active:scale-95 uppercase tracking-widest"
          >
            Apply Filters
          </button>
        </div>
      )}
    </div>
  )
}