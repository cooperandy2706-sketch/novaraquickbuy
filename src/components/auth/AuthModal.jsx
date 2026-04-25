'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { X, LockKeyhole } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'

export default function AuthModal() {
  const { authModalOpen, authModalMessage, closeAuthModal } = useUiStore()
  const pathname = usePathname()
  const router = useRouter()

  if (!authModalOpen) return null

  // Capture current path so the user can be redirected back after login
  const returnTo = pathname ? `?returnTo=${encodeURIComponent(pathname)}` : ''

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeAuthModal} 
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-sm bg-surface rounded-3xl shadow-2xl overflow-hidden animate-spring-up border border-border">
        
        {/* Close Button */}
        <button 
          onClick={closeAuthModal} 
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 text-muted hover:text-primary hover:bg-surface-3 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="p-8 flex flex-col items-center text-center">
          
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-5 rotate-3 shadow-inner">
            <LockKeyhole size={32} strokeWidth={2} className="-rotate-3" />
          </div>

          {/* Texts */}
          <h2 className="text-xl font-bold text-primary mb-2 tracking-tight">
            Authentication Required
          </h2>
          <p className="text-sm font-medium text-secondary mb-8 balance leading-relaxed">
            {authModalMessage || "Please sign in or create an account to continue."}
          </p>

          {/* Buttons */}
          <div className="w-full flex flex-col gap-3">
            <button 
              onClick={() => {
                closeAuthModal()
                router.push(`/login${returnTo}`)
              }} 
              className="w-full btn btn-primary flex items-center justify-center py-3.5 rounded-xl font-bold text-sm shadow-brand hover:scale-[1.02] transition-all"
            >
              Sign In
            </button>
            <button 
              onClick={() => {
                closeAuthModal()
                router.push(`/register${returnTo}`)
              }} 
              className="w-full btn bg-surface-2 text-primary border border-border flex items-center justify-center py-3.5 rounded-xl font-bold text-sm hover:bg-surface-3 hover:border-brand/40 hover:scale-[1.02] transition-all"
            >
              Create Account
            </button>
          </div>

          <p className="mt-6 text-[11px] text-muted font-medium">
            Join Novara to discover amazing products.
          </p>
        </div>
      </div>
    </div>
  )
}
