'use client'
// FILE: src/components/status/StatusViewer.jsx

import { useState, useEffect, useRef, useMemo } from 'react'
import { X, Heart, MessageCircle, Send, ChevronLeft, ChevronRight, Eye, Users, Clock } from 'lucide-react'
import { useStatuses } from '@/hooks/useStatuses'
import { useAuth }     from '@/hooks/useAuth'
import { cn }         from '@/utils/cn'
import { formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * StatusViewer - An immersive, full-screen story viewer for vendor updates.
 * Supports grouping by vendor, auto-progression, likes, and comments.
 */
export default function StatusViewer({ 
  isOpen, 
  onClose, 
  initialVendorId = null 
}) {
  const { statuses, viewStatus, toggleLike, postComment, getStatusViewers, loading } = useStatuses()
  const { isVendor, vendor } = useAuth()
  const [activeVendorIdx, setActiveVendorIdx] = useState(0)
  const [activeStatusIdx, setActiveStatusIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused,   setPaused]   = useState(false)
  const [commentText, setCommentText] = useState('')
  const [showViewers, setShowViewers] = useState(false)
  const [viewers,     setViewers]     = useState([])
  const [loadingViewers, setLoadingViewers] = useState(false)
  const progressTimer = useRef(null)

  // 1. Group statuses by vendor
  const vendorGroups = useMemo(() => {
    const groups = {}
    statuses.forEach(s => {
      if (!groups[s.vendor_id]) {
        groups[s.vendor_id] = {
          vendor: s.vendor,
          items: []
        }
      }
      groups[s.vendor_id].items.push(s)
    })
    return Object.values(groups)
  }, [statuses])

  const currentVendor = vendorGroups[activeVendorIdx]
  const currentStatus = currentVendor?.items[activeStatusIdx]
  const isOwner       = isVendor && vendor?.id === currentStatus?.vendor_id

  // 2. Set initial vendor based on provided ID
  useEffect(() => {
    if (initialVendorId && vendorGroups.length > 0) {
      const idx = vendorGroups.findIndex(g => g.vendor.id === initialVendorId)
      if (idx !== -1) {
        setActiveVendorIdx(idx)
        setActiveStatusIdx(0)
      }
    }
  }, [initialVendorId, vendorGroups])

  // 3. Auto-progression logic
  useEffect(() => {
    if (!isOpen || !currentStatus || paused || showViewers) {
      clearInterval(progressTimer.current)
      return
    }

    // Mark as viewed in DB
    if (!currentStatus.seen) {
      viewStatus(currentStatus.id)
    }

    setProgress(0)
    const duration = currentStatus.media_type === 'video' ? 15000 : 5000
    const interval = 50
    const step     = (interval / duration) * 100

    progressTimer.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          next()
          return 100
        }
        return p + step
      })
    }, interval)

    return () => clearInterval(progressTimer.current)
  }, [isOpen, activeVendorIdx, activeStatusIdx, paused, currentStatus?.id, showViewers])

  // 4. Fetch viewers when opening list
  useEffect(() => {
    if (showViewers && currentStatus?.id) {
      setLoadingViewers(true)
      getStatusViewers(currentStatus.id).then(({ data }) => {
        setViewers(data || [])
        setLoadingViewers(false)
      })
    }
  }, [showViewers, currentStatus?.id])

  const next = () => {
    if (!currentVendor) return
    if (activeStatusIdx < (currentVendor.items.length - 1)) {
      setActiveStatusIdx(i => i + 1)
    } else if (activeVendorIdx < (vendorGroups.length - 1)) {
      setActiveVendorIdx(i => i + 1)
      setActiveStatusIdx(0)
    } else {
      onClose()
    }
  }

  const prev = () => {
    if (activeStatusIdx > 0) {
      setActiveStatusIdx(i => i - 1)
    } else if (activeVendorIdx > 0) {
      const prevVendorIdx = activeVendorIdx - 1
      setActiveVendorIdx(prevVendorIdx)
      setActiveStatusIdx(vendorGroups[prevVendorIdx].items.length - 1)
    }
  }

  const handleLike = async () => {
    if (!currentStatus) return
    await toggleLike(currentStatus.id)
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || !currentStatus) return
    const res = await postComment(currentStatus.id, commentText)
    if (!res?.error) {
      setCommentText('')
      setPaused(false)
    }
  }

  const handleSwipeUp = (e, info) => {
    if (isOwner && info.offset.y < -100) {
      setShowViewers(true)
    }
  }

  if (!isOpen || vendorGroups.length === 0) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-fade-in backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />

        <motion.div 
          className="relative w-full max-w-lg h-full sm:h-[90vh] sm:max-h-[850px] sm:rounded-3xl overflow-hidden bg-black shadow-2xl flex flex-col border border-white/10"
        >
          {/* Top Progress Bars */}
          <div className="absolute top-0 left-0 right-0 z-[30] p-4 flex gap-1.5 pt-6">
            {currentVendor?.items.map((s, i) => (
              <div key={s.id} className="h-[2.5px] flex-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-75 ease-linear"
                  style={{ 
                     width: i < activeStatusIdx ? '100%' : i === activeStatusIdx ? `${progress}%` : '0%' 
                  }}
                />
              </div>
            ))}
          </div>

          {/* Top Header Information */}
          <div className="absolute top-10 left-0 right-0 z-[30] px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-white/30 overflow-hidden ring-2 ring-brand/50 shadow-2xl">
                <img src={currentVendor?.vendor?.logo_url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="drop-shadow-md">
                <p className="text-white font-extrabold text-[14px] leading-tight flex items-center gap-1.5">
                  {currentVendor?.vendor?.store_name}
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  <span className="text-white/60 text-[11px] font-bold">
                    {currentStatus ? formatDistanceToNow(new Date(currentStatus.created_at), { addSuffix: true }) : ''}
                  </span>
                </p>
                <p className="text-white/50 text-[10px] font-bold tracking-widest uppercase mt-0.5">@{currentVendor?.vendor?.store_handle}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/10 transition-all border border-white/20"
            >
              <X size={20} />
            </button>
          </div>

          {/* Immersive Media Viewer */}
          <motion.div 
            className="flex-1 relative bg-neutral-950 flex items-center justify-center select-none touch-none"
            onPanEnd={(e, info) => {
              console.log('[StatusViewer] Pan End:', info.offset.y)
              if (isOwner && info.offset.y < -50) {
                setShowViewers(true)
              }
            }}
            onMouseDown={() => setPaused(true)}
            onMouseUp={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
          >
          {currentStatus?.media_type === 'video' ? (
            <video 
              key={currentStatus.id}
              src={currentStatus.media_url} 
              className="w-full h-full object-contain"
              autoPlay 
              playsInline
              onEnded={next}
              muted={false}
            />
          ) : (
            <img 
              key={currentStatus?.id}
              src={currentStatus?.media_url} 
              alt="" 
              className="w-full h-full object-contain animate-scale-in" 
            />
          )}

          <div className="absolute inset-0 z-10 flex">
            <div className="w-1/3 h-full cursor-w-resize" onClick={prev} />
            <div className="w-2/3 h-full cursor-e-resize" onClick={next} />
          </div>

          <button onClick={prev} className="hidden md:flex absolute top-1/2 -left-20 -translate-y-1/2 w-14 h-14 rounded-full bg-white/5 backdrop-blur-md items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all border border-white/5">
            <ChevronLeft size={28} />
          </button>
          <button onClick={next} className="hidden md:flex absolute top-1/2 -right-20 -translate-y-1/2 w-14 h-14 rounded-full bg-white/5 backdrop-blur-md items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all border border-white/5">
            <ChevronRight size={28} />
          </button>
          </motion.div>

        {/* Bottom Interaction & Caption */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pt-16 bg-gradient-to-t from-black via-black/60 to-transparent z-[25]">
          {currentStatus?.caption && (
            <div className="mb-6 bg-black/30 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl animate-slide-up">
              <p className="text-white text-[15px] leading-relaxed font-medium">
                {currentStatus.caption}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
             <form onSubmit={handleComment} className="flex-1 flex items-center gap-3 bg-white/10 backdrop-blur-xl rounded-2xl px-4 py-1.5 border border-white/10 ring-1 ring-white/5 shadow-2xl transition-all focus-within:ring-white/20">
               <input 
                 type="text" 
                 placeholder={`Reply to ${currentVendor?.vendor?.store_name}...`} 
                 className="flex-1 bg-transparent text-white text-[14px] font-medium outline-none placeholder:text-white/30 h-10"
                 value={commentText}
                 onChange={e => setCommentText(e.target.value)}
                 onFocus={() => setPaused(true)}
                 onBlur={() => setPaused(false)}
               />
               <button 
                 type="submit" 
                 disabled={!commentText.trim()}
                 className="w-10 h-10 rounded-xl flex items-center justify-center text-white/80 hover:text-brand hover:scale-110 active:scale-90 transition-all disabled:opacity-30"
               >
                 <Send size={18} />
               </button>
             </form>

             <button 
               onClick={handleLike}
               className={cn(
                 "w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 active:scale(0.8) relative overflow-hidden",
                 currentStatus?.liked 
                    ? "bg-brand text-white shadow-[0_0_20px_rgba(27,67,50,0.5)]" 
                    : "bg-white/10 backdrop-blur-xl border border-white/10 text-white/90 hover:bg-white/20"
               )}
             >
               <Heart 
                 size={22} 
                 fill={currentStatus?.liked ? "white" : "none"} 
                 className={cn("transition-transform", currentStatus?.liked && "animate-pulse")} 
               />
               <span className="text-[10px] font-black mt-0.5 opacity-80">{currentStatus?.like_count ?? 0}</span>
               {currentStatus?.liked && (
                 <div className="absolute inset-0 bg-white/10 animate-ping opacity-30" />
               )}
             </button>

             {/* OWNER STATS: Only visible to the vendor who posted this */}
             {isOwner && (
                <button 
                  onClick={() => setShowViewers(true)}
                  className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-brand/20 backdrop-blur-xl border border-brand/30 text-brand shadow-lg animate-scale-in group"
                >
                  <div className="relative group-hover:scale-110 transition-transform">
                    <Eye size={18} strokeWidth={2.5} />
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-brand animate-pulse" />
                  </div>
                  <span className="text-[10px] font-black mt-0.5 leading-none">{currentStatus?.view_count ?? 0}</span>
                </button>
             )}
          </div>
          
          {isOwner && (
             <div className="mt-4 flex flex-col items-center gap-1 opacity-50 animate-bounce">
                <div className="w-1 h-1 rounded-full bg-white" />
                <p className="text-[10px] font-bold text-white uppercase tracking-widest">Swipe up for viewers</p>
             </div>
          )}
        </div>

        {/* VIEWERS LIST (Swipe Up Drawer) */}
        <AnimatePresence>
          {showViewers && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-[50] bg-surface flex flex-col pt-6"
            >
              {/* Drawer Handle */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-border/40 rounded-full" onClick={() => setShowViewers(false)} />
              
              <div className="px-6 flex items-center justify-between mb-6">
                <div>
                   <h4 className="text-xl font-black text-primary flex items-center gap-2">
                     <Users size={20} className="text-brand" />
                     {currentStatus?.view_count ?? 0} Viewers
                   </h4>
                   <p className="text-xs text-muted font-bold uppercase tracking-wider mt-1">Status Analytics</p>
                </div>
                <button 
                  onClick={() => setShowViewers(false)}
                  className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-muted hover:text-primary transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
                {loadingViewers ? (
                  <div className="flex flex-col gap-4 py-4 px-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex items-center gap-4 animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-surface-2" />
                        <div className="flex-1 h-4 bg-surface-2 rounded-md" />
                      </div>
                    ))}
                  </div>
                ) : viewers.length > 0 ? (
                  <div className="space-y-2">
                    {viewers.map((v, i) => (
                      <div key={v.user.id + i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-surface-2 transition-colors border border-transparent hover:border-border">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full border border-border overflow-hidden bg-surface-3">
                             <img src={v.user.avatar_url} alt="" className="w-full h-full object-cover" />
                           </div>
                           <div>
                             <p className="text-[14px] font-extrabold text-primary line-clamp-1">{v.user.full_name}</p>
                             <div className="flex items-center gap-1.5 text-muted">
                                <Clock size={10} />
                                <span className="text-[10px] font-bold uppercase tracking-tight">Seen {formatDistanceToNow(new Date(v.viewed_at), { addSuffix: true })}</span>
                             </div>
                           </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center text-muted">
                          <Eye size={16} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <Users size={40} className="mb-4" />
                    <p className="font-bold text-sm">No views yet</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-border">
                <button 
                  onClick={() => setShowViewers(false)}
                  className="btn btn-primary btn-full py-4 text-sm font-black uppercase tracking-widest shadow-brand"
                >
                  Return to Story
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
