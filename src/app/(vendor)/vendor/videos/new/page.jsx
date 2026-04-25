// FILE: src/app/(vendor)/vendor/videos/new/page.jsx
import { getVendorProducts } from '@/lib/actions/videos'
import VideoForm             from '@/components/vendor/videos/VideoForm'
import { createClient }      from '@/lib/supabase/server'

export const metadata = { title: 'New Video · Novara Vendor' }

export default async function NewVideoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: vendor }   = await supabase.from('vendors').select('id').eq('user_id', user?.id).single()
  const products = await getVendorProducts()
  return <VideoForm products={products} vendorId={vendor?.id} />
}