// FILE: src/app/(vendor)/vendor/circles/[id]/page.jsx
import { notFound }          from 'next/navigation'
import { getCircle, getCircleMessages } from '@/lib/actions/circles'
import CircleRoomClient      from './CircleRoomClient'
export const metadata = { title: 'Circle · Novara Vendor' }

export default async function CirclePage({ params }) {
  const { id }   = await params
  const [result, messages] = await Promise.all([
    getCircle(id),
    getCircleMessages(id, 0, 50),
  ])
  if (!result) notFound()
  return (
    <CircleRoomClient
      circle={result.circle}
      vendor={result.vendor}
      initialMessages={messages}
    />
  )
}