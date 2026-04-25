// FILE: src/app/(admin)/admin/dashboard/page.jsx
import { redirect }           from 'next/navigation'
import {
  getAdminDashboardStats,
  getRevenueByCountry,
  getTopVendors,
  getHourlyTrend,
  getSubscriptionStats,
  getPlatformGrowth,
} from '@/lib/actions/adminDashboard'
import AdminDashboardClient from './AdminDashboardClient'

export const metadata = { title: 'Admin Dashboard · Novara' }
export const revalidate = 60

export default async function AdminDashboardPage() {
  const [stats, byCountry, topVendors, hourly, subStats, growth] = await Promise.all([
    getAdminDashboardStats(),
    getRevenueByCountry(),
    getTopVendors(),
    getHourlyTrend(),
    getSubscriptionStats(),
    getPlatformGrowth(),
  ])

  if (!stats) redirect('/login')

  return (
    <AdminDashboardClient
      stats={stats}
      byCountry={byCountry ?? []}
      topVendors={topVendors ?? []}
      hourly={hourly ?? []}
      subStats={subStats}
      growth={growth ?? []}
    />
  )
}