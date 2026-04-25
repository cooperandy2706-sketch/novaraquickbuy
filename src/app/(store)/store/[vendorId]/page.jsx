// FILE: src/app/(store)/store/[vendorId]/page.jsx
import { notFound }        from 'next/navigation'
import {
  getStoreByHandle,
  getStoreProducts,
  getStoreVideos,
  getStoreStats,
  getFollowStatus,
} from '@/lib/actions/store'
import StorePage from './StorePage'

export async function generateMetadata({ params }) {
  const { vendorId } = await params
  const vendor = await getStoreByHandle(vendorId)
  if (!vendor) return { title: 'Store Not Found' }
  return {
    title:       `${vendor.store_name} · Novara Quickbuy`,
    description: vendor.store_tagline ?? `Shop ${vendor.store_name} on Novara Quickbuy`,
    openGraph: {
      title:       vendor.store_name,
      description: vendor.store_tagline ?? '',
      images:      vendor.store_logo_url ? [vendor.store_logo_url] : [],
    },
  }
}

export default async function StorePageRoute({ params }) {
  const { vendorId } = await params
  const vendor = await getStoreByHandle(vendorId)
  if (!vendor) notFound()

  const [productsData, videos, stats, isFollowing] = await Promise.all([
    getStoreProducts(vendor.id),
    getStoreVideos(vendor.id),
    getStoreStats(vendor.id),
    getFollowStatus(vendor.id),
  ])

  return (
    <StorePage
      vendor={vendor}
      initialProducts={productsData.products}
      totalProducts={productsData.total}
      videos={videos}
      stats={stats}
      initialFollowing={isFollowing}
    />
  )
}