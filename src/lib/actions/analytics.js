'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Helper: date range from preset ──────────────────────────────────────────
function getRange(range, from, to) {
  const now = new Date()
  if (range === 'custom' && from && to) {
    return { start: new Date(from).toISOString(), end: new Date(to).toISOString() }
  }
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30
  const start = new Date(now - days * 24 * 60 * 60 * 1000).toISOString()
  return { start, end: now.toISOString() }
}

function getPrevRange(range, from, to) {
  const now = new Date()
  if (range === 'custom' && from && to) {
    const diff = new Date(to) - new Date(from)
    return {
      start: new Date(new Date(from) - diff).toISOString(),
      end:   new Date(from).toISOString(),
    }
  }
  const days  = range === '7d' ? 7 : range === '90d' ? 90 : 30
  const end   = new Date(now - days * 24 * 60 * 60 * 1000).toISOString()
  const start = new Date(now - days * 2 * 24 * 60 * 60 * 1000).toISOString()
  return { start, end }
}

function buildDailySeries(rows, dateField, valueField, { start, end }) {
  const days  = []
  const s     = new Date(start)
  const e     = new Date(end)
  const diff  = Math.round((e - s) / (1000 * 60 * 60 * 24))
  const count = Math.min(diff, 90)

  for (let i = 0; i < count; i++) {
    const d   = new Date(s)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    const val = rows
      .filter(r => r[dateField]?.slice(0, 10) === key)
      .reduce((sum, r) => sum + (Number(r[valueField]) || 1), 0)
    days.push({
      date:  key,
      label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      value: val,
    })
  }
  return days
}

function pct(curr, prev) {
  if (!prev || prev === 0) return null
  return +(((curr - prev) / prev) * 100).toFixed(1)
}

// ─── MAIN: getAnalytics ────────────────────────────────────────────────────────
export async function getAnalytics({ range = '30d', from, to } = {}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, store_name, store_handle, verification_status, verified, created_at')
    .eq('user_id', user.id)
    .single()
  if (!vendor) return null

  const vid  = vendor.id
  const curr = getRange(range, from, to)
  const prev = getPrevRange(range, from, to)

  const [
    { data: ordersNow },
    { data: ordersPrev },
    { data: allOrders },
    { count: totalProducts },
    { data: topProducts },
    { data: videosNow },
    { data: allVideos },
    // FIX: store_followers → vendor_follows
    { count: followersNow },
    { count: followersPrev },
    { data: followerGrowth },
    { data: reviews },
    // FIX: store_views → video_views (closest match in schema)
    { data: storeViews },
    // FIX: messages → dm_messages (vendor receives DMs via dm_threads)
    { count: totalMessages },
    // circle_members is correct — kept as-is
    { count: circleMembers },
  ] = await Promise.all([
    supabase.from('orders')
      .select('id, total_amount, created_at, status')
      .eq('vendor_id', vid)
      .gte('created_at', curr.start)
      .lte('created_at', curr.end)
      .neq('status', 'cancelled'),

    supabase.from('orders')
      .select('id, total_amount, status')
      .eq('vendor_id', vid)
      .gte('created_at', prev.start)
      .lte('created_at', prev.end)
      .neq('status', 'cancelled'),

    supabase.from('orders')
      .select('id, status, total_amount, created_at')
      .eq('vendor_id', vid)
      .gte('created_at', curr.start)
      .lte('created_at', curr.end),

    supabase.from('products')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vid),

    supabase.from('order_items')
      .select('quantity, total_price, product:products(id, name, thumbnail_url, price, stock_quantity, category)')
      .eq('vendor_id', vid)
      .gte('created_at', curr.start)
      .lte('created_at', curr.end)
      .order('total_price', { ascending: false })
      .limit(10),

    supabase.from('product_videos')
      .select('id, views, likes, created_at, title, thumbnail_url')
      .eq('vendor_id', vid)
      .gte('created_at', curr.start)
      .lte('created_at', curr.end),

    supabase.from('product_videos')
      .select('id, views, likes, created_at, title, thumbnail_url')
      .eq('vendor_id', vid)
      .order('views', { ascending: false })
      .limit(10),

    // FIX: store_followers → vendor_follows
    supabase.from('vendor_follows')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vid)
      .gte('created_at', curr.start)
      .lte('created_at', curr.end),

    // FIX: store_followers → vendor_follows
    supabase.from('vendor_follows')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vid)
      .gte('created_at', prev.start)
      .lte('created_at', prev.end),

    // FIX: store_followers → vendor_follows
    supabase.from('vendor_follows')
      .select('created_at')
      .eq('vendor_id', vid)
      .gte('created_at', curr.start)
      .lte('created_at', curr.end)
      .order('created_at'),

    supabase.from('reviews')
      .select('id, rating, body, created_at, reviewer:users(full_name, avatar_url)')
      .eq('vendor_id', vid)
      .gte('created_at', curr.start)
      .lte('created_at', curr.end)
      .order('created_at', { ascending: false }),

    // FIX: store_views does not exist — use video_views as store traffic proxy
    supabase.from('video_views')
      .select('created_at, video:product_videos!inner(vendor_id)')
      .eq('video.vendor_id', vid)
      .gte('created_at', curr.start)
      .lte('created_at', curr.end),

    // FIX: messages → dm_messages
    // Count DMs received in threads where vendor's user_id is a participant
    supabase.from('dm_messages')
      .select('id', { count: 'exact', head: true })
      .neq('sender_id', user.id)
      .gte('created_at', curr.start)
      .lte('created_at', curr.end),

    // circle_members — correct, kept as-is
    supabase.from('circle_members')
      .select('id', { count: 'exact', head: true })
      .in('circle_id', (
        await supabase
          .from('circles')
          .select('id')
          .eq('vendor_id', vid)
          .then(r => (r.data ?? []).map(c => c.id))
      )),
  ])

  // ── Revenue metrics ────────────────────────────────────────────────────────
  const revenueNow      = (ordersNow  ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0)
  const revenuePrev     = (ordersPrev ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0)
  const ordersCount     = (ordersNow  ?? []).length
  const ordersPrevCount = (ordersPrev ?? []).length
  const avgOrderValue   = ordersCount > 0 ? revenueNow / ordersCount : 0

  const revenueSeries = buildDailySeries(ordersNow ?? [], 'created_at', 'total_amount', curr)

  const statusCounts = (allOrders ?? []).reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {})

  const totalViews = (videosNow ?? []).reduce((s, v) => s + (v.views ?? 0), 0)
  const totalLikes = (videosNow ?? []).reduce((s, v) => s + (v.likes ?? 0), 0)

  const viewsSeries    = buildDailySeries(videosNow     ?? [], 'created_at', 'views', curr)
  const followerSeries = buildDailySeries(followerGrowth ?? [], 'created_at', null, curr)

  // FIX: reviews.comment → reviews.body (correct column name in schema)
  const allRatings = (reviews ?? []).map(r => r.rating).filter(Boolean)
  const avgRating  = allRatings.length > 0
    ? +(allRatings.reduce((s, r) => s + r, 0) / allRatings.length).toFixed(1)
    : null
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: allRatings.filter(r => r === star).length,
    pct: allRatings.length > 0
      ? Math.round((allRatings.filter(r => r === star).length / allRatings.length) * 100)
      : 0,
  }))

  const productMap = {}
  for (const item of (topProducts ?? [])) {
    const id = item.product?.id
    if (!id) continue
    if (!productMap[id]) productMap[id] = { ...item.product, totalRevenue: 0, totalQty: 0 }
    productMap[id].totalRevenue += item.total_price ?? 0
    productMap[id].totalQty    += item.quantity     ?? 0
  }
  const topProductsList = Object.values(productMap)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10)

  const viewCount      = (storeViews ?? []).length
  const conversionRate = viewCount > 0
    ? +((ordersCount / viewCount) * 100).toFixed(2)
    : null

  return {
    vendor,
    range,
    period: curr,
    overview: {
      revenue:         revenueNow,
      revenuePrev,
      revenueGrowth:   pct(revenueNow, revenuePrev),
      orders:          ordersCount,
      ordersPrev:      ordersPrevCount,
      ordersGrowth:    pct(ordersCount, ordersPrevCount),
      avgOrderValue,
      totalProducts:   totalProducts   ?? 0,
      totalViews,
      totalLikes,
      followers:       followersNow    ?? 0,
      followersPrev:   followersPrev   ?? 0,
      followersGrowth: pct(followersNow ?? 0, followersPrev ?? 0),
      avgRating,
      totalReviews:    allRatings.length,
      storeViews:      viewCount,
      conversionRate,
      totalMessages:   totalMessages   ?? 0,
      circleMembers:   circleMembers   ?? 0,
    },
    revenueSeries,
    viewsSeries,
    followerSeries,
    statusCounts,
    topProducts: topProductsList,
    topVideos:   allVideos  ?? [],
    reviews:    (reviews    ?? []).slice(0, 10),
    ratingDist,
  }
}

// ─── CSV Export ────────────────────────────────────────────────────────────────
export async function getAnalyticsCSV({ range = '30d', from, to } = {}) {
  const data = await getAnalytics({ range, from, to })
  if (!data) return null

  const rows = data.revenueSeries.map(d => ({
    date:      d.date,
    revenue:   d.value,
    views:     data.viewsSeries.find(v => v.date === d.date)?.value    ?? 0,
    followers: data.followerSeries.find(f => f.date === d.date)?.value ?? 0,
  }))

  const header = 'Date,Revenue,Video Views,New Followers'
  const csv    = [header, ...rows.map(r =>
    `${r.date},${r.revenue},${r.views},${r.followers}`
  )].join('\n')

  return csv
}