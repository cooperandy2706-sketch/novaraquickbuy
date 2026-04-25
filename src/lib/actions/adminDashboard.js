'use server'
// FILE: src/lib/actions/adminDashboard.js

import { createClient } from '@/lib/supabase/server'

async function requireAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const [{ data: adminRow }, { data: userRow }] = await Promise.all([
    supabase.from('admins').select('id, role').eq('user_id', user.id).maybeSingle(),
    supabase.from('users').select('role').eq('id', user.id).maybeSingle(),
  ])
  
  if (adminRow) return adminRow
  if (userRow?.role === 'admin') {
    return { id: user.id, role: userRow.role }
  }
  
  return null
}

// ─── Platform overview stats ──────────────────────────────────────────────────
export async function getAdminDashboardStats() {
  const supabase = await createClient()
  const admin    = await requireAdmin(supabase)
  if (!admin) return null

  const now      = new Date()
  const day30ago = new Date(now - 30 * 86400000).toISOString()
  const day7ago  = new Date(now -  7 * 86400000).toISOString()
  const today    = new Date(now.setHours(0,0,0,0)).toISOString()

  const [
    // Vendors
    { count: totalVendors },
    { count: newVendors30d },
    { count: pendingVerification },
    { count: activeVendors },

    // Orders
    { count: totalOrders },
    { count: ordersToday },
    { count: pendingOrders },
    { count: disputedOrders },

    // Revenue
    { data: revenueData },

    // Users / buyers
    { count: totalUsers },
    { count: newUsers7d },

    // Subscriptions
    { count: pendingSubs },
    { count: activeSubs },
    { data: subRevenue },

    // Products & Videos
    { count: totalProducts },
    { count: totalVideos },

    // Payments due
    { data: escrowData },
  ] = await Promise.all([
    supabase.from('vendors').select('id', { count: 'exact', head: true }),
    supabase.from('vendors').select('id', { count: 'exact', head: true }).gte('created_at', day30ago),
    supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('store_status', 'active'),

    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', today),
    supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['pending','vendor_accepted','preparing']),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'disputed'),

    supabase.from('orders').select('total_amount').neq('status','cancelled').gte('created_at', day30ago),

    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', day7ago),

    supabase.from('subscription_payments').select('id', { count: 'exact', head: true }).eq('status','pending'),
    supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('subscription_status','active'),
    supabase.from('subscription_payments').select('amount').eq('status','approved').gte('submitted_at', day30ago),

    supabase.from('products').select('id', { count: 'exact', head: true }).eq('status','active'),
    supabase.from('product_videos').select('id', { count: 'exact', head: true }).eq('status','published'),

    supabase.from('orders').select('total_amount').eq('escrow_status','held'),
  ])

  const gmv30d      = (revenueData  ?? []).reduce((s,r) => s + (r.total_amount ?? 0), 0)
  const escrowTotal = (escrowData   ?? []).reduce((s,r) => s + (r.total_amount ?? 0), 0)
  const subRev30d   = (subRevenue   ?? []).reduce((s,r) => s + (r.amount       ?? 0), 0)

  // 7-day GMV chart
  const { data: chartOrders } = await supabase
    .from('orders')
    .select('total_amount, created_at')
    .neq('status', 'cancelled')
    .gte('created_at', day7ago)

  const chart = buildDailyGMV(chartOrders ?? [])

  // Recent activity feed
  const [
    { data: recentVendors },
    { data: recentOrders  },
    { data: recentPayments},
  ] = await Promise.all([
    supabase.from('vendors')
      .select('id, store_name, store_handle, store_logo_url, verification_status, business_country, created_at')
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('orders')
      .select('id, total_amount, status, created_at, vendor:vendors(store_name)')
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('subscription_payments')
      .select('id, amount, currency, plan, status, submitted_at, vendor:vendors(store_name, store_handle)')
      .order('submitted_at', { ascending: false }).limit(5),
  ])

  return {
    vendors:  { total: totalVendors ?? 0, new30d: newVendors30d ?? 0, pendingVerification: pendingVerification ?? 0, active: activeVendors ?? 0 },
    orders:   { total: totalOrders ?? 0, today: ordersToday ?? 0, pending: pendingOrders ?? 0, disputed: disputedOrders ?? 0 },
    revenue:  { gmv30d, escrowTotal, subRev30d },
    users:    { total: totalUsers ?? 0, new7d: newUsers7d ?? 0 },
    subs:     { pending: pendingSubs ?? 0, active: activeSubs ?? 0 },
    content:  { products: totalProducts ?? 0, videos: totalVideos ?? 0 },
    chart,
    recentVendors:  recentVendors  ?? [],
    recentOrders:   recentOrders   ?? [],
    recentPayments: recentPayments ?? [],
  }
}

function buildDailyGMV(orders) {
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

// ─── Quick alert counts for nav badges ────────────────────────────────────────
export async function getAdminAlerts() {
  const supabase = await createClient()
  const admin    = await requireAdmin(supabase)
  if (!admin) return null

  const [
    { count: verif    },
    { count: subs     },
    { count: disputes },
    { count: reports  },
  ] = await Promise.all([
    supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabase.from('subscription_payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'disputed'),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending').catch(() => ({ count: 0 })),
  ])

  return {
    verif:    verif    ?? 0,
    subs:     subs     ?? 0,
    disputes: disputes ?? 0,
    reports:  reports  ?? 0,
  }
}

// ─── Revenue breakdown by country ────────────────────────────────────────────
export async function getRevenueByCountry() {
  const supabase = await createClient()
  const admin    = await requireAdmin(supabase)
  if (!admin) return []

  const day30ago = new Date(Date.now() - 30 * 86400000).toISOString()

  const { data } = await supabase
    .from('orders')
    .select('total_amount, vendor:vendors(business_country)')
    .neq('status', 'cancelled')
    .gte('created_at', day30ago)

  const map = {}
  ;(data ?? []).forEach(o => {
    const c = o.vendor?.business_country ?? 'Unknown'
    map[c]  = (map[c] ?? 0) + (o.total_amount ?? 0)
  })

  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([country, revenue]) => ({ country, revenue }))
}

// ─── Top performing vendors ───────────────────────────────────────────────────
export async function getTopVendors() {
  const supabase = await createClient()
  const admin    = await requireAdmin(supabase)
  if (!admin) return []

  const day30ago = new Date(Date.now() - 30 * 86400000).toISOString()

  const { data: orders } = await supabase
    .from('orders')
    .select('total_amount, vendor_id, vendor:vendors(id, store_name, store_logo_url, store_handle, business_country, verification_status)')
    .neq('status', 'cancelled')
    .gte('created_at', day30ago)

  const map = {}
  ;(orders ?? []).forEach(o => {
    if (!o.vendor_id) return
    if (!map[o.vendor_id]) map[o.vendor_id] = { vendor: o.vendor, revenue: 0, orders: 0 }
    map[o.vendor_id].revenue += o.total_amount ?? 0
    map[o.vendor_id].orders  += 1
  })

  return Object.values(map)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
}

// ─── Hourly order trend (last 24h) ───────────────────────────────────────────
export async function getHourlyTrend() {
  const supabase = await createClient()
  const admin    = await requireAdmin(supabase)
  if (!admin) return []

  const day1ago = new Date(Date.now() - 24 * 3600000).toISOString()

  const { data } = await supabase
    .from('orders')
    .select('created_at, total_amount')
    .neq('status', 'cancelled')
    .gte('created_at', day1ago)

  const hours = Array.from({ length: 24 }, (_, i) => {
    const h   = (new Date().getHours() - 23 + i + 24) % 24
    const key = String(h).padStart(2, '0')
    return { hour: `${key}:00`, orders: 0, revenue: 0 }
  })

  ;(data ?? []).forEach(o => {
    const h   = new Date(o.created_at).getHours()
    const now = new Date().getHours()
    const idx = (h - now + 24 + 23) % 24
    if (hours[idx]) {
      hours[idx].orders  += 1
      hours[idx].revenue += o.total_amount ?? 0
    }
  })

  return hours
}

// ─── Subscription revenue by plan ────────────────────────────────────────────
export async function getSubscriptionStats() {
  const supabase = await createClient()
  const admin    = await requireAdmin(supabase)
  if (!admin) return null

  const day30ago = new Date(Date.now() - 30 * 86400000).toISOString()

  const [
    { data: monthly   },
    { data: sixMonth  },
    { count: expiring },
  ] = await Promise.all([
    supabase.from('subscription_payments').select('amount').eq('plan','monthly').eq('status','approved').gte('submitted_at', day30ago),
    supabase.from('subscription_payments').select('amount').eq('plan','six_month').eq('status','approved').gte('submitted_at', day30ago),
    supabase.from('vendors').select('id', { count: 'exact', head: true })
      .eq('subscription_status','active')
      .lte('subscription_expires_at', new Date(Date.now() + 7 * 86400000).toISOString())
      .gte('subscription_expires_at', new Date().toISOString()),
  ])

  return {
    monthlyRev:  (monthly  ?? []).reduce((s,r) => s + (r.amount ?? 0), 0),
    sixMonthRev: (sixMonth ?? []).reduce((s,r) => s + (r.amount ?? 0), 0),
    monthlyCount: monthly?.length ?? 0,
    sixMonthCount: sixMonth?.length ?? 0,
    expiringIn7d: expiring ?? 0,
  }
}

// ─── Platform growth (vendors + users by week) ───────────────────────────────
export async function getPlatformGrowth() {
  const supabase = await createClient()
  const admin    = await requireAdmin(supabase)
  if (!admin) return []

  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end   = new Date(Date.now() - i * 7 * 86400000)
    const start = new Date(Date.now() - (i + 1) * 7 * 86400000)
    return {
      label:   `W${8 - i}`,
      start:   start.toISOString(),
      end:     end.toISOString(),
      vendors: 0,
      users:   0,
    }
  }).reverse()

  const [{ data: vendors }, { data: users }] = await Promise.all([
    supabase.from('vendors').select('created_at').gte('created_at', weeks[0].start),
    supabase.from('users').select('created_at').gte('created_at', weeks[0].start),
  ])

  ;(vendors ?? []).forEach(v => {
    const w = weeks.find(wk => v.created_at >= wk.start && v.created_at < wk.end)
    if (w) w.vendors++
  })
  ;(users ?? []).forEach(u => {
    const w = weeks.find(wk => u.created_at >= wk.start && u.created_at < wk.end)
    if (w) w.users++
  })

  return weeks
}