'use client'
// FILE: src/components/chat/StatusRingAvatar.jsx

import { cn } from '@/utils/cn'

/**
 * StatusRingAvatar - A premium WhatsApp-style avatar with a segmented ring.
 * Highlights "unseen" statuses in brand colors and "seen" in gray.
 * 
 * @param {string} src - Avatar image URL
 * @param {string} name - Name (for initial fallback)
 * @param {Array} statuses - Array of status objects with { id, seen }
 * @param {number} size - Inner avatar diameter
 * @param {function} onClick - Click handler for viewing
 * @param {function} onAdd - Click handler for adding (Vendor only)
 */
export default function StatusRingAvatar({ 
  src, 
  name, 
  statuses = [], 
  size = 40, 
  onClick,
  onAdd,
  className 
}) {
  const total = statuses.length
  
  // If no statuses, show a simple refined circle
  if (total === 0) {
    return (
      <div 
        className={cn(
          'relative rounded-full overflow-hidden cursor-pointer ring-2 ring-border/50 ring-offset-2 ring-offset-surface transition-all hover:scale-105 active:scale-95',
          className
        )}
        style={{ width: size, height: size }}
        onClick={onClick}
      >
        {src ? (
          <img src={src} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-surface-3 flex items-center justify-center font-black text-muted text-sm">
            {name?.[0]?.toUpperCase() ?? 'U'}
          </div>
        )}

        {/* Add Badge (No Stories) */}
        {onAdd && (
          <button 
            onClick={(e) => { e.stopPropagation(); onAdd() }}
            className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-brand text-white flex items-center justify-center border border-surface shadow-sm hover:scale-110 active:scale-90 transition-all z-10"
            style={{ width: size * 0.4, height: size * 0.4 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-full h-full p-[20%]">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
      </div>
    )
  }

  // Segmented ring calculation
  const strokeWidth   = 2.5
  const padding       = 6 // Space for the ring
  const circleSize    = size + padding * 2
  const center        = circleSize / 2
  const radius        = (size / 2) + 2 // Ring sits slightly outside the avatar
  const circumference = 2 * Math.PI * radius
  
  // Gap between segments (in pixels on the circumference)
  const gapPixels     = total > 1 ? (total > 10 ? 2 : 4) : 0
  const segmentLength = (circumference / total) - gapPixels

  return (
    <div 
      className={cn('relative flex items-center justify-center cursor-pointer group select-none', className)} 
      style={{ width: circleSize, height: circleSize }}
      onClick={onClick}
    >
      {/* Segmented Ring SVG */}
      <svg 
        width={circleSize} 
        height={circleSize} 
        className="absolute inset-0 -rotate-90 transform transition-all duration-500 ease-out group-hover:rotate-0"
      >
        {statuses.map((s, i) => {
          // Dash offset needs to account for the current segment + gaps
          const offset = -i * (segmentLength + gapPixels)
          
          return (
            <circle
              key={s.id || i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={s.seen ? 'var(--color-border)' : 'var(--color-brand)'}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
              strokeDashoffset={offset}
              strokeLinecap={total === 1 ? 'round' : 'butt'}
              className="transition-colors duration-300"
            />
          )
        })}
      </svg>
      
      {/* Inner Avatar */}
      <div 
        className="relative rounded-full overflow-hidden bg-surface shadow-inner border-[1.5px] border-surface transition-transform duration-300 group-hover:scale-[0.92]" 
        style={{ width: size, height: size }}
      >
        {src ? (
          <img src={src} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-3 font-black text-muted text-sm">
            {name?.[0]?.toUpperCase() ?? 'U'}
          </div>
        )}
      </div>

      {/* Add Badge (Active Stories) */}
      {onAdd && (
        <button 
          onClick={(e) => { e.stopPropagation(); onAdd() }}
          className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-brand text-white flex items-center justify-center border border-surface shadow-md hover:scale-110 active:scale-90 transition-all z-20"
          style={{ width: size * 0.4, height: size * 0.4 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-full h-full p-[20%]">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      {/* Micro-interaction: Scale on press */}
      <style jsx>{`
        div:active { transform: scale(0.95); }
      `}</style>
    </div>
  )
}
