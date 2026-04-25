// FILE: src/app/(vendor)/vendor/analytics/page.jsx
import { getAnalytics }   from '@/lib/actions/analytics'
import AnalyticsClient    from './AnalyticsClient'

export const metadata = { title: 'Analytics · Novara Vendor' }
export const revalidate = 120

export default async function AnalyticsPage({ searchParams }) {
  const params = await searchParams
  const range = params?.range ?? '30d'
  const from  = params?.from  ?? null
  const to    = params?.to    ?? null

  const data  = await getAnalytics({ range, from, to })

  return <AnalyticsClient data={data} range={range} from={from} to={to} />
}