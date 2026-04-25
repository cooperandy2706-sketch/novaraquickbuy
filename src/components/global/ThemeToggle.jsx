'use client'
// FILE: src/components/global/ThemeToggle.jsx

import { useThemeStore } from '@/store/themeStore'
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/utils/cn'

export default function ThemeToggle({ variant = 'default' }) {
  const { preference, setPreference } = useThemeStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on click outside
  useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const options = [
    { id: 'light',  label: 'Light',  icon: Sun },
    { id: 'dark',   label: 'Dark',   icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ]

  const active = options.find(o => o.id === preference) || options[2]

  if (variant === 'minimal') {
    return (
      <div className="flex gap-1 bg-surface-2 p-1 rounded-xl border border-border">
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => setPreference(opt.id)}
            className={cn(
              "p-2 rounded-lg transition-all duration-200",
              preference === opt.id 
                ? "bg-brand text-white shadow-sm" 
                : "text-secondary hover:bg-surface-3"
            )}
            title={opt.label}
          >
            <opt.icon size={14} />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200",
          "bg-surface-2 border border-border hover:border-brand/40",
          "text-primary shadow-sm"
        )}
      >
        <active.icon size={16} className="text-brand" />
        <span className="text-xs font-bold hidden sm:inline">{active.label}</span>
        <ChevronDown size={12} className={cn("transition-transform duration-300", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 bg-surface-2 border border-border rounded-2xl shadow-xl overflow-hidden z-50 animate-scale-in">
          <div className="p-1.5 space-y-0.5">
            {options.map(opt => (
              <button
                key={opt.id}
                onClick={() => { setPreference(opt.id); setOpen(false) }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors",
                  preference === opt.id 
                    ? "bg-brand text-white" 
                    : "text-secondary hover:bg-surface-3 hover:text-primary"
                )}
              >
                <opt.icon size={14} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
