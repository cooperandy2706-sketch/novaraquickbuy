// FILE: src/app/(vendor)/vendor/circles/page.jsx
import { getCircles }   from '@/lib/actions/circles'
import CirclesClient    from './CirclesClient'
export const metadata = { title: 'Circles · Novara Vendor' }
export default async function CirclesPage() {
  const circles = await getCircles()
  return <CirclesClient initialCircles={circles ?? []} />
}