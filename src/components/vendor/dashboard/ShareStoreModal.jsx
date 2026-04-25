'use client'
// FILE: src/components/vendor/dashboard/ShareStoreModal.jsx

import { useState } from 'react'
import Link     from 'next/link'
import { 
  X, Share2, Copy, Check, 
  Instagram, MessageCircle, Send,
  Download, ExternalLink, QrCode
} from 'lucide-react'
import { cn } from '@/utils/cn'

export default function ShareStoreModal({ isOpen, onClose, vendor, products = [] }) {
  const [copied, setCopied] = useState(false)
  
  if (!isOpen) return null

  const storeName   = vendor?.store_name ?? 'My Store'
  const storeHandle = vendor?.store_handle ?? 'store'
  const storeUrl    = `${window.location.origin}/store/${storeHandle}`
  
  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(storeUrl)
        .then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
        .catch(err => {
          console.error('Clipboard copy failed', err)
          fallbackCopy()
        })
    } else {
      fallbackCopy()
    }
  }

  const fallbackCopy = () => {
    const textArea = document.createElement("textarea")
    textArea.value = storeUrl
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Fallback copy failed', err)
    }
    document.body.removeChild(textArea)
  }

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Check out my store ${storeName} on Novara! 🛍️\n\n${storeUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const shareInstagram = () => {
    handleCopy() // Copy link first
    window.open('https://www.instagram.com/', '_blank')
  }

  const shareTikTok = () => {
    handleCopy() // Copy link first
    window.open('https://www.tiktok.com/', '_blank')
  }

  const handleSaveCard = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: storeName,
          text: `Shop from ${storeName} on Novara QuickBuy!`,
          url: storeUrl,
        })
      } catch (err) {
        console.log('Share failed:', err)
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh] sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="font-black text-neutral-900 text-sm uppercase tracking-widest flex items-center gap-2">
            <Share2 size={16} className="text-brand" />
            Share Your Store
          </h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-none">
          
          {/* THE SHARE CARD PREVIEW */}
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand to-violet-500 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-neutral-900 rounded-[2rem] p-6 text-white overflow-hidden aspect-[4/5] flex flex-col justify-between">
              {/* Card BG Accents */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/30 blur-[40px] -mr-16 -mt-16 rounded-full" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/20 blur-[30px] -ml-12 -mb-12 rounded-full" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 p-0.5 overflow-hidden">
                    {vendor?.store_logo_url ? (
                      <img src={vendor.store_logo_url} alt={storeName} className="w-full h-full object-cover rounded-[0.9rem]" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-brand font-black text-lg">
                        {storeName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-lg leading-none">{storeName}</h4>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">@ {storeHandle}</p>
                  </div>
                </div>
              </div>

              {/* Product Grid inside card */}
              <div className="relative z-10 grid grid-cols-2 gap-2 my-4">
                {products.slice(0, 4).map((p, i) => (
                  <div key={i} className="aspect-square rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                    {p.product?.thumbnail_url ? (
                      <img src={p.product.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/5" />
                    )}
                  </div>
                ))}
                {products.length < 4 && Array(4 - products.length).fill(0).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square rounded-2xl bg-white/5 border border-white/10" />
                ))}
              </div>

              <div className="relative z-10 flex items-end justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-400">Shop now on</p>
                  <p className="text-xl font-black tracking-tighter">Novara QuickBuy</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl p-1 shadow-xl">
                  <QrCode size={40} className="text-neutral-900" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Share Buttons */}
          <div className="grid grid-cols-4 gap-4">
            {/* WhatsApp */}
            <button 
              onClick={shareWhatsApp}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-[#25D366]/20">
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-neutral-900">WhatsApp</span>
            </button>

            {/* Instagram */}
            <button 
              onClick={shareInstagram}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-[#ee2a7b]/20">
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-none stroke-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-neutral-900">Instagram</span>
            </button>

            {/* TikTok */}
            <button 
              onClick={shareTikTok}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-black/20 overflow-hidden">
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.09-1.47-.13-.08-.26-.17-.38-.26v5.39c0 2.56-.8 5.11-2.73 6.81-2.09 1.83-5.26 2.21-7.75 1.1-2.92-1.31-4.75-4.48-4.43-7.65.21-2.22 1.4-4.29 3.29-5.46 1.48-.92 3.32-1.32 5.04-.96v4.01c-1.15-.31-2.45-.06-3.37.66-.86.66-1.31 1.76-1.25 2.85.02 1.12.61 2.19 1.58 2.74 1.11.64 2.61.57 3.59-.28.66-.58.98-1.45.98-2.32V0l.005.02z"/>
                </svg>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-neutral-900">TikTok</span>
            </button>

            {/* Download */}
            <button 
              onClick={handleSaveCard}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-neutral-900/20">
                <Download size={22} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-neutral-900">Save Card</span>
            </button>
          </div>

          {/* Copy Link Input */}
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Copy Store Link</p>
            <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-2xl border border-neutral-100">
              <input 
                type="text" 
                readOnly 
                value={storeUrl}
                className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-bold text-neutral-600 px-2"
              />
              <button 
                onClick={handleCopy}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  copied ? "bg-emerald-500 text-white" : "bg-neutral-900 text-white hover:bg-neutral-800"
                )}
              >
                {copied ? <Check size={14} /> : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-neutral-50 border-t border-neutral-100">
           <Link 
            href={`/store/${storeHandle}`}
            target="_blank"
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-brand text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:bg-brand-600 transition-all active:scale-[0.98]"
           >
             View Live Store <ExternalLink size={14} strokeWidth={3} />
           </Link>
        </div>
      </div>
    </div>
  )
}
