'use client'
// FILE: src/components/vendor/circles/PollCreator.jsx

import { useState } from 'react'
import {
  BarChart2, Plus, Trash2, X,
  Loader2, Clock, CheckSquare,
} from 'lucide-react'
import { createPoll } from '@/lib/actions/polls'
import { cn }         from '@/utils/cn'

export default function PollCreator({ circleId, onSent, onClose }) {
  const [question,   setQuestion]   = useState('')
  const [options,    setOptions]    = useState(['', ''])
  const [multiple,   setMultiple]   = useState(false)
  const [expiresIn,  setExpiresIn]  = useState('')   // '' | '1h' | '6h' | '24h' | '3d' | '7d'
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)

  const addOption    = () => { if (options.length < 10) setOptions(o => [...o, '']) }
  const removeOption = (i) => setOptions(o => o.filter((_, idx) => idx !== i))
  const setOption    = (i, v) => setOptions(o => o.map((x, idx) => idx === i ? v : x))

  const filledOptions = options.filter(o => o.trim())

  const expiresAtFromChoice = (choice) => {
    const map = { '1h': 3600, '6h': 21600, '24h': 86400, '3d': 259200, '7d': 604800 }
    const secs = map[choice]
    if (!secs) return null
    return new Date(Date.now() + secs * 1000).toISOString()
  }

  const handleCreate = async () => {
    if (!question.trim())            { setError('Please enter a question'); return }
    if (filledOptions.length < 2)    { setError('Add at least 2 options'); return }
    setLoading(true)
    setError(null)

    const res = await createPoll(circleId, {
      question,
      options:    filledOptions,
      multiple,
      expiresAt:  expiresAtFromChoice(expiresIn),
    })

    setLoading(false)
    if (res?.error) { setError(res.error); return }
    onSent?.(res.data)
    onClose()
  }

  const EXPIRY_OPTIONS = [
    { value: '',    label: 'No expiry'   },
    { value: '1h',  label: '1 hour'      },
    { value: '6h',  label: '6 hours'     },
    { value: '24h', label: '24 hours'    },
    { value: '3d',  label: '3 days'      },
    { value: '7d',  label: '7 days'      },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-lg bg-surface-2 rounded-t-2xl shadow-2xl max-h-[90dvh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <p className="font-bold text-primary flex items-center gap-2 text-sm">
            <BarChart2 size={15} className="text-brand" /> Create a Poll
          </p>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Question */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-primary">Question *</label>
            <textarea
              rows={2}
              placeholder="Ask your circle something… e.g. Which product would you like to see next?"
              value={question}
              onChange={e => { setQuestion(e.target.value); setError(null) }}
              maxLength={200}
              className={cn(
                'w-full rounded-xl border bg-surface-3 px-4 py-3 text-sm placeholder:text-muted text-primary',
                'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all resize-none',
                error && !question.trim() ? 'border-danger/50' : 'border-border',
              )}
            />
            <div className="flex justify-end">
              <span className={cn('text-[10px]', question.length > 180 ? 'text-amber-500' : 'text-muted')}>
                {question.length}/200
              </span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-primary">
              Options <span className="text-muted font-normal text-xs">(min 2, max 10)</span>
            </label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted w-5 text-center shrink-0">{i + 1}</span>
                  <input
                    type="text"
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={e => setOption(i, e.target.value)}
                    maxLength={100}
                    className="flex-1 rounded-xl border border-border bg-surface-3 px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all text-primary"
                  />
                  {options.length > 2 && (
                    <button onClick={() => removeOption(i)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-danger hover:bg-danger/10 transition-all shrink-0">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <button onClick={addOption}
                className="flex items-center gap-2 text-xs font-semibold text-brand hover:text-brand-700 transition-colors mt-1">
                <Plus size={14} /> Add option
              </button>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-primary">Settings</label>

            {/* Multiple choice */}
            <button type="button"
              onClick={() => setMultiple(m => !m)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all',
                multiple ? 'border-brand bg-brand/10' : 'border-border hover:border-brand/30',
              )}>
              <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                multiple ? 'bg-brand border-brand' : 'border-border/60')}>
                {multiple && <CheckSquare size={12} className="text-white" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">Allow multiple choice</p>
                <p className="text-xs text-muted mt-0.5">Members can select more than one option</p>
              </div>
            </button>

            {/* Expiry */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Clock size={14} className="text-muted" /> Poll ends after
              </div>
              <div className="grid grid-cols-3 gap-2">
                {EXPIRY_OPTIONS.map(e => (
                  <button key={e.value} type="button"
                    onClick={() => setExpiresIn(e.value)}
                    className={cn(
                      'py-2 rounded-xl border text-xs font-semibold transition-all',
                      expiresIn === e.value
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-border text-secondary hover:bg-surface-3',
                    )}>
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-danger/5 border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-border shrink-0 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-secondary hover:bg-surface-3 transition-all">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={loading || filledOptions.length < 2 || !question.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm shadow-brand transition-all active:scale-[0.98]">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <><BarChart2 size={15} /> Send Poll</>}
          </button>
        </div>
      </div>
    </div>
  )
}