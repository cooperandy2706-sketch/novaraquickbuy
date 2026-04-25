// FILE: src/app/(vendor)/vendor/products/page.jsx
import { getProducts } from '@/lib/actions/products'
import ProductsClient  from './ProductsClient'

export const metadata = { title: 'Products · Novara Vendor' }

export default async function ProductsPage({ searchParams }) {
  const params   = await searchParams
  const search   = params?.search   ?? ''
  const status   = params?.status   ?? ''
  const category = params?.category ?? ''
  const type     = params?.type     ?? ''
  const page     = Number(params?.page ?? 1)

  const data = await getProducts({ search, status, category, type, page })

  return <ProductsClient data={data} filters={{ search, status, category, type, page }} />
}