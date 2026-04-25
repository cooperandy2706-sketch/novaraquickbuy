'use client'
import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-surface flex flex-col items-center justify-center p-6 text-center">
      {/* Visual background element */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-[2rem] bg-brand/5 border border-brand/10 flex items-center justify-center text-5xl animate-bounce">
            🛍️
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-black text-brand tracking-tighter">404</h1>
          <h2 className="text-2xl font-bold text-primary">Page Not Found</h2>
          <p className="text-secondary text-sm leading-relaxed">
            Oops! It looks like this product or page has moved to a new circle. 
            Let's get you back to the feed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
          <Link 
            href="/feed" 
            className="w-full sm:flex-1 btn btn-primary py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
          >
            <Home size={18} />
            Back to Feed
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="w-full sm:flex-1 btn btn-secondary py-4 px-6 rounded-2xl flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>

        <p className="text-[10px] text-muted font-medium uppercase tracking-[0.2em] pt-8">
          Novara Quickbuy
        </p>
      </div>
    </div>
  )
}