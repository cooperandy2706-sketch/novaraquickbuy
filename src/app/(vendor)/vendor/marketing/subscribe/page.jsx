// FILE: src/app/(vendor)/vendor/marketing/subscribe/page.jsx
import { getSubscriptionStatus } from '@/lib/actions/campaigns'
import SubscribeClient           from './SubscribeClient'
export const metadata = { title: 'Upgrade to Pro · Novara Vendor' }

export default async function SubscribePage() {
  const subscription = await getSubscriptionStatus()
  return <SubscribeClient subscription={subscription} />
}