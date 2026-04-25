'use client'
// FILE: src/components/ui/ShareDrawer.jsx

import { useEffect, useState } from 'react'
import { 
  X, Link as LinkIcon, Check, 
  Instagram, Twitter, Facebook, 
  Send, MessageCircle, Share2
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { copyToClipboard } from '@/utils/clipboard'

const SOCIALS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: '#25D366',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    )
  },
  {
    id: 'instagram',
    label: 'Instagram',
    color: '#E4405F',
    icon: Instagram
  },
  {
    id: 'x',
    label: 'X (Twitter)',
    color: '#000000',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    )
  },
  {
    id: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    icon: Facebook
  },
  {
    id: 'telegram',
    label: 'Telegram',
    color: '#0088cc',
    icon: Send
  },
  {
    id: 'more',
    label: 'More',
    color: '#6366f1',
    icon: Share2
  }
]

export default function ShareDrawer({ isOpen, onClose, url, title }) {
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeStatement, setActiveStatement] = useState('')

  const excitement = [
    `OMG! You have to see what ${title} just dropped on Novara QuickBuy! 🔥`,
    `Found my new favorite shop: ${title}! Check out their latest collection now. ✨`,
    `Shopping at ${title} is a whole vibe. Grab the best deals on Novara QuickBuy! 🛍️`,
    `Stop everything! ${title} has the hottest items right now. Browse here:`,
    `Quality & Style = ${title}. Check out their storefront on Novara:`,
    `Just found some gems at ${title}! You won't believe these prices: 💎`
  ]

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      setActiveStatement(excitement[Math.floor(Math.random() * excitement.length)])
    }
  }, [isOpen])

  if (!mounted) return null

  const handleCopy = async () => {
    const success = await copyToClipboard(url)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async (id) => {
    const shareData = {
      title: `${title} | Novara QuickBuy`,
      text: activeStatement,
      url: url.split('#')[0].split('?')[0]
    }

    // Handle Native Share (The "More" Button)
    if ((id === 'more' || id === 'native') && navigator.share) {
      try {
        await navigator.share(shareData)
        onClose()
        return
      } catch (err) {
        console.warn('Native share failed', err)
      }
    }

    const fullMessage = `${shareData.text} ${shareData.url}`
    const encodedFullMessage = encodeURIComponent(fullMessage)
    const encodedText = encodeURIComponent(shareData.text)
    const encodedUrl  = encodeURIComponent(shareData.url)

    let shareUrl = ''

    switch (id) {
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodedFullMessage}`
        break
      case 'instagram':
        await handleCopy()
        return
      case 'x':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
        break
      default:
        if (navigator.share) {
          try { await navigator.share(shareData); onClose(); return } catch(e) {}
        }
        await handleCopy()
        return
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          'fixed inset-0 z-[110] bg-black/60 backdrop-blur-[2px] transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[120] bg-white rounded-t-[3rem] transition-transform duration-500 transform ease-out shadow-2xl flex flex-col',
          isOpen ? 'translate-y-0' : 'translate-y-full',
          'max-h-[55vh]' // Half screen height
        )}
      >
        {/* Handle */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-neutral-100 rounded-full shrink-0" />

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto px-8 pt-10 pb-12 custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-brand-900 uppercase tracking-tight">Share Store</h3>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1 opacity-80">Invite others to browse</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-brand-900 transition-colors">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Share Preview */}
        <div className="mb-8 p-4 bg-brand/5 rounded-3xl border border-brand/10">
          <p className="text-[8px] font-black text-brand-400 uppercase tracking-widest mb-2">Message Preview</p>
          <p className="text-xs font-bold text-brand-900 leading-relaxed italic">
            "{activeStatement} {url}"
          </p>
        </div>

        {/* Social Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-10">
          {SOCIALS.map(s => {
            const Icon = s.icon
            return (
              <button 
                key={s.id}
                onClick={() => handleShare(s.id)}
                className="flex flex-col items-center gap-3 group animate-in zoom-in duration-300"
              >
                <div 
                  className="w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-white shadow-lg transition-all group-hover:scale-110 active:scale-95"
                  style={{ backgroundColor: s.color }}
                >
                  <Icon size={24} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{s.label}</span>
              </button>
            )
          })}
        </div>

        {/* Copy Link Section */}
        <div className="relative group">
          <div className="flex items-center gap-4 p-5 bg-neutral-50 rounded-[2rem] border border-neutral-100 transition-all hover:border-brand/20">
            <div className="w-10 h-10 rounded-xl bg-white border border-neutral-100 flex items-center justify-center text-neutral-400">
              <LinkIcon size={18} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest leading-none mb-1">Store Link</p>
              <p className="text-sm font-bold text-neutral-700 truncate">{url}</p>
            </div>
            <button 
              onClick={handleCopy}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                copied 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                  : "bg-brand text-white shadow-lg shadow-brand/20 hover:bg-brand-600"
              )}
            >
              {copied ? (
                <span className="flex items-center gap-2"><Check size={14} strokeWidth={4} /> Copied</span>
              ) : 'Copy'}
            </button>
          </div>
          </div>
        </div>
      </div>
    </>
  )
}
