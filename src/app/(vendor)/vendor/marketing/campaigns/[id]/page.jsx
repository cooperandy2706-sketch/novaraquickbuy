// FILE: src/app/(vendor)/vendor/marketing/campaigns/[id]/page.jsx
import { notFound }            from 'next/navigation'
import { getCampaign, getSubscriptionStatus } from '@/lib/actions/campaigns'
import { getVendorProducts }   from '@/lib/actions/videos'
import { getCircles }          from '@/lib/actions/circles'
import { getVideos }           from '@/lib/actions/videos'
import CampaignForm            from '@/components/vendor/campaigns/CampaignForm'

export const metadata = { title: 'Edit Campaign · Novara Vendor' }

export default async function EditCampaignPage({ params }) {
  const { id } = await params

  const [campaign, subscription, products, circles, videosData] = await Promise.all([
    getCampaign(id),
    getSubscriptionStatus(),
    getVendorProducts(),
    getCircles(),
    getVideos({ status: 'published', limit: 50 }),
  ])

  if (!campaign) notFound()

  return (
    <CampaignForm
      mode="edit"
      campaign={campaign}
      type={campaign.type}
      products={products}
      circles={circles ?? []}
      videos={videosData?.videos ?? []}
      subscription={subscription}
    />
  )
}