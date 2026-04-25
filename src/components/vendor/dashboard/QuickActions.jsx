'use client'

import Link from 'next/link'
import {
  Plus, Upload, Tag, Megaphone,
  PackageSearch, BarChart3, Users, Video,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/utils/cn'

const ACTIONS = [
  {
    label:  'Add Product',
    desc:   'List a new item for sale',
    icon:   Plus,
    href:   '/vendor/products/new',
    color:  'bg-brand text-white hover:bg-brand-700',
    shadow: 'shadow-brand',
    primary: true,
  },
  {
    label:  'Upload Video',
    desc:   'Post a shoppable video',
    icon:   Video,
    href:   '/vendor/videos/new',
    color:  'bg-pink-500 text-white hover:bg-pink-600',
    shadow: 'shadow-sm',
    primary: true,
  },
  {
    label:  'Flash Sale',
    desc:   'Create a discount campaign',
    icon:   Tag,
    href:   '/vendor/marketing/campaigns/new',
    color:  'bg-surface-3 text-primary border border-border hover:border-brand/40 hover:bg-brand/10',
    shadow: 'shadow-sm',
  },
  {
    label:  'Promote Video',
    desc:   'Boost a video in the feed',
    icon:   Megaphone,
    href:   '/vendor/marketing/sponsored',
    color:  'bg-surface-3 text-primary border border-border hover:border-brand/40 hover:bg-brand/10',
    shadow: 'shadow-sm',
  },
  {
    label:  'Check Stock',
    desc:   'View inventory levels',
    icon:   PackageSearch,
    href:   '/vendor/inventory',
    color:  'bg-surface-3 text-primary border border-border hover:border-brand/40 hover:bg-brand/10',
    shadow: 'shadow-sm',
  },
  {
    label:  'Analytics',
    desc:   'Revenue & video insights',
    icon:   BarChart3,
    href:   '/vendor/analytics',
    color:  'bg-surface-3 text-primary border border-border hover:border-brand/40 hover:bg-brand/10',
    shadow: 'shadow-sm',
  },
  {
    label:  'Circles',
    desc:   'Broadcast to customers',
    icon:   Users,
    href:   '/vendor/circles',
    color:  'bg-surface-3 text-primary border border-border hover:border-brand/40 hover:bg-brand/10',
    shadow: 'shadow-sm',
  },
  {
    label:  'Import Products',
    desc:   'Bulk upload via CSV',
    icon:   Upload,
    href:   '/vendor/import',
    color:  'bg-surface-3 text-primary border border-border hover:border-brand/40 hover:bg-brand/10',
    shadow: 'shadow-sm',
  },
]

export default function QuickActions() {
  return (
    <div className="bg-surface-2 rounded-3xl border border-border shadow-sm overflow-hidden relative z-20">
      <div className="px-6 py-5 border-b border-border bg-surface-3/30 flex items-center justify-between">
        <h3 className="font-black text-neutral-900 text-sm uppercase tracking-widest flex items-center gap-2">
          <Sparkles size={14} className="text-brand" />
          Quick Actions
        </h3>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-brand/40" />
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ACTIONS.map(action => {
          const Icon = action.icon
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                'group flex flex-col items-center gap-3 px-4 py-5 rounded-2xl text-center transition-all duration-300',
                'border border-transparent',
                action.primary
                  ? cn(action.color, action.shadow, 'hover:scale-[1.02] active:scale-[0.98]')
                  : 'bg-white border-neutral-200 hover:border-brand/40 hover:bg-brand/5 hover:text-brand',
                'relative overflow-hidden'
              )}
            >
              {/* Icon Container */}
              <div className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 duration-300',
                action.primary ? 'bg-white/20' : 'bg-neutral-50 text-neutral-600 group-hover:text-brand group-hover:bg-brand/10'
              )}>
                <Icon size={24} strokeWidth={2.5} className="pointer-events-none" />
              </div>

              <div className="pointer-events-none relative z-10">
                <p className="text-xs font-black leading-tight tracking-tight uppercase">{action.label}</p>
                <p className={cn(
                  'text-[9px] mt-1 leading-tight font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute w-full left-0',
                  action.primary ? 'text-white' : 'text-brand',
                )}>
                  Tap to open
                </p>
                <p className={cn(
                  'text-[9px] mt-1 leading-tight font-medium group-hover:opacity-0 transition-opacity',
                  action.primary ? 'text-white/80' : 'text-neutral-400',
                )}>
                  {action.desc}
                </p>
              </div>

              {/* Shine effect for primary */}
              {action.primary && (
                <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:left-[100%] transition-all duration-1000 ease-in-out pointer-events-none" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}