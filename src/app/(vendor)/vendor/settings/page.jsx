// FILE: src/app/(vendor)/vendor/settings/page.jsx
import { getVendorSettings }     from '@/lib/actions/settings'
import { getSubscriptionStatus } from '@/lib/actions/campaigns'
import SettingsClient            from './SettingsClient'
export const metadata = { title: 'Settings · Novara Vendor' }

export default async function SettingsPage() {
  const [settings, subscription] = await Promise.all([
    getVendorSettings(),
    getSubscriptionStatus(),
  ])
  return <SettingsClient settings={settings} subscription={subscription} />
}