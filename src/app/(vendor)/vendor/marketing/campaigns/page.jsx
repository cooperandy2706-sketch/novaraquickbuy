// FILE: src/app/(vendor)/vendor/marketing/campaigns/page.jsx
import { getCampaigns, getSubscriptionStatus } from '@/lib/actions/campaigns'
import CampaignsClient from './CampaignsClient'
export const metadata = { title: 'Campaigns · Novara Vendor' }

export default async function CampaignsPage() {
  const [campaigns, subscription] = await Promise.all([
    getCampaigns(),
    getSubscriptionStatus(),
  ])
  return <CampaignsClient campaigns={campaigns} subscription={subscription} />
}