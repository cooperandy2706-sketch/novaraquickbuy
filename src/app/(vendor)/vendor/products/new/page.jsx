// FILE: src/app/(vendor)/vendor/products/new/page.jsx
import { getProduct }  from '@/lib/actions/products'
import ProductForm     from '@/components/vendor/products/ProductForm'

export const metadata = { title: 'New Product · Novara Vendor' }

export default async function NewProductPage({ searchParams }) {
  // Support duplication — prefill form from existing product
  const params      = await searchParams
  const duplicateId = params?.duplicate ?? null
  const source      = duplicateId ? await getProduct(duplicateId) : null

  const prefill = source ? {
    ...source,
    id:     undefined,
    name:   `${source.name} (Copy)`,
    status: 'draft',
    sku:    '',
    slug:   '',
  } : null

  return <ProductForm product={prefill} />
}