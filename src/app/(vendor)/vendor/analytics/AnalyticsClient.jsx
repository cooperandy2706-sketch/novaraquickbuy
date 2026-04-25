'use client'
// FILE: src/app/(vendor)/vendor/analytics/AnalyticsClient.jsx

import { useTransition }          from 'react'
import { useRouter }              from 'next/navigation'
import { useAuth }                from '@/hooks/useAuth'
import { useRealtimeAnalytics }   from '@/hooks/useRealtimeAnalytics'
import AnalyticsRangeFilter   from '@/components/vendor/analytics/AnalyticsRangeFilter'
import AnalyticsOverviewCards from '@/components/vendor/analytics/AnalyticsOverviewCards'
import AnalyticsCharts        from '@/components/vendor/analytics/AnalyticsCharts'
import TopProductsTable       from '@/components/vendor/analytics/TopProductsTable'
import TopVideosTable         from '@/components/vendor/analytics/TopVideosTable'
import RatingsReviews         from '@/components/vendor/analytics/RatingsReviews'
import FollowersPanel         from '@/components/vendor/analytics/FollowersPanel'

export default function AnalyticsClient({ data, range: initRange, from: initFrom, to: initTo }) {
  const router                       = useRouter()
  const { profile }                  = useAuth()
  const [isPending, startTransition] = useTransition()

  const vendorId = profile?.vendor?.id ?? data?.vendor?.id ?? null

  // Live-patch revenue, orders, and messages — everything else is historical
  const liveOverview = useRealtimeAnalytics(data?.overview, vendorId)

  const loading = isPending || !data

  const handleRangeChange = ({ range, from, to }) => {
    startTransition(() => {
      const params = new URLSearchParams()
      params.set('range', range)
      if (from) params.set('from', from)
      if (to)   params.set('to',   to)
      router.push(`/vendor/analytics?${params.toString()}`)
    })
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-900 tracking-tighter uppercase">Insights</h1>
          <p className="text-[10px] text-neutral-400 font-black uppercase tracking-[0.2em] mt-2 opacity-80">
            Real-time performance metrics & growth analytics
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-neutral-50 rounded-2xl border border-neutral-100">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Live Updates Active</span>
        </div>
      </div>

      {/* Range filter + CSV export */}
      <AnalyticsRangeFilter
        range={initRange}
        from={initFrom}
        to={initTo}
        onRangeChange={handleRangeChange}
        loading={loading}
      />

      {/* KPI cards — revenue, orders, messages update live */}
      <AnalyticsOverviewCards overview={liveOverview} loading={loading} />

      {/* Charts — historical, refresh on range change */}
      <AnalyticsCharts
        revenueSeries={data?.revenueSeries}
        viewsSeries={data?.viewsSeries}
        followerSeries={data?.followerSeries}
        statusCounts={data?.statusCounts}
        loading={loading}
      />

      {/* Followers + ratings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <FollowersPanel
          overview={liveOverview}
          followerSeries={data?.followerSeries}
          loading={loading}
        />
        <RatingsReviews
          avgRating={data?.overview?.avgRating}
          totalReviews={data?.overview?.totalReviews}
          ratingDist={data?.ratingDist}
          reviews={data?.reviews}
          loading={loading}
        />
      </div>

      {/* Top products */}
      <TopProductsTable products={data?.topProducts} loading={loading} />

      {/* Top videos */}
      <TopVideosTable videos={data?.topVideos} loading={loading} />

    </div>
  )
}