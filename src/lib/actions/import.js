'use server'

import { createClient }  from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Column map: accepted header aliases → internal field ────────────────────
const COLUMN_MAP = {
  // Name
  'name':           'name',
  'product name':   'name',
  'title':          'name',
  'product title':  'name',
  'item name':      'name',

  // Description
  'description':    'description',
  'desc':           'description',
  'details':        'description',
  'body':           'description',

  // Price
  'price':          'price',
  'sale price':     'price',
  'selling price':  'price',
  'unit price':     'price',

  // Compare at price
  'compare at price':     'compare_at_price',
  'compare_at_price':     'compare_at_price',
  'original price':       'compare_at_price',
  'was price':            'compare_at_price',
  'mrp':                  'compare_at_price',

  // Cost
  'cost':           'cost_per_item',
  'cost per item':  'cost_per_item',
  'cost_per_item':  'cost_per_item',
  'cogs':           'cost_per_item',

  // SKU
  'sku':            'sku',
  'item code':      'sku',
  'item_code':      'sku',
  'product code':   'sku',
  'barcode':        'barcode',

  // Stock
  'stock':             'stock_quantity',
  'stock quantity':    'stock_quantity',
  'stock_quantity':    'stock_quantity',
  'quantity':          'stock_quantity',
  'qty':               'stock_quantity',
  'inventory':         'stock_quantity',
  'available':         'stock_quantity',

  // Category
  'category':       'category',
  'type':           'product_type',
  'product type':   'product_type',
  'product_type':   'product_type',

  // Status
  'status':         'status',
  'published':      'status',
  'active':         'status',

  // Images
  'image':          'image_url',
  'image url':      'image_url',
  'image_url':      'image_url',
  'photo':          'image_url',
  'thumbnail':      'image_url',

  // Digital
  'download url':   'digital_url',
  'download_url':   'digital_url',
  'file url':       'digital_url',
  'digital url':    'digital_url',
  'digital_url':    'digital_url',

  // Weight
  'weight':         'weight',

  // SEO
  'seo title':      'seo_title',
  'meta title':     'seo_title',
  'seo description':'seo_description',
  'meta description':'seo_description',

  // Tags
  'tags':           'tags',
  'keywords':       'tags',
}

const REQUIRED_FIELDS = ['name', 'price']

const VALID_CATEGORIES = [
  'Fashion & Apparel', 'Electronics & Gadgets', 'Food & Groceries',
  'Beauty & Skincare', 'Home & Living', 'Sports & Fitness',
  'Books & Stationery', 'Automotive', 'Health & Wellness',
  'Kids & Toys', 'Art & Crafts', 'Other',
]

const VALID_TYPES    = ['physical', 'digital', 'service', 'variable']
const VALID_STATUSES = ['active', 'draft', 'archived']

// ─── Normalise a single raw row ───────────────────────────────────────────────
function normaliseRow(raw, rowIndex) {
  const errors   = []
  const warnings = []
  const row      = {}

  // Map headers → internal fields
  for (const [key, value] of Object.entries(raw)) {
    const mapped = COLUMN_MAP[key.toLowerCase().trim()]
    if (mapped) row[mapped] = value?.toString().trim() ?? ''
  }

  // ── Validations ─────────────────────────────────────────────────────────
  // Name
  if (!row.name)          errors.push('Name is required')
  else if (row.name.length > 200) warnings.push('Name exceeds 200 chars — will be truncated')

  // Price
  if (!row.price)         errors.push('Price is required')
  else if (isNaN(Number(row.price)) || Number(row.price) < 0)
    errors.push('Price must be a positive number')

  // Compare at price
  if (row.compare_at_price) {
    if (isNaN(Number(row.compare_at_price)))
      errors.push('Compare-at price must be a number')
    else if (Number(row.compare_at_price) <= Number(row.price))
      warnings.push('Compare-at price is not higher than price — sale badge won\'t show')
  }

  // Stock
  if (row.stock_quantity !== undefined && row.stock_quantity !== '') {
    if (isNaN(Number(row.stock_quantity)) || Number(row.stock_quantity) < 0)
      errors.push('Stock quantity must be a non-negative number')
  }

  // Category
  if (row.category && !VALID_CATEGORIES.includes(row.category)) {
    warnings.push(`Category "${row.category}" not recognised — will save as-is`)
  }

  // Product type
  if (row.product_type) {
    const t = row.product_type.toLowerCase()
    if (!VALID_TYPES.includes(t)) {
      warnings.push(`Product type "${row.product_type}" not valid — defaulting to "physical"`)
      row.product_type = 'physical'
    } else {
      row.product_type = t
    }
  } else {
    row.product_type = 'physical'
  }

  // Status
  if (row.status) {
    const s = row.status.toLowerCase()
    if (s === 'true' || s === 'yes' || s === '1') row.status = 'active'
    else if (s === 'false' || s === 'no' || s === '0') row.status = 'draft'
    else if (!VALID_STATUSES.includes(s)) {
      warnings.push(`Status "${row.status}" not recognised — defaulting to "draft"`)
      row.status = 'draft'
    } else {
      row.status = s
    }
  } else {
    row.status = 'draft'
  }

  // Weight (assume kg if not specified, or handle units if provided in a string)
  if (row.weight) {
    const w = row.weight.toString().toLowerCase()
    const val = parseFloat(w)
    if (!isNaN(val)) {
      if (w.includes('kg')) row.weight_grams = Math.round(val * 1000)
      else if (w.includes('lb')) row.weight_grams = Math.round(val * 453.592)
      else if (w.includes('oz')) row.weight_grams = Math.round(val * 28.3495)
      else if (w.includes('g') && !w.includes('kg')) row.weight_grams = Math.round(val)
      else row.weight_grams = Math.round(val * 1000) // Default kg
    }
  }

  row.price            = Number(row.price)          || 0
  row.compare_at_price = row.compare_at_price ? Number(row.compare_at_price) : null
  row.cost_per_item    = row.cost_per_item    ? Number(row.cost_per_item)    : null
  row.stock_quantity   = row.stock_quantity !== undefined && row.stock_quantity !== ''
    ? Number(row.stock_quantity) : 0
  row.track_inventory  = true
  row.is_digital       = row.product_type === 'digital'

  return { row, errors, warnings, rowIndex }
}

// ─── Detect unmapped columns ──────────────────────────────────────────────────
function detectUnmappedColumns(headers) {
  return headers.filter(h => !COLUMN_MAP[h.toLowerCase().trim()])
}

// ─── VALIDATE ROWS (preview step — no DB writes) ──────────────────────────────
export async function validateImport(rows, headers) {
  const unmapped = detectUnmappedColumns(headers)

  const results = rows.map((raw, i) => normaliseRow(raw, i + 2)) // row 1 = header

  const validRows   = results.filter(r => r.errors.length === 0)
  const invalidRows = results.filter(r => r.errors.length > 0)

  // Check for duplicate SKUs within the file
  const skuMap = {}
  results.forEach(({ row, rowIndex }) => {
    if (row.sku) {
      if (skuMap[row.sku]) {
        skuMap[row.sku].push(rowIndex)
      } else {
        skuMap[row.sku] = [rowIndex]
      }
    }
  })
  const duplicateSkusInFile = Object.entries(skuMap)
    .filter(([, rows]) => rows.length > 1)
    .map(([sku, rows]) => ({ sku, rows }))

  return {
    total:    rows.length,
    valid:    validRows.length,
    invalid:  invalidRows.length,
    results,
    unmappedColumns:     unmapped,
    duplicateSkusInFile,
    preview: validRows.slice(0, 5).map(r => r.row),
  }
}

// ─── DETECT CONFLICTS (check which SKUs already exist in DB) ─────────────────
export async function detectConflicts(rows) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return { error: 'Vendor not found' }

  const normalised = rows
    .map((raw, i) => normaliseRow(raw, i + 2))
    .filter(r => r.errors.length === 0)
    .map(r => r.row)

  const skus = normalised.map(r => r.sku).filter(Boolean)
  if (!skus.length) return { conflicts: [] }

  const { data: existing } = await supabase
    .from('products')
    .select('id, sku, name, price, stock_quantity, thumbnail_url, updated_at')
    .eq('vendor_id', vendor.id)
    .in('sku', skus)

  const existingMap = Object.fromEntries((existing ?? []).map(p => [p.sku, p]))

  const conflicts = normalised
    .filter(row => row.sku && existingMap[row.sku])
    .map(row => ({
      sku:             row.sku,
      incomingRow:     row,
      existingProduct: existingMap[row.sku],
    }))

  return { conflicts }
}

// ─── EXECUTE IMPORT (actual DB writes) ───────────────────────────────────────
export async function executeImport(rows, options = {}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return { error: 'Vendor not found' }

  // perRowDecisions: { [sku]: 'update' | 'skip' }
  const { perRowDecisions = {} } = options

  // Normalise all rows
  const normalised = rows
    .map((raw, i) => normaliseRow(raw, i + 2))
    .filter(r => r.errors.length === 0)
    .map(r => r.row)

  if (!normalised.length) return { error: 'No valid rows to import' }

  // Fetch existing SKUs for this vendor
  const skus = normalised.map(r => r.sku).filter(Boolean)
  const { data: existing } = skus.length
    ? await supabase.from('products').select('id, sku').eq('vendor_id', vendor.id).in('sku', skus)
    : { data: [] }

  const existingSkuMap = Object.fromEntries((existing ?? []).map(p => [p.sku, p.id]))

  const toCreate = []
  const toUpdate = []
  const skipped  = []

  for (const row of normalised) {
    const existingId = row.sku ? existingSkuMap[row.sku] : null

    if (existingId) {
      const decision = row.sku ? (perRowDecisions[row.sku] ?? 'update') : 'update'
      if (decision === 'update') {
        toUpdate.push({ id: existingId, ...row })
      } else {
        skipped.push(row.name)
      }
    } else {
      toCreate.push({
        ...row,
        vendor_id:     vendor.id,
        slug:          generateSlug(row.name),
        thumbnail_url: row.image_url ?? null,
        images:        row.image_url ? [row.image_url] : [],
        created_at:    new Date().toISOString(),
        updated_at:    new Date().toISOString(),
      })
    }
  }

  let created = 0
  let updated = 0
  const errors = []

  // ── Batch create ──────────────────────────────────────────────────────────
  if (toCreate.length) {
    // Insert in batches of 50
    const batches = chunk(toCreate, 50)
    for (const batch of batches) {
      const { error } = await supabase.from('products').insert(batch)
      if (error) errors.push(`Create batch failed: ${error.message}`)
      else created += batch.length
    }
  }

  // ── Batch update ──────────────────────────────────────────────────────────
  if (toUpdate.length) {
    const results = await Promise.allSettled(
      toUpdate.map(({ id, ...data }) =>
        supabase.from('products')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('vendor_id', vendor.id)
      )
    )
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && !r.value?.error) updated++
      else errors.push(`Update failed for row ${i + 1}`)
    })
  }

  revalidatePath('/vendor/products')
  revalidatePath('/vendor/inventory')

  return {
    success: true,
    created,
    updated,
    skipped: skipped.length,
    errors,
    total: created + updated + skipped.length,
  }
}

// ─── STOCK-ONLY IMPORT ────────────────────────────────────────────────────────
export async function executeStockImport(rows) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) return { error: 'Vendor not found' }

  const updates = rows
    .map(r => ({
      sku: r.sku?.toString().trim(),
      qty: Number(r.stock_quantity ?? r.quantity ?? r.qty ?? r.stock ?? 0),
    }))
    .filter(r => r.sku && !isNaN(r.qty) && r.qty >= 0)

  if (!updates.length) return { error: 'No valid rows found. Ensure file has SKU and stock columns.' }

  const skus = updates.map(u => u.sku)
  const { data: products } = await supabase
    .from('products').select('id, sku').eq('vendor_id', vendor.id).in('sku', skus)

  const productMap = Object.fromEntries((products ?? []).map(p => [p.sku, p.id]))
  const notFound   = updates.filter(u => !productMap[u.sku]).map(u => u.sku)

  const matched = updates.filter(u => productMap[u.sku])

  if (!matched.length) return {
    error: `No products matched. SKUs not found: ${notFound.slice(0, 5).join(', ')}${notFound.length > 5 ? '…' : ''}`
  }

  const results = await Promise.allSettled(
    matched.map(u =>
      supabase.from('products')
        .update({ stock_quantity: u.qty, updated_at: new Date().toISOString() })
        .eq('id', productMap[u.sku])
        .eq('vendor_id', vendor.id)
    )
  )

  const updated = results.filter(r => r.status === 'fulfilled').length
  revalidatePath('/vendor/inventory')
  revalidatePath('/vendor/products')

  return { success: true, updated, notFound, total: updates.length }
}

// ─── GET TEMPLATE ─────────────────────────────────────────────────────────────
export async function getImportTemplate(type = 'products') {
  if (type === 'stock') {
    return {
      headers: ['sku', 'stock_quantity'],
      sample: [
        { sku: 'SHIRT-RED-M', stock_quantity: 25 },
        { sku: 'SHOE-BLK-42', stock_quantity: 10 },
        { sku: 'BAG-LTH-001', stock_quantity: 5  },
      ],
    }
  }

  return {
    headers: [
      'name', 'description', 'price', 'compare_at_price', 'cost_per_item',
      'sku', 'barcode', 'stock_quantity', 'category', 'product_type',
      'status', 'image_url', 'weight', 'seo_title', 'seo_description',
    ],
    sample: [
      {
        name: 'Premium Cotton T-Shirt',
        description: 'Soft and breathable 100% cotton t-shirt perfect for everyday wear.',
        price: 29.99,
        compare_at_price: 39.99,
        cost_per_item: 12.00,
        sku: 'TSHIRT-WHT-M',
        barcode: '1234567890123',
        stock_quantity: 50,
        category: 'Fashion & Apparel',
        product_type: 'physical',
        status: 'active',
        image_url: 'https://example.com/images/tshirt-white.jpg',
        weight: 0.3,
        seo_title: 'Premium Cotton T-Shirt — Comfortable Everyday Wear',
        seo_description: 'Shop our premium cotton t-shirt. Soft, breathable, and perfect for any occasion.',
      },
      {
        name: 'Wireless Earbuds Pro',
        description: 'High-quality wireless earbuds with 24-hour battery life and noise cancellation.',
        price: 89.99,
        compare_at_price: 119.99,
        cost_per_item: 35.00,
        sku: 'EARBUDS-BLK',
        barcode: '9876543210987',
        stock_quantity: 30,
        category: 'Electronics & Gadgets',
        product_type: 'physical',
        status: 'active',
        image_url: 'https://example.com/images/earbuds-black.jpg',
        weight: 0.1,
        seo_title: '',
        seo_description: '',
      },
    ],
  }
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

function chunk(arr, size) {
  const chunks = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}