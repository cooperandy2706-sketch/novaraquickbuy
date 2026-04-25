'use client'
import { useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { RefreshCcw } from 'lucide-react'

export default function UpdateCheck() {
  const currentVersion = useRef(null)
  const checkInterval = useRef(null)

  const checkVersion = async () => {
    try {
      // Fetch version.json from the public folder with a timestamp to avoid caching
      const res = await fetch(`/version.json?t=${Date.now()}`)
      if (!res.ok) return
      
      const data = await res.json()
      const newVersion = data.version

      // On first load, just set the current version
      if (!currentVersion.current) {
        currentVersion.current = newVersion
        return
      }

      // If version changed, show the toast
      if (newVersion !== currentVersion.current) {
        currentVersion.current = newVersion // Prevent multiple toasts
        
        toast((t) => (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="font-bold text-sm">Novara has updated!</p>
              <p className="text-xs opacity-80">New features are available. Refresh to apply.</p>
            </div>
            <button
              onClick={() => {
                toast.dismiss(t.id)
                window.location.reload()
              }}
              className="bg-white text-brand px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-white/90 transition-all"
            >
              <RefreshCcw size={12} />
              Refresh
            </button>
          </div>
        ), {
          duration: Infinity, // Keep it visible until they refresh
          icon: '🚀',
          style: {
            background: '#1B4332',
            color: '#fff',
            borderRadius: '1.5rem',
            padding: '12px 16px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            maxWidth: '350px'
          }
        })
      }
    } catch (err) {
      console.error('Update check failed:', err)
    }
  }

  useEffect(() => {
    // Initial check on mount
    checkVersion()

    // Check every 5 minutes while the app is open
    checkInterval.current = setInterval(checkVersion, 5 * 60 * 1000)

    // Also check when the window becomes visible again (user returns to tab)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkVersion()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return null // This component doesn't render any UI itself
}
