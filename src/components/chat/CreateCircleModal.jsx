'use client'
// FILE: src/components/chat/CreateCircleModal.jsx

import { useState } from 'react'
import { cn } from '@/utils/cn'
import { X, Lock, Globe, Loader2 } from 'lucide-react'

const CIRCLE_COLORS = [
  '#16A34A','#0D9488','#0EA5E9','#6366F1',
  '#A855F7','#EC4899','#F43F5E','#EA580C',
  '#D97706','#64748B',
]

const CIRCLE_EMOJIS = ['💬','🔥','💡','🛍️','🎉','📢','🎯','⚡','🌟','👑','🎨','🚀','💎','🏆','🌍']

export default function CreateCircleModal({ open, onClose, onCreate, loading }) {
  const [form, setForm] = useState({
    name:        '',
    description: '',
    emoji:       '💬',
    color:       '#16A34A',
    privacy:     'public',
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const canCreate = form.name.trim().length >= 2

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed z-[9999] inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center">
        <div className="bg-[#141922] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md overflow-hidden shadow-2xl border border-white/10">

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg"
              style={{ background: form.color }}
            >
              {form.emoji}
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-white">Create a Circle</p>
              <p className="text-[10px] text-neutral-500 mt-0.5">Vendor-only · Build your community</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>

          <div className="px-5 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

            {/* Emoji */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Icon</label>
              <div className="flex flex-wrap gap-2">
                {CIRCLE_EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => set('emoji', e)}
                    className={cn(
                      'w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all',
                      form.emoji === e
                        ? 'scale-110 ring-2 ring-brand-500'
                        : 'bg-white/5 hover:bg-white/10',
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Colour */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Colour</label>
              <div className="flex gap-2 flex-wrap">
                {CIRCLE_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => set('color', c)}
                    className={cn(
                      'w-8 h-8 rounded-xl border-2 transition-all',
                      form.color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105',
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Circle name *
              </label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Kente Fabric Lovers"
                maxLength={50}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-brand-600/60 transition-colors"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="What's this circle about?"
                rows={2}
                maxLength={200}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-brand-600/60 transition-colors resize-none"
              />
            </div>

            {/* Privacy */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Privacy</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'public',  Icon: Globe, label: 'Public',  desc: 'Anyone can discover & join' },
                  { id: 'private', Icon: Lock,  label: 'Private', desc: 'Invite only'                },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => set('privacy', opt.id)}
                    className={cn(
                      'flex flex-col items-start gap-1.5 p-3.5 rounded-2xl border-2 text-left transition-all',
                      form.privacy === opt.id
                        ? 'border-brand-600 bg-brand-900/30'
                        : 'border-white/10 bg-white/5 hover:border-white/20',
                    )}
                  >
                    <opt.Icon
                      size={16}
                      className={form.privacy === opt.id ? 'text-brand-400' : 'text-neutral-500'}
                    />
                    <p className={cn(
                      'text-xs font-bold',
                      form.privacy === opt.id ? 'text-white' : 'text-neutral-400',
                    )}>
                      {opt.label}
                    </p>
                    <p className="text-[9px] text-neutral-600">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-white/5">
            <button
              onClick={() => canCreate && onCreate(form)}
              disabled={!canCreate || loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-sm font-black disabled:opacity-40 active:scale-[0.98] transition-all"
              style={{ background: canCreate ? 'linear-gradient(135deg,#052E16,#16A34A)' : '#1f2937' }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Create Circle
            </button>
          </div>

        </div>
      </div>
    </>
  )
}