'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── List products with filters ───────────────────────────────────────────────
export async function getProducts({ search, status, category, type, page = 1, limit = 20 } = {}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return null

  let query = supabase
    .from('products')
    .select(`
      id, name, description, price, compare_at_price,
      stock_quantity, status, product_type, category,
      images, thumbnail_url, sku, slug,
      is_digital, track_inventory,
      created_at, updated_at,
      variants:product_variants ( id, name, options )
    `, { count: 'exact' })
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  if (search)   query = query.ilike('name', `%${search}%`)
  if (status)   query = query.eq('status', status)
  if (category) query = query.eq('category', category)
  if (type)     query = query.eq('product_type', type)

  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data, count, error } = await query
  if (error) return null

  return { products: data ?? [], total: count ?? 0, page, limit }
}

// ─── Get single product ───────────────────────────────────────────────────────
export async function getProduct(id) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return null

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      variants:product_variants (*)
    `)
    .eq('id', id)
    .eq('vendor_id', vendor.id)
    .single()

  if (error) return null
  return data
}

// ─── Create product ───────────────────────────────────────────────────────────
export async function createProduct(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return { error: 'Vendor not found' }

  const slug = generateSlug(formData.name)

  const { variants, ...productData } = formData

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      ...productData,
      vendor_id:     vendor.id,
      slug,
      thumbnail_url: productData.images?.[0] ?? null,
      // Sync is_active with status so customer-facing queries show the product
      is_active:     productData.status === 'active',
      created_at:    new Date().toISOString(),
      updated_at:    new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Insert variants if any
  if (variants?.length > 0) {
    const variantRows = variants.map(v => ({
      product_id: product.id,
      vendor_id:  vendor.id,
      name:       v.name,
      options:    v.options,   // e.g. { size: 'M', color: 'Red' }
      price:      v.price ?? productData.price,
      stock_quantity: v.stock_quantity ?? 0,
      sku:        v.sku ?? null,
      image_url:  v.image_url ?? null,
    }))
    const { error: vErr } = await supabase.from('product_variants').insert(variantRows)
    if (vErr) return { error: vErr.message }
  }

  revalidatePath('/vendor/products')
  return { data: product }
}

// ─── Update product ───────────────────────────────────────────────────────────
export async function updateProduct(id, formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return { error: 'Vendor not found' }

  const { variants, ...productData } = formData

  const { data: product, error } = await supabase
    .from('products')
    .update({
      ...productData,
      thumbnail_url: productData.images?.[0] ?? null,
      // Sync is_active with status so customer-facing queries show/hide correctly
      ...(productData.status !== undefined && { is_active: productData.status === 'active' }),
      updated_at:    new Date().toISOString(),
    })
    .eq('id', id)
    .eq('vendor_id', vendor.id)
    .select()
    .single()

  if (error) return { error: error.message }

  // Replace variants — delete old, insert new
  if (variants !== undefined) {
    await supabase.from('product_variants').delete().eq('product_id', id)
    if (variants.length > 0) {
      const variantRows = variants.map(v => ({
        product_id:     id,
        vendor_id:      vendor.id,
        name:           v.name,
        options:        v.options,
        price:          v.price ?? productData.price,
        stock_quantity: v.stock_quantity ?? 0,
        sku:            v.sku    ?? null,
        image_url:      v.image_url ?? null,
      }))
      await supabase.from('product_variants').insert(variantRows)
    }
  }

  revalidatePath('/vendor/products')
  revalidatePath(`/vendor/products/${id}`)
  return { data: product }
}

// ─── Quick stock update ────────────────────────────────────────────────────────
export async function updateStock(id, stock_quantity) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return { error: 'Vendor not found' }

  const { error } = await supabase
    .from('products')
    .update({ stock_quantity, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('vendor_id', vendor.id)

  if (error) return { error: error.message }
  revalidatePath('/vendor/products')
  revalidatePath('/vendor/inventory')
  return { success: true }
}

// ─── Toggle status (publish / unpublish) ─────────────────────────────────────
export async function toggleProductStatus(id, status) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()

  const { error } = await supabase
    .from('products')
    .update({
      status,
      // Keep is_active in sync with status for customer-facing visibility
      is_active: status === 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('vendor_id', vendor.id)

  if (error) return { error: error.message }
  revalidatePath('/vendor/products')
  return { success: true }
}

// ─── Delete product ───────────────────────────────────────────────────────────
export async function deleteProduct(id) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()

  // Delete variants first
  await supabase.from('product_variants').delete().eq('product_id', id)

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('vendor_id', vendor.id)

  if (error) return { error: error.message }
  revalidatePath('/vendor/products')
  return { success: true }
}

// ─── Bulk actions ─────────────────────────────────────────────────────────────
export async function bulkProductAction(ids, action) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return { error: 'Vendor not found' }

  if (action === 'delete') {
    await supabase.from('product_variants').delete().in('product_id', ids)
    const { error } = await supabase.from('products')
      .delete().in('id', ids).eq('vendor_id', vendor.id)
    if (error) return { error: error.message }
  }

  if (action === 'publish' || action === 'unpublish') {
    const status = action === 'publish' ? 'active' : 'draft'
    const { error } = await supabase.from('products')
      .update({ status, is_active: status === 'active', updated_at: new Date().toISOString() })
      .in('id', ids).eq('vendor_id', vendor.id)
    if (error) return { error: error.message }
  }

  revalidatePath('/vendor/products')
  return { success: true }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    + '-' + Math.random().toString(36).slice(2, 7)
}