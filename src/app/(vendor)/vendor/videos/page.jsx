// FILE: src/app/(vendor)/vendor/videos/page.jsx
import { getVideos }   from '@/lib/actions/videos'
import VideosClient    from './VideosClient'
export const metadata = { title: 'Videos · Novara Vendor' }

export default async function VideosPage({ searchParams }) {
  const params = await searchParams
  const status = params?.status ?? ''
  const search = params?.search ?? ''
  const page   = Number(params?.page ?? 1)
  const data   = await getVideos({ status, search, page })
  return <VideosClient data={data} filters={{ status, search, page }} />
}