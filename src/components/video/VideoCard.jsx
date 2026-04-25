// FILE: src/components/video/VideoCard.jsx
'use client'

import { useState, useRef, useEffect } from 'react'
import Link                             from 'next/link'
import Image                            from 'next/image'
import { Heart, MessageCircle, Share2, ShoppingCart, Volume2, VolumeX, BadgeCheck } from 'lucide-react'
import { useVideoFeed }   from '@/hooks/useVideoFeed'
import { useCart }        from '@/hooks/useCart'
import { useUiStore }     from '@/store/uiStore'
import ProductTag         from './ProductTag'
import { cn }             from '@/utils/cn'
import toast              from 'react-hot-toast'

export default function VideoCard({ video, isActive }) {
  const [liked,   setLiked]   = useState(false)
  const [muted,   setMuted]   = useState(true)
  const [playing, setPlaying] = useState(false)
  const [showTags, setShowTags] = useState(true)
  const videoRef  = useRef(null)
  const { likeVideo }          = useVideoFeed()
  const { add, count }         = useCart()
  const { openProductModal }   = useUiStore()

  // Auto-play when active
  useEffect(() => {
    if (!videoRef.current) return
    if (isActive) {
      videoRef.current.play().catch(() => {})
      setPlaying(true)
    } else {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setPlaying(false)
    }
  }, [isActive])

  const handleLike = () => {
    setLiked(!liked)
    if (!liked) likeVideo(video.id)
  }

  const handleShare = async () => {
    const url = `${location.origin}/product/${video.video_tags?.[0]?.product?.id ?? ''}`
    if (navigator.share) {
      await navigator.share({ title: video.title, url })
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied!')
    }
  }

  const handleAddToCart = (product) => {
    add(product)
    toast.success(`${product.name} added to cart`)
  }

  const likeCount = (video.likes + (liked && !video._liked ? 1 : 0))

  return (
    <div className="video-card w-full h-full relative bg-brand-900 select-none">

      {/* Video element */}
      <video
        ref={videoRef}
        src={video.video_url}
        poster={video.thumbnail_url}
        loop
        muted={muted}
        playsInline
        preload="metadata"
        onClick={() => setMuted(!muted)}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* Mute indicator */}
      <button
        onClick={() => setMuted(!muted)}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 hover:bg-black/60"
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      {/* Product tags — floating over video */}
      {showTags && video.video_tags?.map(tag => (
        <ProductTag
          key={tag.id}
          tag={tag}
          onTap={() => openProductModal(tag.product)}
        />
      ))}

      {/* Right action bar */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">

        {/* Vendor avatar */}
        <Link href={`/store/${video.vendor_id}`} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full ring-2 ring-brand bg-brand/10 border border-brand/20 flex items-center justify-center font-black text-brand text-sm overflow-hidden shadow-xl">
            {video.vendor?.logo_url
              ? <img src={video.vendor.logo_url} alt="" className="w-full h-full object-cover" />
              : video.vendor?.store_name?.charAt(0)
            }
          </div>
          <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center -mt-3.5 ring-2 ring-black shadow-lg">
            <span className="text-white text-xs font-black">+</span>
          </div>
        </Link>

        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
          <div className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 border border-white/10 shadow-lg',
            liked
              ? 'bg-red-500 scale-110 shadow-red-500/20 border-red-400'
              : 'bg-white/15 backdrop-blur-md group-hover:bg-white/25'
          )}>
            <Heart size={22} fill={liked ? 'white' : 'none'} className={liked ? 'text-white' : 'text-white/90'} />
          </div>
          <span className="text-white text-[10px] font-black uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-sm">
            {likeCount > 999 ? `${(likeCount/1000).toFixed(1)}k` : likeCount}
          </span>
        </button>

        {/* Comment */}
        <button className="flex flex-col items-center gap-1 group">
          <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center group-hover:bg-white/25 transition-all border border-white/10 shadow-lg">
            <MessageCircle size={22} className="text-white/90" />
          </div>
          <span className="text-white text-[10px] font-black uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-sm">{video.comments_count ?? 0}</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1 group">
          <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center group-hover:bg-white/25 transition-all border border-white/10 shadow-lg">
            <Share2 size={22} className="text-white/90" />
          </div>
          <span className="text-white text-[10px] font-black uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-sm">Share</span>
        </button>

        {/* Add to cart — quick add first product */}
        {video.video_tags?.[0]?.product && (
          <button
            onClick={() => handleAddToCart(video.video_tags[0].product)}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-11 h-11 rounded-full bg-brand flex items-center justify-center shadow-brand group-hover:bg-brand-600 group-active:scale-95 transition-all duration-150">
              <ShoppingCart size={20} className="text-white" />
            </div>
            <span className="text-white text-xs font-medium">Cart</span>
          </button>
        )}
      </div>

      {/* Bottom vendor info */}
      <div className="absolute bottom-6 left-3 right-20 text-white">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="font-bold text-sm">@{video.vendor?.store_name}</span>
          {video.vendor?.verified && (
            <BadgeCheck size={14} className="text-brand-300" />
          )}
        </div>
        <p className="text-sm text-white/80 leading-snug line-clamp-2">
          {video.title}
        </p>
        {/* Product count pill */}
        {video.video_tags?.length > 0 && (
          <button
            onClick={() => setShowTags(!showTags)}
            className="mt-2 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-white hover:bg-white/30 transition-all"
          >
            <ShoppingCart size={11} />
            {video.video_tags.length} product{video.video_tags.length > 1 ? 's' : ''}
          </button>
        )}
      </div>
    </div>
  )
}