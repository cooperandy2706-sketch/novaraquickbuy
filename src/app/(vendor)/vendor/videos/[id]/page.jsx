// FILE: src/app/(vendor)/vendor/videos/[id]/page.jsx
import { notFound }            from 'next/navigation'
import { getVideo, getVendorProducts } from '@/lib/actions/videos'
import { createClient }        from '@/lib/supabase/server'
import VideoEditClient         from './VideoEditClient'

export const metadata = { title: 'Edit Video · Novara Vendor' }

export default async function EditVideoPage({ params }) {
  const { id }   = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: vendor }   = await supabase
    .from('vendors').select('id').eq('user_id', user?.id).single()

  const [video, products] = await Promise.all([
    getVideo(id),
    getVendorProducts(),
  ])
  if (!video) notFound()

  return <VideoEditClient video={video} products={products} vendorId={vendor?.id} />
}