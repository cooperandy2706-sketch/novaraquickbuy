'use client'
// FILE: src/components/ui/ThemeToggle.jsx
// 3-way theme picker: Light · System · Dark
// Drop in anywhere — profile settings, header, nav.

import { Sun, Monitor, Moon } from 'lucide-react'
import { useThemeStore }      from '@/store/themeStore'
import { cn }                 from '@/utils/cn'

const OPTIONS = [
  { value: 'light',  Icon: Sun,     label: 'Light'  },
  { value: 'system', Icon: Monitor, label: 'System' },
  { value: 'dark',   Icon: Moon,    label: 'Dark'   },
]

export default function ThemeToggle({ showLabels = false, className }) {
  const { preference, setPreference } = useThemeStore()

  return (
    <div
      role="group"
      aria-label="Color theme"
      className={cn(
        'inline-flex items-center gap-0.5 p-1 rounded-xl',
        'bg-neutral-100 dark:bg-neutral-800',
        'border border-neutral-200 dark:border-neutral-700',
        className,
      )}
    >
      {OPTIONS.map(({ value, Icon, label }) => {
        const active = preference === value
        return (
          <button
            key={value}
            onClick={() => setPreference(value)}
            title={label}
            aria-pressed={active}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150',
              active
                ? [
                    'bg-white dark:bg-neutral-700 shadow-sm',
                    'text-neutral-900 dark:text-white',
                  ]
                : [
                    'text-neutral-500 dark:text-neutral-400',
                    'hover:text-neutral-700 dark:hover:text-neutral-200',
                  ],
            )}
          >
            <Icon size={13} strokeWidth={active ? 2.5 : 1.8} />
            {showLabels && <span>{label}</span>}
          </button>
        )
      })}
    </div>
  )
}