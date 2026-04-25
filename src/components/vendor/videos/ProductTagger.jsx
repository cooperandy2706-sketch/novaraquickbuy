'use client'
// FILE: src/components/vendor/videos/ProductTagger.jsx
// Renders a video preview and lets vendors drag/click to place product tags

import { useState, useRef } from 'react'
import { Plus, X, Tag, ShoppingBag, Search, Package } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function ProductTagger({ videoUrl, products = [], tags = [], onChange, fullScreen }) {
  const containerRef = useRef(null)
  const [showPicker, setShowPicker] = useState(false)
  const [pendingPos, setPendingPos] = useState(null) // { x, y } as % of container
  const [search,     setSearch]     = useState('')
  const [dragging,   setDragging]   = useState(null)  // tag id being dragged

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  // Click on video to place a new tag
  const handleVideoClick = (e) => {
    if (dragging) return
    const rect = containerRef.current.getBoundingClientRect()
    const x    = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1)
    const y    = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1)
    setPendingPos({ x: parseFloat(x), y: parseFloat(y) })
    setShowPicker(true)
    setSearch('')
  }

  const handlePickProduct = (product) => {
    if (!pendingPos) return
    const newTag = {
      id:         `tag-${Date.now()}`,
      product_id: product.id,
      product,
      position_x: pendingPos.x,
      position_y: pendingPos.y,
    }
    onChange([...tags, newTag])
    setShowPicker(false)
    setPendingPos(null)
  }

  const removeTag = (tagId) => {
    onChange(tags.filter(t => t.id !== tagId))
  }

  // Drag tag to reposition (Mouse + Touch)
  const handleTagStart = (e, tagId) => {
    e.stopPropagation()
    setDragging(tagId)
    
    const isTouch = e.type === 'touchstart'
    const moveEvent = isTouch ? 'touchmove' : 'mousemove'
    const upEvent = isTouch ? 'touchend' : 'mouseup'

    const onMove = (mv) => {
      const clientX = isTouch ? mv.touches[0].clientX : mv.clientX
      const clientY = isTouch ? mv.touches[0].clientY : mv.clientY
      
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width  * 100)))
      const y = Math.max(2, Math.min(98, ((clientY - rect.top)  / rect.height * 100)))
      onChange(tags.map(t => t.id === tagId ? { ...t, position_x: parseFloat(x.toFixed(1)), position_y: parseFloat(y.toFixed(1)) } : t))
    }
    
    const onUp = () => {
      setDragging(null)
      window.removeEventListener(moveEvent, onMove)
      window.removeEventListener(upEvent,   onUp)
    }
    
    window.addEventListener(moveEvent, onMove, { passive: false })
    window.addEventListener(upEvent,   onUp)
  }

  return (
    <div className={cn("space-y-4", fullScreen && "h-full w-full flex flex-col space-y-0")}>
      {!fullScreen && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-brand-800 flex items-center gap-2">
              <Tag size={14} className="text-brand" /> Product Tags
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Click anywhere on the video to place a product tag
            </p>
          </div>
          <span className="text-xs font-semibold text-brand bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-full">
            {tags.length} tag{tags.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Video with tag overlay */}
      <div
        ref={containerRef}
        onClick={handleVideoClick}
        className={cn(
          "relative bg-black overflow-hidden cursor-crosshair select-none",
          fullScreen ? "flex-1 w-full h-full" : "rounded-2xl mx-auto"
        )}
        style={fullScreen ? undefined : { aspectRatio: '9/16', maxHeight: '55vh', maxWidth: 320 }}
      >
        {videoUrl ? (
          <video src={videoUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/40 gap-2">
            <Package size={36} />
            <p className="text-xs">Upload a video first</p>
          </div>
        )}

        {/* Click hint */}
        {videoUrl && tags.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2.5 rounded-full flex items-center gap-2">
              <Plus size={14} /> Click to tag a product
            </div>
          </div>
        )}

        {/* Pending position marker */}
        {pendingPos && !showPicker && (
          <div className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${pendingPos.x}%`, top: `${pendingPos.y}%` }}>
            <div className="w-5 h-5 rounded-full bg-brand border-2 border-white animate-ping" />
          </div>
        )}

        {/* Placed tags */}
        {tags.map(tag => (
          <div
            key={tag.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
            style={{ left: `${tag.position_x}%`, top: `${tag.position_y}%` }}
            onMouseDown={e => handleTagStart(e, tag.id)}
            onTouchStart={e => handleTagStart(e, tag.id)}
          >
            {/* Tag dot */}
            <div className="relative">
              <div className={cn(
                'w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-lg border-2 border-brand flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform',
                dragging === tag.id && 'scale-125',
              )}>
                <ShoppingBag size={13} className="text-brand" />
              </div>

              {/* Product tooltip — simplified for mobile (always show on active/drag or hover) */}
              <div className={cn(
                "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none transition-opacity z-20 whitespace-nowrap",
                dragging === tag.id ? "opacity-100" : "opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100"
              )}>
                <div className="bg-surface-2 rounded-xl shadow-xl border border-border p-2 flex items-center gap-2 min-w-max">
                  <div className="w-8 h-8 rounded-lg bg-surface-3 border border-border overflow-hidden shrink-0">
                    <img src={tag.product?.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-[10px] font-bold text-primary truncate max-w-[120px]">{tag.product?.name}</p>
                    <p className="text-[9px] text-brand font-black mt-0.5">${tag.product?.price?.toFixed(2)}</p>
                  </div>
                </div>
                <div className="w-2 h-2 bg-surface-2 border-r border-b border-border rotate-45 mx-auto -mt-1" />
              </div>

              {/* Remove button — larger on mobile */}
              <button
                onClick={e => { e.stopPropagation(); removeTag(tag.id) }}
                onMouseDown={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
                className="absolute -top-2 -right-2 w-5 h-5 sm:w-4 sm:h-4 rounded-full bg-danger text-white flex items-center justify-center sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
              >
                <X size={10} />
              </button>
            </div>
          </div>
        ))}

        {/* Product picker overlay */}
        {showPicker && pendingPos && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col justify-end sm:items-center sm:justify-center z-[150]"
            onClick={e => { e.stopPropagation(); setShowPicker(false); setPendingPos(null) }}
          >
            <div
              className="w-full sm:max-w-md bg-surface-2 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-4 h-[75vh] sm:h-[60vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <p className="font-bold text-primary text-base sm:text-lg">Tag a Product</p>
                <button onClick={() => { setShowPicker(false); setPendingPos(null) }}
                  className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-muted hover:text-primary transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Search */}
              <div className="relative shrink-0">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search products…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-border bg-surface-1 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all shadow-sm"
                />
              </div>

              {/* Product list */}
              <div className="overflow-y-auto flex-1 space-y-2.5 pb-safe pr-1 no-scrollbar">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted">
                    <Package size={32} className="opacity-20 mb-3" />
                    <p className="text-sm font-medium">No products found</p>
                  </div>
                ) : filtered.map(product => {
                  const alreadyTagged = tags.some(t => t.product_id === product.id)
                  return (
                    <button
                      key={product.id}
                      onClick={() => !alreadyTagged && handlePickProduct(product)}
                      disabled={alreadyTagged}
                      className={cn(
                        'w-full flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98]',
                        alreadyTagged
                          ? 'border-brand bg-brand/5 opacity-60 cursor-not-allowed'
                          : 'border-border bg-surface-1 hover:border-brand/40 hover:bg-brand/5 shadow-sm',
                      )}
                    >
                      <div className="w-12 h-12 rounded-xl bg-surface-3 border border-border overflow-hidden shrink-0">
                        {product.thumbnail_url
                          ? <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-muted"><Package size={16} /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-primary truncate leading-tight">
                          {product.name}
                        </p>
                        <p className="text-[11px] font-mono font-bold text-brand mt-1 uppercase tracking-wider">
                          ${product.price?.toFixed(2)}
                        </p>
                      </div>
                      {alreadyTagged && (
                        <span className="text-[10px] bg-brand text-white font-black px-2 py-1 rounded-md shrink-0 tracking-wide uppercase">
                          Tagged
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tags list below video */}
      {tags.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Tagged Products</p>
          {tags.map(tag => (
            <div key={tag.id} className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 overflow-hidden border border-neutral-200 shrink-0">
                {tag.product?.thumbnail_url
                  ? <img src={tag.product.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-neutral-300"><Package size={12} /></div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-brand-800 truncate">{tag.product?.name}</p>
                <p className="text-[11px] text-brand font-bold">${tag.product?.price?.toFixed(2)}</p>
              </div>
              <span className="text-[10px] text-neutral-400">
                {tag.position_x}%, {tag.position_y}%
              </span>
              <button onClick={() => removeTag(tag.id)} className="text-neutral-400 hover:text-danger transition-colors shrink-0">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}