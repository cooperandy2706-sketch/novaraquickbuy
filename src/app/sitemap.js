import { createClient } from '@supabase/supabase-js'

// IMPORTANT: Use service role or a public client with proper access
// For a sitemap, we only need public data.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function sitemap() {
  const baseUrl = 'https://novaraquickbuy.vercel.app'

  // 1. Static Routes
  const staticRoutes = [
    { url: `${baseUrl}`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 1 },
    { url: `${baseUrl}/explore`, lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${baseUrl}/feed`,    lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.8 },
  ]

  try {
    // 2. Fetch Products (latest 500)
    const { data: products } = await supabase
      .from('products')
      .select('id, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(500)

    const productRoutes = (products || []).map((p) => ({
      url: `${baseUrl}/product/${p.id}`,
      lastModified: new Date(p.updated_at || new Date()),
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

    // 3. Fetch Vendors (latest 100)
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, created_at')
      .eq('verification_status', 'verified')
      .limit(100)

    const vendorRoutes = (vendors || []).map((v) => ({
      url: `${baseUrl}/store/${v.id}`,
      lastModified: new Date(v.created_at || new Date()),
      changeFrequency: 'monthly',
      priority: 0.5,
    }))

    return [...staticRoutes, ...productRoutes, ...vendorRoutes]
  } catch (error) {
    console.error('Sitemap generation error:', error)
    return staticRoutes
  }
}
