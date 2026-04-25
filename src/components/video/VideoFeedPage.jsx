'use client'
// FILE: src/components/video/VideoFeedPage.jsx

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Heart, MessageCircle, Share2, ShoppingCart,
  Bookmark, UserPlus, UserCheck, Volume2, VolumeX,
  X, ChevronUp, ChevronDown, BadgeCheck, Play, Flame, Plus,
  Eye, Tag, RefreshCw, Send, Trash2, AlertCircle,
  Copy, Check, Search, Clock, Facebook, Twitter, Link as LinkIcon,
} from 'lucide-react'
import { toggleCommentLike } from '@/lib/actions/feed'
import { formatCurrency } from '@/utils/formatCurrency'
import { useVideoFeed } from '@/hooks/useVideoFeed'
import { useVideoComments } from '@/hooks/useVideoComments'
import { useCart } from '@/hooks/useCart'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { useLocaleStore } from '@/store/localeStore'
import { useWishlistStore } from '@/store/wishlistStore'
import {
  toggleLike, toggleSave, toggleFollow,
  incrementView, incrementShare,
} from '@/lib/actions/feed'
import FeedSearch from '@/components/video/FeedSearch'
import FeedFilters from '@/components/video/FeedFilters'
import WishlistQuickAdd from '@/components/wishlist/WishlistQuickAdd'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'
import ShareDrawer from '@/components/ui/ShareDrawer'

// ── Helpers ───────────────────────────────────────────────────
const fmt = (n) => {
  const num = Number(n ?? 0)
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return String(num)
}

const fmtGHS = (v) => formatCurrency(v, 'GHS')

const timeAgo = (date) => {
  if (!date) return 'just now'
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

// ── Shared Components ──────────────────────────────────────────
const VerificationBadge = ({ vendor, size = 'sm' }) => {
  const status = vendor?.verification_status || (vendor?.verified ? 'verified' : 'unverified')
  if (status === 'verified') {
    return (
      <span className={cn(
        "flex items-center gap-1 bg-brand/90 backdrop-blur-sm text-white font-bold rounded-full shadow-lg",
        size === 'xs' ? "px-1.5 py-0.5 text-[8px]" : "px-2.5 py-1 text-[10px]"
      )}>
        <BadgeCheck size={size === 'xs' ? 8 : 12} /> VERIFIED
      </span>
    )
  }
  return null
}

const SaveIcon = ({ active, size = 24, className }) => (
  <Bookmark 
    size={size} 
    fill={active ? "white" : "none"} 
    strokeWidth={2.5}
    className={cn(
      "transition-all duration-500", 
      className, 
      active ? "text-white scale-110" : "text-white/90"
    )} 
  />
)

const ActionBtn = ({ icon, count, onClick, active, loading, activeColor }) => (
  <button 
    onClick={onClick} 
    disabled={loading}
    className="relative flex flex-col items-center group active:scale-90 transition-transform"
  >
    <div className={cn(
      'w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 backdrop-blur-sm border shadow-2xl',
      active 
        ? 'bg-white/20 text-white border-white/40 scale-105 shadow-xl shadow-white/5' 
        : 'bg-transparent text-white border-white/20 hover:bg-white/10'
    )}>
      {icon}
    </div>
    {count !== undefined && count !== '' && (
      <div className={cn(
        "absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[8px] font-black tracking-tighter shadow-xl border",
        active 
          ? (activeColor === 'red' ? "bg-red-500 text-white border-red-400" : "bg-white text-black border-white") 
          : "bg-white text-black border-white/20"
      )}>
        {count}
      </div>
    )}
  </button>
)

// ── Grid Card ──────────────────────────────────────────────────
function VideoGridCard({ video, liked, saved, onOpen }) {
  const videoRef = useRef(null)
  const [hovering, setHovering] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const product = video.video_tags?.[0]?.product
  const price = product?.discount_price || product?.price
  const isTrending = video.views > 1000

  const handleMouseEnter = () => {
    setHovering(true)
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => { })
    }
  }

  const handleMouseLeave = () => {
    setHovering(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  return (
    <div
      className="group relative rounded-[2.5rem] overflow-hidden cursor-pointer bg-neutral-950 transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:z-10 ring-1 ring-white/5"
      style={{ aspectRatio: '9/16' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onOpen(video)}
    >
      {video.thumbnail_url ? (
        <Image
          src={video.thumbnail_url}
          alt={video.title}
          fill
          className={cn(
            'object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1',
            hovering ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      ) : (
        <video
          src={`${video.video_url}#t=0.1`}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
            hovering ? 'opacity-0' : 'opacity-100'
          )}
          preload="metadata" muted playsInline
        />
      )}
      
      {!video.thumbnail_url && !hovering && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-2xl">
            <Play size={20} className="text-white ml-0.5" fill="currentColor" />
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        src={video.video_url}
        muted loop playsInline preload="none"
        onLoadedData={() => setLoaded(true)}
        className={cn(
          'absolute inset-0 w-full h-full object-cover transition-opacity duration-500',
          hovering && loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
        )}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-60" />

      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <VerificationBadge vendor={video.vendor} size="xs" />
        <div className="flex items-center gap-1.5">
          {isTrending && (
            <span className="flex items-center gap-1 bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full shadow-lg animate-pulse">
              <Flame size={8} fill="currentColor" /> TRENDING
            </span>
          )}
          <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md text-white text-[9px] font-black px-2 py-1 rounded-full border border-white/10">
            <Eye size={10} /> {fmt(video.views)}
          </span>
        </div>
      </div>

      <div className="absolute top-14 right-4 flex flex-col gap-2 scale-90 group-hover:scale-100 transition-transform">
        {liked && (
          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl animate-pop-in">
            <Heart size={14} fill="#EF4444" className="text-red-500" />
          </div>
        )}
        {saved && (
          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl animate-pop-in">
            <SaveIcon active={true} size={16} />
          </div>
        )}
      </div>

      {product && (
        <div className="absolute top-1/2 -translate-y-1/2 left-4 flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-[1.5rem] p-1 pr-4 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:-translate-y-1/2 border border-white/20 group-hover:scale-105 active:scale-95 z-20">
          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white shrink-0 border border-white/20">
            <img src={product.images?.[0]} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black text-white/90 truncate uppercase tracking-tight">{product.name}</span>
            <span className="text-xs font-black text-brand-300 drop-shadow-sm">{fmtGHS(price)}</span>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-10 transition-all duration-500 translate-y-1 group-hover:translate-y-0">
        <div className="flex items-center gap-2 mb-2 bg-black/10 backdrop-blur-sm rounded-full pr-3 w-fit">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand/20 border border-white/20 backdrop-blur-md overflow-hidden flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform">
            {video.vendor?.logo_url ? <img src={video.vendor.logo_url} alt="" className="w-full h-full object-cover" /> : video.vendor?.store_name?.charAt(0)}
          </div>
          <span className="text-white text-[10px] sm:text-xs font-black uppercase tracking-widest truncate drop-shadow-md max-w-[80px] sm:max-w-[120px]">{video.vendor?.store_name}</span>
        </div>
        <p className="text-white/95 text-xs sm:text-sm font-bold leading-snug line-clamp-2 mb-3 drop-shadow-md group-hover:text-white transition-colors">{video.title}</p>
        <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-white text-[9px] sm:text-[10px] font-black tracking-widest uppercase">
              <Heart size={10} className={cn("sm:w-3 sm:h-3", liked ? 'fill-red-500 text-red-500' : '')} /> {fmt(video.likes)}
            </span>
            <span className="flex items-center gap-1 text-white text-[9px] sm:text-[10px] font-black tracking-widest uppercase">
              <MessageCircle size={10} className="sm:w-3 sm:h-3" /> {fmt(video.comments_count)}
            </span>
          </div>
          {(video.video_tags?.length ?? 0) > 0 && (
            <div className="flex items-center gap-1 bg-brand/30 backdrop-blur-md border border-brand/40 px-2 py-0.5 rounded-lg text-brand-200 text-[8px] sm:text-[9px] font-black uppercase tracking-tighter shadow-lg">
              <ShoppingCart size={9} className="sm:w-2.5 sm:h-2.5" />
              <span className="hidden xs:inline">SHOP</span> {video.video_tags.length}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Fullscreen Player ──────────────────────────────────────────
function FullscreenPlayer({ videos, startIndex, feedState, onClose, onLike, onSave, onFollow }) {
  const [activeIdx, setActiveIdx] = useState(startIndex)
  const [muted, setMuted] = useState(true)
  const [showCart, setShowCart] = useState(null)
  const [showComments, setShowComments] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [showShare, setShowShare] = useState(null)
  const [showHeartBurst, setShowHeartBurst] = useState(false)

  const containerRef = useRef(null)
  const videoRefs = useRef({})
  const lastTapRef = useRef(0)

  const { add, hasItem } = useCart()
  const { toggle, isWishlisted } = useWishlistStore()
  const { user } = useAuthStore()
  const openAuthModal = useUiStore(s => s.openAuthModal)

  const video = videos[activeIdx]
  const product = video?.video_tags?.[0]?.product

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // ── Scroll to Start Index ──
  useEffect(() => {
    if (containerRef.current && startIndex !== undefined) {
      const target = containerRef.current.querySelector(`[data-index="${startIndex}"]`)
      if (target) {
        target.scrollIntoView({ behavior: 'auto' })
      }
    }
  }, [startIndex])

  // ── Track Active Video via IntersectionObserver ──
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index'), 10)
            setActiveIdx(index)
          }
        })
      },
      { 
        threshold: 0.6,
        root: containerRef.current
      }
    )

    const container = containerRef.current
    if (container) {
      const children = container.querySelectorAll('[data-index]')
      children.forEach((child) => observer.observe(child))
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([idx, ref]) => {
      if (!ref) return
      const currentVideo = videos[activeIdx]
      if (Number(idx) === activeIdx) {
        ref.play().catch(() => { })
        if (currentVideo?.id) incrementView(currentVideo.id)
      } else {
        ref.pause()
        ref.currentTime = 0
      }
    })
  }, [activeIdx, videos])

  const handleDoubleTap = (e) => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      if (!feedState.liked[video.id]) handleLike()
      setShowHeartBurst(true)
      setTimeout(() => setShowHeartBurst(false), 800)
    } else {
      setMuted(m => !m)
    }
    lastTapRef.current = now
  }

  const handleLike = async () => {
    if (!user) { openAuthModal('Sign in to show some love'); return }
    if (likeLoading) return
    setLikeLoading(true)
    onLike(video.id)
    await toggleLike(video.id)
    setLikeLoading(false)
  }

  const handleSave = async () => {
    if (!user) { openAuthModal('Sign in to save this video'); return }
    if (saveLoading) return
    setSaveLoading(true)
    onSave(video.id)
    await toggleSave(video.id)
    setSaveLoading(false)
  }

  const handleFollow = async () => {
    if (!user) { openAuthModal(`Sign in to follow ${video.vendor?.store_name}`); return }
    setFollowLoading(true)
    onFollow(video.vendor_id)
    await toggleFollow(video.vendor_id)
    setFollowLoading(false)
  }

  const handleShare = async () => {
    incrementShare(video.id)
    const url = `${window.location.origin}/store/${video.vendor?.store_handle || video.vendor_id}`
    setShowShare({ url, title: video.title })
  }

  const handleAddToCart = (p) => {
    add(p)
    toast.success(`${p.name} added to cart!`)
    setShowCart(null)
  }

  const handleWishlist = (p) => {
    toggle(p)
    toast.success(isWishlisted(p.id) ? 'Removed from wishlist' : 'Saved to wishlist')
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col md:flex-row overflow-hidden font-sans animate-in fade-in duration-500">
      {/* Universal Close Button */}
      <div className="absolute top-6 left-6 z-50">
        <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-black/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 shadow-2xl active:scale-90 transition-transform"><X size={24} strokeWidth={2.5} /></button>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-neutral-950 overflow-hidden">
        <div className="relative w-full h-full md:w-auto md:aspect-[9/16] bg-black md:rounded-[3.5rem] md:my-8 md:border-[10px] md:border-neutral-900 overflow-hidden md:shadow-[0_0_120px_rgba(0,0,0,1)] ring-1 ring-white/5">
          <div ref={containerRef} className="w-full h-full feed-container">
            {videos.map((v, idx) => {
              const vProduct = v.video_tags?.[0]?.product
              const vPrice = vProduct?.discount_price || vProduct?.price
              const vLiked = feedState.liked[v.id]
              const vFollowed = feedState.followed[v.vendor_id]
              const wishlistProductPayload = vProduct || { id: v.id, name: v.title, price: 0, currency: 'GHS', image_url: v.thumbnail_url, vendor_id: v.vendor_id, vendor_name: v.vendor?.store_name }

              return (
                <div key={v.id} data-index={idx} className="relative w-full flex-shrink-0" style={{ height: '100dvh', scrollSnapAlign: 'start' }}>
                  <video ref={el => videoRefs.current[idx] = el} src={v.video_url} muted={muted} loop playsInline preload={Math.abs(idx - activeIdx) <= 1 ? 'auto' : 'none'} onClick={handleDoubleTap} className="absolute inset-0 w-full h-full object-cover" />
                  
                  <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/80 via-black/20 to-transparent pointer-events-none" />
                  <div className="absolute top-8 left-20 z-20 scale-110">
                    <VerificationBadge vendor={v.vendor} />
                  </div>
                  <button 
                    onClick={() => setMuted(m => !m)} 
                    className="absolute top-8 right-6 w-11 h-11 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 active:scale-90 z-20 transition-all"
                  >
                    {muted ? <VolumeX size={18} strokeWidth={2.5} /> : <Volume2 size={18} strokeWidth={2.5} />}
                  </button>

                  <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />
                  
                  {idx === activeIdx && showHeartBurst && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                      <div className="animate-heart-burst"><Heart size={120} fill="#EF4444" className="text-red-500" /></div>
                    </div>
                  )}

                  {/* Action Sidebar */}
                  <div className="absolute right-4 bottom-32 flex flex-col items-center gap-5 z-20">
                    <Link href={`/store/${v.vendor?.store_handle || v.vendor_id}`} className="relative mb-2">
                      <div className="w-11 h-11 rounded-xl ring-2 ring-brand bg-neutral-900 border border-white/20 overflow-hidden flex items-center justify-center font-black text-brand transition-transform hover:scale-110 active:scale-95 shadow-2xl">
                        {v.vendor?.logo_url ? <img src={v.vendor.logo_url} alt="" className="w-full h-full object-cover" /> : v.vendor?.store_name?.charAt(0)}
                      </div>
                    </Link>
                    
                    <ActionBtn 
                      icon={<Heart size={22} strokeWidth={2.5} fill={vLiked ? '#EF4444' : 'none'} className={vLiked ? 'text-red-500' : 'text-white'} />} 
                      count={fmt(v.likes)} 
                      onClick={handleLike} 
                      active={vLiked}
                      activeColor="red"
                    />
                    
                    <ActionBtn 
                      icon={<MessageCircle size={22} strokeWidth={2.5} />} 
                      count={fmt(v.comments_count)} 
                      onClick={() => { setActiveIdx(idx); setShowComments(true) }} 
                    />
                    
                    <WishlistQuickAdd 
                      product={wishlistProductPayload} 
                      popoverClassName="right-14 bottom-0" 
                      customTrigger={({ onClick, alreadyAdded }) => (
                        <ActionBtn 
                          icon={<SaveIcon active={alreadyAdded} size={24} />} 
                          count={alreadyAdded ? 'YES' : ''} 
                          onClick={onClick} 
                          active={alreadyAdded} 
                        />
                      )} 
                    />
                    
                    <ActionBtn 
                      icon={<Share2 size={20} strokeWidth={2.5} />} 
                      onClick={handleShare} 
                    />
                  </div>

                  {/* Stretched Info Overlay */}
                  <div className="absolute bottom-8 left-4 right-4 z-10 pointer-events-none">
                    <div className="pointer-events-auto">
                      <div className="flex items-center gap-3 mb-2">
                         <p className="font-black text-white text-base tracking-tight uppercase drop-shadow-lg">@{v.vendor?.store_name}</p>
                         <button 
                           onClick={handleFollow} 
                           className={cn(
                             "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                             vFollowed ? "bg-white/20 text-white border border-white/30" : "bg-white text-black shadow-xl"
                           )}
                         >
                           {vFollowed ? 'Following' : 'Follow'}
                         </button>
                      </div>
                      <p className="text-white/95 text-base font-medium leading-snug line-clamp-2 mb-6 drop-shadow-xl pr-16">{v.title}</p>
                      
                      {vProduct && vProduct.stock_quantity > 0 && (
                        <button 
                          onClick={() => setShowCart(vProduct)} 
                          className={cn(
                            "flex items-center gap-3 p-1.5 rounded-[1.8rem] bg-black/40 backdrop-blur-3xl border border-white/20 text-white shadow-2xl active:scale-95 hover:bg-white/10 transition-all",
                            "w-full sm:w-fit overflow-hidden"
                          )}
                        >
                          <div className="w-12 h-12 rounded-2xl bg-white overflow-hidden shrink-0 border border-white/10">
                            <img src={vProduct.images?.[0]} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col items-start min-w-0 flex-1">
                            <span className="text-[9px] font-black uppercase text-white/50 tracking-wider">Featured Product</span>
                            <span className="text-sm font-black truncate">{vProduct.name}</span>
                          </div>
                          <div className="flex items-center gap-3 pl-4 border-l border-white/10 shrink-0 pr-2">
                            <span className="text-base font-black text-white">{fmtGHS(vPrice)}</span>
                            <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                              <ShoppingCart size={18} strokeWidth={3} />
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Desktop Sidebar (Comments & Info) */}
        <div className="hidden lg:flex w-[420px] bg-neutral-950 border-l border-white/5 flex-col z-20 overflow-hidden">
          {video && (
            <div className="flex-1 flex flex-col h-full animate-in slide-in-from-right duration-500">
              <div className="p-10 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                <h2 className="text-2xl font-black text-white mb-3 tracking-tight uppercase leading-tight">{video.title}</h2>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-brand bg-brand/10 border border-brand/20 px-3 py-1 rounded-lg uppercase tracking-widest">{video.category || 'Collection'}</span>
                  <span className="text-xs font-bold text-white/40 tracking-wider uppercase">{fmt(video.views)} VIEWS</span>
                </div>
              </div>
              <div className="flex-1 overflow-hidden bg-white rounded-t-[3.5rem] mt-6 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                <CommentsSheet videoId={video.id} commentCount={video.comments_count} onClose={() => {}} hideCloseOnDesktop />
              </div>
            </div>
          )}
        </div>
      </div>

      {showCart && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md px-0 sm:px-4" onClick={e => e.target === e.currentTarget && setShowCart(null)}>
          <div className="bg-white w-full sm:max-w-md sm:rounded-[3rem] rounded-t-[3rem] shadow-2xl overflow-hidden max-h-[80dvh] flex flex-col">
            <CartSheet product={showCart} onClose={() => setShowCart(null)} onAddToCart={() => handleAddToCart(showCart)} onWishlist={() => handleWishlist(showCart)} isWishlisted={isWishlisted(showCart.id)} inCart={hasItem(showCart.id)} />
          </div>
        </div>
      )}

      {showComments && video && (
        <div className="lg:hidden fixed inset-0 z-[110] flex items-end bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={e => e.target === e.currentTarget && setShowComments(false)}>
          <div className="bg-white w-full rounded-t-[3rem] h-[75dvh] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-500">
            <CommentsSheet videoId={video.id} commentCount={video.comments_count} onClose={() => setShowComments(false)} />
          </div>
        </div>
      )}

      {showShare && (
        <ShareDrawer isOpen={true} onClose={() => setShowShare(null)} url={showShare.url} title={showShare.title} />
      )}
    </div>
  )
}

function CommentsSheet({ videoId, commentCount, onClose, hideCloseOnDesktop = false }) {
  const { comments, loading, posting, submit, remove, loadMore, hasMore } = useVideoComments(videoId)
  const [content, setContent] = useState('')
  const { user } = useAuthStore()
  const openAuthModal = useUiStore(s => s.openAuthModal)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) { openAuthModal('Sign in to join the conversation'); return }
    if (!content.trim() || posting) return
    const res = await submit(content)
    if (res.success) setContent('')
  }

  return (
    <div className="p-8 h-full flex flex-col bg-white">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <h3 className="text-xl font-black uppercase tracking-tight">Comments ({commentCount})</h3>
        {!hideCloseOnDesktop && (
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-black transition-colors"><X size={28} /></button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-8 pb-8 scrollbar-none">
        {loading && comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-14 h-14 rounded-full bg-neutral-100 mb-4" />
            <p className="text-[10px] text-neutral-400 font-black uppercase tracking-[0.2em]">Loading...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-[2.5rem] bg-neutral-50 flex items-center justify-center text-neutral-200 mb-6 border border-neutral-100 shadow-inner">
              <MessageCircle size={40} strokeWidth={1.5} />
            </div>
            <p className="text-xs text-neutral-400 font-black uppercase tracking-[0.1em] leading-relaxed">No comments yet.<br/><span className="text-[9px] font-bold opacity-60">Be the first to share your thoughts!</span></p>
          </div>
        ) : (
          <>
            {comments.map(c => (
              <div key={c.id} className="flex gap-5 group">
                <div className="w-12 h-12 rounded-[1.25rem] bg-neutral-100 overflow-hidden shrink-0 border border-neutral-100 shadow-sm transition-transform group-hover:scale-105">
                  {c.user?.avatar_url ? <img src={c.user.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-brand/10 text-brand font-black text-base">{c.user?.full_name?.charAt(0)}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-xs font-black uppercase tracking-tight text-neutral-900">{c.user?.full_name}</span>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed break-words">{c.content}</p>
                  <div className="flex items-center gap-6 mt-3">
                    <button className="flex items-center gap-1.5 text-[9px] font-black text-neutral-400 uppercase tracking-[0.1em] hover:text-rose-500 transition-colors group/like"><Heart size={12} className="group-hover/like:fill-rose-500" /> {fmt(c.likes || 0)}</button>
                    <button className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.1em] hover:text-brand transition-colors">Reply</button>
                    {user?.id === c.user?.id && (
                      <button onClick={() => remove(c.id)} className="text-[9px] font-black text-rose-500 uppercase tracking-[0.1em] opacity-0 group-hover:opacity-100 transition-opacity ml-auto">Delete</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {hasMore && (
              <button onClick={loadMore} className="w-full py-6 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 hover:text-black hover:bg-neutral-50 rounded-2xl transition-all">Load more comments</button>
            )}
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-auto pt-6 border-t border-neutral-100 shrink-0">
        <div className="relative group">
          <input 
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Add a comment..."
            className="w-full pl-8 pr-16 py-5 bg-neutral-50 rounded-[2rem] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand/5 border border-neutral-100 focus:border-brand/20 transition-all placeholder:text-neutral-400 shadow-inner"
          />
          <button 
            type="submit" 
            disabled={!content.trim() || posting}
            className="absolute right-2.5 top-2.5 w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-20 transition-all"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  )
}

function CartSheet({ product, onClose, onAddToCart, onWishlist, isWishlisted, inCart }) {
  return (
    <div className="p-10 flex flex-col gap-8">
      <div className="flex gap-8">
        <div className="w-28 h-28 rounded-[2.5rem] bg-neutral-100 overflow-hidden shrink-0 border border-neutral-100 shadow-sm">
          <img src={product.images?.[0]} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col justify-center">
          <h4 className="text-xl font-black uppercase tracking-tight mb-2 leading-tight">{product.name}</h4>
          <p className="text-3xl font-black text-brand mb-3 tracking-tighter">{fmtGHS(product.discount_price || product.price)}</p>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-neutral-100 flex items-center justify-center">
              <Tag size={12} className="text-neutral-400" />
            </div>
            <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">{product.vendor_name}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <button onClick={onAddToCart} className="w-full py-5 bg-brand text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all">
          {inCart ? 'Already in Cart' : 'Add to Cart'}
        </button>
        <button onClick={onWishlist} className="w-full py-5 bg-neutral-50 text-neutral-900 border border-neutral-100 rounded-3xl font-black uppercase tracking-widest hover:bg-neutral-100 active:scale-95 transition-all">
          {isWishlisted ? 'Saved' : 'Save to Wishlist'}
        </button>
        <button onClick={onClose} className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 hover:text-black transition-colors">Close</button>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function VideoFeedPage() {
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('latest')
  const [onlyVerified, setOnlyVerified] = useState(false)
  const [openVideo, setOpenVideo] = useState(null)
  const sentinelRef = useRef(null)

  const { country, detectedCountry, setCountry, detectLocation } = useLocaleStore()

  useEffect(() => {
    detectLocation()
  }, [detectLocation])

  const {
    videos, loading, hasMore, error,
    liked, saved, followed,
    loadMore, refresh,
    optimisticLike, optimisticSave, optimisticFollow,
  } = useVideoFeed(category === 'all' ? null : category, country)

  const { isWishlisted } = useWishlistStore()

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return
    const observer = new IntersectionObserver(entries => { if (entries[0].isIntersecting) loadMore() }, { threshold: 0.1 })
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  const displayVideos = [...videos]
    .filter(v => !onlyVerified || v.vendor?.verified)
    .sort((a, b) => {
      if (sort === 'trending') return (b.views ?? 0) - (a.views ?? 0)
      return new Date(b.created_at) - new Date(a.created_at)
    })

  const activeFiltersCount = (category !== 'all' ? 1 : 0) + (sort !== 'latest' ? 1 : 0) + (onlyVerified ? 1 : 0) + (country !== 'all' ? 1 : 0)
  const feedState = { liked, saved, followed }

  if (loading && videos.length === 0) return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-neutral-50 p-6 flex flex-col gap-4">
        <div className="skeleton h-12 w-full max-w-md rounded-2xl" />
        <div className="flex gap-3 overflow-hidden">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-10 w-24 rounded-full shrink-0" />)}</div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-6">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="skeleton rounded-[2.5rem] aspect-[9/16]" />)}</div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      {/* ── Scrollable Search Header ── */}
      <div className="bg-white border-b border-neutral-50">
        <div className="max-w-[1800px] mx-auto px-6 py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1 max-w-xl">
            <FeedSearch onSearch={() => { setCategory('all'); setSort('latest') }} />
          </div>
          <div className="flex items-center gap-4">
            {/* Country Toggle */}
            <div className="flex items-center bg-neutral-50 p-1 rounded-2xl border border-neutral-100">
              <button
                onClick={() => setCountry('all')}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  country === 'all' ? "bg-white text-primary shadow-sm" : "text-neutral-400 hover:text-neutral-600"
                )}
              >
                Global
              </button>
              <button
                onClick={() => setCountry(detectedCountry || 'Ghana')}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  country !== 'all' ? "bg-white text-primary shadow-sm" : "text-neutral-400 hover:text-neutral-600"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                {detectedCountry || 'My Country'}
              </button>
            </div>

            <div className="h-6 w-px bg-neutral-100 mx-2 hidden lg:block" />

            <button
              onClick={() => setOnlyVerified(!onlyVerified)}
              className={cn(
                "px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300",
                onlyVerified
                  ? "bg-brand text-white border-brand shadow-[0_8px_20px_rgba(27,67,50,0.2)]"
                  : "bg-neutral-50 text-neutral-400 border-neutral-100 hover:bg-neutral-100"
              )}
            >
              <BadgeCheck size={14} className="inline mr-1.5" /> Verified Only
            </button>
          </div>
        </div>
      </div>

      {/* ── Sticky Filters ── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-neutral-100 shadow-sm transition-all duration-500">
        <div className="max-w-[1800px] mx-auto">
          <FeedFilters
            category={category}
            onCategoryChange={setCategory}
            sort={sort}
            onSortChange={setSort}
            onlyVerified={onlyVerified}
            onVerifiedToggle={() => setOnlyVerified(!onlyVerified)}
            activeFiltersCount={activeFiltersCount}
            onClearFilters={() => { setCategory('all'); setSort('latest'); setOnlyVerified(false); setCountry('all') }}
          />
        </div>
      </div>

      <main className="max-w-[1800px] mx-auto p-6">
        {displayVideos.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-40 animate-in zoom-in duration-500">
            <div className="w-24 h-24 rounded-[2.5rem] bg-neutral-50 flex items-center justify-center text-neutral-200 mb-6 border border-neutral-100 shadow-inner"><Play size={40} strokeWidth={1} /></div>
            <h2 className="text-2xl font-black text-neutral-900 uppercase tracking-tighter mb-2">No videos found</h2>
            <button onClick={() => { setCategory('all'); setSort('latest'); setOnlyVerified(false); setCountry('all') }} className="mt-8 px-10 py-4 bg-neutral-900 text-white rounded-3xl font-black uppercase tracking-widest active:scale-95 transition-all">Reset Feed</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-6">
            {displayVideos.map(video => <VideoGridCard key={video.id} video={video} liked={liked[video.id]} saved={saved[video.id]} onOpen={setOpenVideo} />)}
          </div>
        )}
        <div ref={sentinelRef} className="h-20 flex items-center justify-center mt-12">{hasMore && <div className="flex gap-2"><div className="w-2 h-2 rounded-full bg-brand animate-bounce [animation-delay:-0.3s]" /><div className="w-2 h-2 rounded-full bg-brand animate-bounce [animation-delay:-0.15s]" /><div className="w-2 h-2 rounded-full bg-brand animate-bounce" /></div>}</div>
      </main>

      {openVideo && <FullscreenPlayer videos={displayVideos} startIndex={displayVideos.findIndex(v => v.id === openVideo.id)} feedState={feedState} onClose={() => setOpenVideo(null)} onLike={optimisticLike} onSave={optimisticSave} onFollow={optimisticFollow} />}
    </div>
  )
}