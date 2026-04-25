// FILE: src/app/(vendor)/vendor/dashboard/page.jsx
import { getDashboardStats } from '@/lib/actions/dashboard'
import DashboardClient       from './DashboardClient'

export const metadata = { title: 'Dashboard · Novara Vendor' }

// Revalidate every 60 seconds so stats stay fresh without full SSR cost
export const revalidate = 60

export default async function DashboardPage() {
  const data = await getDashboardStats()
  return <DashboardClient data={data} />
}