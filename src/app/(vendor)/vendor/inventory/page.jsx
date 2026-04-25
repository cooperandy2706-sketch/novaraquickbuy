// FILE: src/app/(vendor)/vendor/inventory/page.jsx
import { getInventory }   from '@/lib/actions/inventory'
import InventoryClient    from './InventoryClient'

export const metadata = { title: 'Inventory · Novara Vendor' }

export default async function InventoryPage({ searchParams }) {
  const params = await searchParams
  const filter = params?.filter ?? ''
  const search = params?.search ?? ''
  const page   = Number(params?.page ?? 1)

  const data = await getInventory({ filter, search, page })

  return <InventoryClient data={data} filters={{ filter, search, page }} />
}