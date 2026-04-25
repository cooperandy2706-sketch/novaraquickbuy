'use client'
// FILE: src/app/(vendor)/vendor/dashboard/DashboardClient.jsx

import { useState }    from 'react'
import { useRouter }   from 'next/navigation'
import { 
  BadgeCheck, Zap, Plus, MessageSquare, 
  TrendingUp, Sparkles, Share2
} from 'lucide-react'
import { useAuth }    from '@/hooks/useAuth'
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard'
import StatCard       from '@/components/vendor/dashboard/StatCard'
import RecentOrders   from '@/components/vendor/dashboard/RecentOrders'
import TopProducts    from '@/components/vendor/dashboard/TopProducts'
import QuickActions   from '@/components/vendor/dashboard/QuickActions'
import RevenueChart   from '@/components/vendor/dashboard/RevenueChart'
import StockAlerts    from '@/components/vendor/dashboard/StockAlerts'
import VerificationBanner from '@/components/vendor/dashboard/VerificationBanner'
import ShareStoreModal from '@/components/vendor/dashboard/ShareStoreModal'

export default function DashboardClient({ data: initialData }) {
  const router      = useRouter()
  const { profile } = useAuth()
  const [shareModalOpen, setShareModalOpen] = useState(false)

  // ── Realtime Sync ────────────────────────────────────────────────────────
  const authVendor  = profile?.vendor
  const vendorId    = authVendor?.id ?? initialData?.vendor?.id ?? null
  const data        = useRealtimeDashboard(initialData, vendorId)

  const stats       = data?.stats  ?? {}
  const vendor      = data?.vendor ?? {}
  const loading     = !data
  const storeName   = vendor?.store_name   ?? 'Your Store'
  const storeHandle = vendor?.store_handle ?? 'store'

  const hour = new Date().getHours()
  const baseGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Contextual CTAs to make the greeting feel alive
  const ctas = [
    "uploading any video today?",
    "ready to crush some sales?",
    "let's grow your brand.",
    "any new products for the feed?",
    "check your latest performance.",
    "your customers are waiting.",
    "time to optimize your store.",
    "ready for a high-volume day?",
    "let's ship some magic today."
  ]

  // Use a stable random selection based on the day or just pick one
  // For now, let's pick based on a simple hash of the hour/date to keep it semi-dynamic but stable per session
  const greeting = `${baseGreeting}, ${ctas[(hour + new Date().getDate()) % ctas.length]}`

  return (
    <div className="space-y-6 pb-20">

      {/* Premium Store Header */}
      <div className="relative overflow-hidden rounded-[3rem] bg-neutral-900 text-white p-8 sm:p-12 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] group transition-all duration-700 hover:shadow-brand/20">
        {/* Background Accents - Animated */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/20 blur-[120px] -mr-64 -mt-64 rounded-full transition-all group-hover:bg-brand/30 duration-1000 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600/10 blur-[100px] -ml-40 -mb-40 rounded-full animate-bounce-slow" />
        
        {/* Glass Overlay */}
        <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-[1px]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2.5rem] overflow-hidden border-4 border-white/10 bg-neutral-800 shadow-2xl transition-all group-hover:scale-105 group-hover:rotate-3 duration-500 ring-8 ring-white/5">
                {vendor.store_logo_url ? (
                  <img src={vendor.store_logo_url} alt={storeName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand to-brand-600 text-white font-black text-4xl">
                    {storeName.charAt(0)}
                  </div>
                )}
              </div>
              {vendor.verified && (
                <div className="absolute -bottom-2 -right-2 bg-brand text-white p-2 rounded-2xl shadow-2xl border-4 border-neutral-900 animate-in zoom-in duration-500 delay-500">
                  <BadgeCheck size={20} fill="currentColor" className="text-white" />
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <p className="text-brand-400 text-xs sm:text-[10px] font-black uppercase tracking-[0.3em] animate-in slide-in-from-left duration-700">
                    {greeting}
                  </p>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tighter leading-none uppercase italic group-hover:tracking-tight transition-all duration-700">
                  {storeName}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <p className="text-white/60 text-xs font-black tracking-widest uppercase italic">
                    @{storeHandle}
                  </p>
                </div>
                {!loading && stats.pendingOrders > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] border border-amber-500/20 shadow-lg shadow-amber-500/10">
                    <Zap size={12} fill="currentColor" className="animate-pulse" /> {stats.pendingOrders} Active Orders
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={() => setShareModalOpen(true)}
              className="flex-1 sm:flex-none px-8 py-5 rounded-[1.5rem] bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 border border-white/10 backdrop-blur-xl flex items-center justify-center gap-3 group/btn"
            >
              <Share2 size={18} className="group-hover/btn:rotate-12 transition-transform" /> Share Store
            </button>
            <button 
              onClick={() => router.push('/vendor/products/new')}
              className="flex-1 sm:flex-none px-10 py-5 rounded-[1.5rem] bg-brand hover:bg-brand-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(var(--brand-rgb),0.5)] transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <Plus size={18} strokeWidth={4} /> Add Product
            </button>
          </div>
        </div>
      </div>

      {/* Share Store Modal */}
      <ShareStoreModal 
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        vendor={vendor}
        products={data?.topProducts ?? []}
      />

      {/* Verification banner */}
      {!loading && <VerificationBanner vendor={vendor} />}

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            label="Revenue"
            value={loading ? '—' : (stats.revenueThis ?? 0)}
            isCurrency
            icon={TrendingUp}
            iconBg="bg-brand text-white"
            accent="border-l-brand"
            badge={stats.revenueGrowth 
              ? { label: `${stats.revenueGrowth}% vs last mo`, color: parseFloat(stats.revenueGrowth) >= 0 ? 'text-emerald-500' : 'text-danger' }
              : null
            }
            loading={loading}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            label="Orders"
            value={loading ? '—' : (stats.totalOrders ?? 0).toString()}
            icon={Zap}
            iconBg="bg-amber-500 text-white"
            accent="border-l-amber-500"
            badge={stats.pendingOrders > 0 
              ? { label: `${stats.pendingOrders} pending`, color: 'text-amber-500 bg-amber-500/10 border border-amber-500/20' }
              : null
            }
            onClick={() => router.push('/vendor/orders')}
            loading={loading}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            label="Products"
            value={loading ? '—' : (stats.totalProducts ?? 0).toString()}
            icon={Plus}
            iconBg="bg-violet-500 text-white"
            accent="border-l-violet-500"
            badge={stats.lowStockCount > 0
              ? { label: `${stats.lowStockCount} low stock`, color: 'text-danger bg-danger/10 border border-danger/20' }
              : null
            }
            onClick={() => router.push('/vendor/products')}
            loading={loading}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            label="Visibility"
            value={loading ? '—' : (stats.unreadMessages ?? 0).toString()}
            icon={MessageSquare}
            iconBg="bg-pink-500 text-white"
            accent="border-l-pink-500"
            badge={stats.videoViews > 0
              ? { label: `${stats.videoViews.toLocaleString()} views`, color: 'text-brand bg-brand/10 border border-brand/20' }
              : null
            }
            onClick={() => router.push('/vendor/chat')}
            loading={loading}
          />
        </div>
      </div>

      {/* Quick actions */}
      <QuickActions />

      {/* Revenue chart + stock alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2rem] border border-border shadow-sm p-6 overflow-hidden">
            <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-6 flex items-center gap-2">
              <TrendingUp size={14} className="text-brand" /> Revenue Insights
            </h3>
            <RevenueChart data={data?.chartData} loading={loading} />
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <StockAlerts
            lowStock={stats.lowStockCount}
            outOfStock={stats.outOfStockCount}
            loading={loading}
          />
          <div className="bg-brand/10 rounded-[2rem] p-6 border border-brand/20 relative overflow-hidden group">
            <Sparkles className="absolute -right-4 -bottom-4 w-24 h-24 text-brand/10 group-hover:scale-125 transition-transform duration-500" />
            <h4 className="font-black text-brand text-sm uppercase tracking-widest relative z-10">Novara Creator</h4>
            <p className="text-xs text-brand-700 mt-2 font-medium relative z-10 leading-relaxed">
              Start posting shoppable videos to increase your store visibility by up to 300%.
            </p>
            <button className="mt-4 text-[10px] font-black uppercase tracking-wider bg-brand text-white px-4 py-2 rounded-xl shadow-lg shadow-brand/20 hover:bg-brand-600 transition-colors relative z-10">
              Post Video
            </button>
          </div>
        </div>
      </div>

      {/* Recent orders + top products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2rem] border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border bg-neutral-50/50 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900">Recent Orders</h3>
            <button onClick={() => router.push('/vendor/orders')} className="text-[10px] font-black uppercase tracking-wider text-brand">View All</button>
          </div>
          <RecentOrders orders={data?.recentOrders} loading={loading} />
        </div>

        <div className="bg-white rounded-[2rem] border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border bg-neutral-50/50 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900">Best Selling</h3>
            <button onClick={() => router.push('/vendor/analytics')} className="text-[10px] font-black uppercase tracking-wider text-brand">Insights</button>
          </div>
          <TopProducts  products={data?.topProducts} loading={loading} />
        </div>
      </div>
    </div>
  )
}