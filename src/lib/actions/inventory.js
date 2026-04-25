'use server'

import { createClient }  from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Get full inventory list ──────────────────────────────────────────────────
export async function getInventory({ filter, search, page = 1, limit = 30 } = {}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return null

  let query = supabase
    .from('products')
    .select(`
      id, name, sku, category, product_type,
      stock_quantity, low_stock_threshold,
      track_inventory, is_digital, status,
      price, thumbnail_url, updated_at,
      variants:product_variants (
        id, name, stock_quantity, sku, price
      )
    `, { count: 'exact' })
    .eq('vendor_id', vendor.id)
    .eq('track_inventory', true)
    .neq('is_digital', true)
    .order('stock_quantity', { ascending: true })

  if (search) query = query.ilike('name', `%${search}%`)

  if (filter === 'out_of_stock') query = query.eq('stock_quantity', 0)
  if (filter === 'low_stock')    query = query.gt('stock_quantity', 0).lte('stock_quantity', 5)
  if (filter === 'in_stock')     query = query.gt('stock_quantity', 5)

  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data, count, error } = await query
  if (error) return null

  // ── Summary counts ────────────────────────────────────────────────────────
  const [
    { count: outOfStock },
    { count: lowStock },
    { count: inStock },
    { count: total },
  ] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id).eq('track_inventory', true).eq('stock_quantity', 0),
    supabase.from('products').select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id).eq('track_inventory', true).gt('stock_quantity', 0).lte('stock_quantity', 5),
    supabase.from('products').select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id).eq('track_inventory', true).gt('stock_quantity', 5),
    supabase.from('products').select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id).eq('track_inventory', true),
  ])

  return {
    products:   data ?? [],
    total:      count ?? 0,
    page,
    limit,
    summary: {
      total:      total      ?? 0,
      outOfStock: outOfStock ?? 0,
      lowStock:   lowStock   ?? 0,
      inStock:    inStock    ?? 0,
    },
  }
}

// ─── Bulk stock update ────────────────────────────────────────────────────────
export async function bulkUpdateStock(updates) {
  // updates: [{ id, stock_quantity }, ...]
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return { error: 'Vendor not found' }

  const results = await Promise.allSettled(
    updates.map(({ id, stock_quantity }) =>
      supabase
        .from('products')
        .update({ stock_quantity: Number(stock_quantity), updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('vendor_id', vendor.id)
    )
  )

  const failed = results.filter(r => r.status === 'rejected' || r.value?.error)
  if (failed.length) return { error: `${failed.length} update(s) failed` }

  revalidatePath('/vendor/inventory')
  revalidatePath('/vendor/products')
  return { success: true, updated: updates.length }
}

// ─── Update single product stock + low stock threshold ────────────────────────
export async function updateInventoryItem(id, { stock_quantity, low_stock_threshold }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()

  const patch = { updated_at: new Date().toISOString() }
  if (stock_quantity     !== undefined) patch.stock_quantity     = Number(stock_quantity)
  if (low_stock_threshold !== undefined) patch.low_stock_threshold = Number(low_stock_threshold)

  const { error } = await supabase
    .from('products')
    .update(patch)
    .eq('id', id)
    .eq('vendor_id', vendor.id)

  if (error) return { error: error.message }
  revalidatePath('/vendor/inventory')
  revalidatePath('/vendor/products')
  revalidatePath('/vendor/dashboard')
  return { success: true }
}

// ─── Update variant stock ─────────────────────────────────────────────────────
export async function updateVariantStock(variantId, stock_quantity) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()

  const { error } = await supabase
    .from('product_variants')
    .update({ stock_quantity: Number(stock_quantity), updated_at: new Date().toISOString() })
    .eq('id', variantId)
    .eq('vendor_id', vendor.id)

  if (error) return { error: error.message }
  revalidatePath('/vendor/inventory')
  return { success: true }
}

// ─── Stock history log (optional — if you have a stock_logs table) ────────────
export async function getStockHistory(productId, limit = 20) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('stock_logs')
    .select('id, change, reason, created_at, previous_qty, new_qty')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}