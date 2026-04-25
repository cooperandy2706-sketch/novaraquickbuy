'use client'

import { Lock, Clock } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function ComingSoon({ title, desc, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-6 text-center animate-in fade-in duration-700">
      <div className="relative mb-10">
        <div className="w-28 h-28 rounded-[3rem] bg-brand/5 flex items-center justify-center text-5xl animate-pulse ring-1 ring-brand/10">
          {Icon ? <Icon size={48} className="text-brand/20" /> : '🚀'}
        </div>
        <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-brand text-white flex items-center justify-center shadow-2xl shadow-brand/40 ring-4 ring-white animate-in zoom-in duration-500 delay-200">
          <Lock size={22} strokeWidth={3} />
        </div>
      </div>
      
      <h2 className="text-3xl font-black text-brand-900 uppercase tracking-tighter mb-4">
        {title} <span className="text-brand block sm:inline">Coming Soon</span>
      </h2>
      
      <p className="text-[11px] text-neutral-400 font-black max-w-xs leading-relaxed mb-10 uppercase tracking-[0.2em] opacity-80">
        {desc || "We're building something amazing for you. Stay tuned for updates!"}
      </p>
      
      <div className="inline-flex items-center gap-3 px-6 py-3 bg-neutral-50 rounded-2xl text-[10px] font-black text-neutral-400 uppercase tracking-widest border border-neutral-100 shadow-sm">
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        Work in Progress
      </div>
    </div>
  )
}
