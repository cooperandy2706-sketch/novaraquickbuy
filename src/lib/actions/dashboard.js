'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Main dashboard stats ─────────────────────────────────────────────────────
export async function getDashboardStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, store_name, store_handle, store_logo_url, verification_status, verified, created_at')
    .eq('user_id', user.id)
    .single()
  if (!vendor) return null

  const vendorId = vendor.id
  const now      = new Date()
  const day30ago = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
  const day60ago = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString()
  const day7ago  = new Date(now -  7 * 24 * 60 * 60 * 1000).toISOString()

  // ── Orders this month vs last month ──────────────────────────────────────────
  const [{ data: ordersThisMonth }, { data: ordersLastMonth }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total_amount, status, created_at')
      .eq('vendor_id', vendorId)
      .gte('created_at', day30ago),
    supabase
      .from('orders')
      .select('id, total_amount, status')
      .eq('vendor_id', vendorId)
      .gte('created_at', day60ago)
      .lt('created_at', day30ago),
  ])

  const revenueThis = (ordersThisMonth ?? [])
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + (o.total_amount ?? 0), 0)

  const revenueLast = (ordersLastMonth ?? [])
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + (o.total_amount ?? 0), 0)

  const revenueGrowth = revenueLast > 0
    ? (((revenueThis - revenueLast) / revenueLast) * 100).toFixed(1)
    : null

  // ── Products ──────────────────────────────────────────────────────────────────
  const { count: totalProducts } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', vendorId)

  const { count: lowStockCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', vendorId)
    .lte('stock_quantity', 5)
    .gt('stock_quantity', 0)

  const { count: outOfStockCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', vendorId)
    .eq('stock_quantity', 0)

  // ── Pending orders ────────────────────────────────────────────────────────────
  const { count: pendingOrders } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', vendorId)
    .in('status', ['pending', 'vendor_accepted', 'preparing'])

  // ── Unread messages ───────────────────────────────────────────────────────────
  // FIX: 'messages' table does not exist
  // Vendor receives DMs via dm_threads where they are participant_a or participant_b
  // Count unread via dm_thread_reads where unread_count > 0
  const { data: vendorThreadReads } = await supabase
    .from('dm_thread_reads')
    .select('unread_count, thread:dm_threads!inner(participant_a, participant_b)')
    .eq('user_id', user.id)
    .gt('unread_count', 0)

  const unreadMessages = (vendorThreadReads ?? [])
    .reduce((s, r) => s + (r.unread_count ?? 0), 0)

  // ── Video stats (last 7 days) ─────────────────────────────────────────────────
  const { data: videoStats } = await supabase
    .from('product_videos')
    .select('views, likes')
    .eq('vendor_id', vendorId)
    .gte('created_at', day7ago)

  const totalViews = (videoStats ?? []).reduce((s, v) => s + (v.views ?? 0), 0)

  // ── Recent orders ─────────────────────────────────────────────────────────────
  const { data: recentOrders } = await supabase
    .from('orders')
    .select(`
      id, status, total_amount, created_at,
      order_items (
        quantity,
        product:products ( name, thumbnail_url )
      )
    `)
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .limit(5)

  // ── Top products ──────────────────────────────────────────────────────────────
  const { data: topProducts } = await supabase
    .from('order_items')
    .select(`
      quantity,
      product:products ( id, name, thumbnail_url, price, stock_quantity )
    `)
    .eq('vendor_id', vendorId)
    .gte('created_at', day30ago)
    .order('quantity', { ascending: false })
    .limit(5)

  // ── Revenue chart — last 7 days ───────────────────────────────────────────────
  const { data: chartOrders } = await supabase
    .from('orders')
    .select('total_amount, created_at, status')
    .eq('vendor_id', vendorId)
    .gte('created_at', day7ago)
    .neq('status', 'cancelled')

  const chartData = buildDailyRevenue(chartOrders ?? [])

  return {
    vendor,
    stats: {
      revenueThis,
      revenueLast,
      revenueGrowth,
      totalOrders:     (ordersThisMonth ?? []).length,
      pendingOrders:   pendingOrders  ?? 0,
      totalProducts:   totalProducts  ?? 0,
      lowStockCount:   lowStockCount  ?? 0,
      outOfStockCount: outOfStockCount ?? 0,
      unreadMessages,
      videoViews:      totalViews,
    },
    recentOrders: recentOrders ?? [],
    topProducts:  topProducts  ?? [],
    chartData,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildDailyRevenue(orders) {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d     = new Date()
    d.setDate(d.getDate() - i)
    const key   = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en', { weekday: 'short' })
    const total = orders
      .filter(o => o.created_at.slice(0, 10) === key)
      .reduce((s, o) => s + (o.total_amount ?? 0), 0)
    days.push({ label, total, date: key })
  }
  return days
}