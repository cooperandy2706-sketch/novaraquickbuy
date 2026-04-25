'use client'
// FILE: src/app/(vendor)/vendor/circles/CirclesClient.jsx

import { useState }          from 'react'
import { useRouter }         from 'next/navigation'
import { useAuth }           from '@/hooks/useAuth'
import { useRealtimeCircleList } from '@/hooks/useRealtimeCircle'
import {
  Plus, Users, Megaphone, Crown, Zap,
  ShoppingBag, ArrowRight, TrendingUp,
} from 'lucide-react'
import CircleCard        from '@/components/vendor/circles/CircleCard'
import CircleCreateModal from '@/components/vendor/circles/CircleCreateModal'
import { deleteCircle }  from '@/lib/actions/circles'
import { cn }            from '@/utils/cn'

const TYPE_ICONS = {
  general:       { icon: Users,       color: 'bg-brand/10 text-brand'          },
  vip:           { icon: Crown,       color: 'bg-amber-500/10 text-amber-600'  },
  wholesale:     { icon: ShoppingBag, color: 'bg-emerald-500/10 text-emerald-700' },
  flash_sale:    { icon: Zap,         color: 'bg-orange-500/10 text-orange-600' },
  announcements: { icon: Megaphone,   color: 'bg-violet-500/10 text-violet-600' },
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-20 h-20 rounded-3xl bg-brand/10 flex items-center justify-center mb-6 text-4xl">
        💬
      </div>
      <h2 className="text-xl font-bold text-primary mb-2">No circles yet</h2>
      <p className="text-sm text-muted max-w-xs leading-relaxed mb-6">
        Circles are your private communities. Create groups for VIP customers, flash sales, wholesale buyers, or general announcements.
      </p>
      <button onClick={onCreate}
        className="flex items-center gap-2 px-6 py-3 bg-brand text-white font-bold rounded-xl text-sm shadow-brand hover:bg-brand-700 transition-all active:scale-[0.98]">
        <Plus size={16} /> Create Your First Circle
      </button>
    </div>
  )
}

import ComingSoon from '@/components/vendor/ComingSoon'

export default function CirclesClient() {
  return (
    <ComingSoon 
      title="Circles" 
      desc="Private communities, VIP groups, and exclusive deals are coming to your dashboard soon."
      icon={Users}
    />
  )
}