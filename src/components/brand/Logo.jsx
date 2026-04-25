// FILE: src/components/brand/Logo.jsx
'use client'

import { cn } from '@/utils/cn'

const ICON_SIZES = {
  xs: 24, sm: 32, md: 44, lg: 56, xl: 80,
}

const TEXT_SIZES = {
  xs: { name: 'text-base', sub: 'text-[7px]',  gap: 'gap-2'   },
  sm: { name: 'text-lg',   sub: 'text-[8px]',  gap: 'gap-2.5' },
  md: { name: 'text-2xl',  sub: 'text-[9px]',  gap: 'gap-3'   },
  lg: { name: 'text-3xl',  sub: 'text-[10px]', gap: 'gap-4'   },
  xl: { name: 'text-5xl',  sub: 'text-xs',     gap: 'gap-5'   },
}

export function LogoIcon({ size = 44, variant = 'full', className }) {
  const colors = {
    full: {
      cartStroke: '#16A34A', wheels: '#16A34A',
      bigBubble: '#14532D', bigBubbleTail: '#14532D', dots: '#FFFFFF',
      smallBubble: '#F59E0B', smallTail: '#F59E0B', star: '#F59E0B',
      bg: 'none', bgRx: 0,
    },
    badge: {
      cartStroke: '#FFFFFF', wheels: '#FFFFFF',
      bigBubble: '#052E16', bigBubbleTail: '#052E16', dots: '#FFFFFF',
      smallBubble: '#F59E0B', smallTail: '#F59E0B', star: '#F59E0B',
      bg: '#16A34A', bgRx: 22,
    },
    white: {
      cartStroke: '#FFFFFF', wheels: '#FFFFFF',
      bigBubble: 'rgba(255,255,255,0.2)', bigBubbleTail: 'rgba(255,255,255,0.2)',
      dots: '#FFFFFF', smallBubble: '#F59E0B', smallTail: '#F59E0B',
      star: '#F59E0B', bg: 'none', bgRx: 0,
    },
    dark: {
      cartStroke: '#16A34A', wheels: '#16A34A',
      bigBubble: '#16A34A', bigBubbleTail: '#16A34A', dots: '#FFFFFF',
      smallBubble: '#F59E0B', smallTail: '#F59E0B', star: '#F59E0B',
      bg: 'none', bgRx: 0,
    },
  }

  const c = colors[variant] ?? colors.full

  return (
    <svg
      width={size} height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {c.bg !== 'none' && (
        <rect width="100" height="100" rx={c.bgRx} fill={c.bg} />
      )}
      <path
        d="M10 22 L18 22 Q21 22 22 25 L29 58 Q30 61 33 61 L76 61 Q79 61 80 58 L87 34 Q88 31 85 31 L26 31"
        stroke={c.cartStroke} strokeWidth="5.5"
        strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      <circle cx="39" cy="73" r="6"  stroke={c.wheels} strokeWidth="4" fill="none" />
      <circle cx="66" cy="73" r="6"  stroke={c.wheels} strokeWidth="4" fill="none" />
      <ellipse cx="44" cy="46" rx="16" ry="11" fill={c.bigBubble} />
      <path d="M37 55 L33 63 L45 56" fill={c.bigBubbleTail} />
      <circle cx="38" cy="46" r="2.2" fill={c.dots} />
      <circle cx="44" cy="46" r="2.2" fill={c.dots} />
      <circle cx="50" cy="46" r="2.2" fill={c.dots} />
      <ellipse cx="61" cy="53" rx="12" ry="8.5" fill={c.smallBubble} />
      <path d="M54 59 L51 66 L62 60" fill={c.smallTail} />
      <path
        d="M80 10 L82.5 17.5 L90.5 17.5 L84.2 22.2 L86.5 30 L80 25.3 L73.5 30 L75.8 22.2 L69.5 17.5 L77.5 17.5 Z"
        fill={c.star}
      />
    </svg>
  )
}

export default function Logo({ variant = 'full', size = 'md', className }) {
  const iconSize = ICON_SIZES[size] ?? ICON_SIZES.md
  const text     = TEXT_SIZES[size] ?? TEXT_SIZES.md

  const nameColor = {
    full: 'text-brand-800', badge: 'text-brand-800',
    white: 'text-white',    dark:  'text-brand-50',
  }[variant] ?? 'text-brand-800'

  const subColor = {
    full: 'text-brand-600', badge: 'text-brand-500',
    white: 'text-white/70', dark:  'text-brand-300',
  }[variant] ?? 'text-brand-600'

  const iconVariant = {
    full: 'full', badge: 'full', white: 'white', dark: 'dark',
  }[variant] ?? 'full'

  return (
    <div className={cn('flex items-center', text.gap, className)}>
      <LogoIcon size={iconSize} variant={iconVariant} />
      <div className="flex flex-col justify-center leading-none gap-[3px]">
        <span
          className={cn('font-extrabold tracking-tight leading-none', text.name, nameColor)}
          style={{ letterSpacing: '-0.03em' }}
        >
          novara
        </span>
        <span className={cn('font-bold uppercase tracking-[0.18em] leading-none', text.sub, subColor)}>
          quickbuy
        </span>
      </div>
    </div>
  )
}

export function LogoBadge({ size = 44, className }) {
  return <LogoIcon size={size} variant="badge" className={className} />
}

export function LogoWhite({ size = 'md', className }) {
  return <Logo variant="white" size={size} className={className} />
}

export function LogoDark({ size = 'md', className }) {
  return <Logo variant="dark" size={size} className={className} />
}