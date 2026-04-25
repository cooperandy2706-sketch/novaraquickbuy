// FILE: src/app/(vendor)/vendor/marketing/campaigns/new/page.jsx
import { redirect }            from 'next/navigation'
import { getSubscriptionStatus } from '@/lib/actions/campaigns'
import { getVendorProducts }   from '@/lib/actions/videos'
import { getCircles }          from '@/lib/actions/circles'
import { getVideos }           from '@/lib/actions/videos'
import CampaignForm            from '@/components/vendor/campaigns/CampaignForm'

export const metadata = { title: 'New Campaign · Novara Vendor' }

export default async function NewCampaignPage({ searchParams }) {
  const params = await searchParams
  const type   = params?.type ?? 'promo_code'

  const subscription = await getSubscriptionStatus()
  if (!subscription?.isActive) redirect('/vendor/marketing/subscribe')

  const [products, circles, videosData] = await Promise.all([
    getVendorProducts(),
    getCircles(),
    getVideos({ status: 'published', limit: 50 }),
  ])

  return (
    <CampaignForm
      mode="create"
      type={type}
      products={products}
      circles={circles ?? []}
      videos={videosData?.videos ?? []}
      subscription={subscription}
    />
  )
}