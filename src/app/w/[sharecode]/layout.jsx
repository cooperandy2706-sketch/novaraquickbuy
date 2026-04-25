import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({ params }) {
  const { sharecode } = await params
  const supabase = await createClient()

  const { data: list } = await supabase
    .from('wishlist_lists')
    .select('name, emoji, share_code, list_type')
    .eq('share_code', sharecode)
    .single()

  if (!list) return { title: 'Wishlist not found' }

  const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/w/${list.share_code}`

  return {
    title: `${list.emoji || '🎁'} ${list.name} | Novara Wishlist`,
    description: `Check out my ${list.name} on QuickBuy! Some amazing items are waiting for you to see.`,
    openGraph: {
      title: `${list.emoji || '🎁'} ${list.name}`,
      description: `Check out items from ${list.name} on QuickBuy.`,
      url,
      siteName: 'Novara QuickBuy',
      images: [
        {
          url: `/w/${list.share_code}/opengraph-image`,
          width: 1200,
          height: 630,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${list.emoji || '🎁'} ${list.name}`,
      description: `Check out items from ${list.name} on QuickBuy.`,
      images: [`/w/${list.share_code}/opengraph-image`],
    },
  }
}

export default function WishlistLayout({ children }) {
  return children
}
