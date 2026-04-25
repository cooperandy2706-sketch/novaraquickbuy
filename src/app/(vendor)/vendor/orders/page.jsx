// FILE: src/app/(vendor)/vendor/orders/page.jsx
import { getOrders }   from '@/lib/actions/orders'
import OrdersClient    from './OrdersClient'

export const metadata = { title: 'Orders · Novara Vendor' }

export default async function OrdersPage({ searchParams }) {
  const params   = await searchParams
  const status   = params?.status   ?? ''
  const search   = params?.search   ?? ''
  const page     = Number(params?.page ?? 1)
  const dateFrom = params?.from ?? ''
  const dateTo   = params?.to   ?? ''

  const data = await getOrders({ status, search, page, dateFrom, dateTo })
  return <OrdersClient data={data} filters={{ status, search, page, dateFrom, dateTo }} />
}