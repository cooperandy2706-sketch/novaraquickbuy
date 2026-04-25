// FILE: src/app/(vendor)/vendor/orders/[id]/page.jsx
import { notFound }  from 'next/navigation'
import { getOrder }  from '@/lib/actions/orders'
import OrderDetail   from './OrderDetail'

export const metadata = { title: 'Order Detail · Novara Vendor' }

export default async function OrderDetailPage({ params }) {
  const { id } = await params
  const result = await getOrder(id)
  if (!result) notFound()
  return <OrderDetail initialOrder={result.order} vendor={result.vendor} />
}