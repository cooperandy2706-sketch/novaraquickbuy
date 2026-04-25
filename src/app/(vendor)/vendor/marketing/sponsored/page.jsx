// FILE: src/app/(vendor)/vendor/marketing/sponsored/page.jsx
import { redirect }             from 'next/navigation'
import {
  getSponsoredVideos,
  getSubscriptionStatus,
} from '@/lib/actions/campaigns'
import { getVideos }            from '@/lib/actions/videos'
import SponsoredClient          from './SponsoredClient'

export const metadata = { title: 'Sponsored Videos · Novara Vendor' }

export default async function SponsoredPage() {
  const [subscription, sponsored, videosData] = await Promise.all([
    getSubscriptionStatus(),
    getSponsoredVideos(),
    getVideos({ status: 'published', limit: 50 }),
  ])

  return (
    <SponsoredClient
      subscription={subscription}
      sponsored={sponsored}
      videos={videosData?.videos ?? []}
    />
  )
}