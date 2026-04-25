// FILE: src/components/video/ProductTag.jsx
'use client'

import { useState } from 'react'
import { cn }       from '@/utils/cn'

export default function ProductTag({ tag, onTap }) {
  const [pressed, setPressed] = useState(false)
  const product = tag.product
  if (!product) return null

  const price = product.discount_price || product.price
  const formatted = new Intl.NumberFormat('en-GH', {
    style: 'currency', currency: 'GHS', minimumFractionDigits: 0
  }).format(price)

  return (
    <button
      onClick={() => { setPressed(true); setTimeout(() => setPressed(false), 200); onTap?.() }}
      style={{ left: `${tag.position_x}%`, top: `${tag.position_y}%` }}
      className={cn(
        'product-tag',
        pressed && 'scale-95'
      )}
    >
      <span className="product-tag-dot animate-ping-slow" />
      <span className="max-w-[120px] truncate">{product.name}</span>
      <span className="font-bold text-brand shrink-0">{formatted}</span>
    </button>
  )
}