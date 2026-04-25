'use client'

import { BadgeCheck, Clock } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * VendorBadge component
 * @param {Object} vendor - The vendor object containing verified and verification_status
 * @param {'xs' | 'sm' | 'md'} size - The size of the badge
 * @param {string} className - Additional CSS classes
 */
export default function VendorBadge({ vendor, size = 'sm', className }) {
  const status = vendor?.verification_status || (vendor?.verified ? 'verified' : 'unverified')
  
  if (status === 'verified') {
    return (
      <span className={cn(
        "flex items-center gap-1 bg-brand text-white font-bold rounded-full",
        size === 'xs' ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-0.5 text-[10px]",
        className
      )}>
        <BadgeCheck size={size === 'xs' ? 8 : 10} /> Verified
      </span>
    )
  }

  if (status === 'pending') {
    return (
      <span className={cn(
        "flex items-center gap-1 bg-amber-500 text-white font-bold rounded-full",
        size === 'xs' ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-0.5 text-[10px]",
        className
      )}>
        <Clock size={size === 'xs' ? 8 : 10} /> Pending
      </span>
    )
  }

  // Not Verified / Unverified
  return (
    <span className={cn(
      "flex items-center gap-1 bg-neutral-400 text-white font-bold rounded-full",
      size === 'xs' ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-0.5 text-[10px]",
      className
    )}>
      Not Verified
    </span>
  )
}
