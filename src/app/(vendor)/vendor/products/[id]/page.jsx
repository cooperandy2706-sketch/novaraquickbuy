// FILE: src/app/(vendor)/vendor/products/[id]/page.jsx
import { notFound }  from 'next/navigation'
import { getProduct } from '@/lib/actions/products'
import ProductForm    from '@/components/vendor/products/ProductForm'

export const metadata = { title: 'Edit Product · Novara Vendor' }

export default async function EditProductPage({ params }) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()

  return <ProductForm product={product} />
}