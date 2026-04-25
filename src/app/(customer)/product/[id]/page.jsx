'use client'
// FILE: src/app/(customer)/product/[id]/page.jsx

import { useState, useEffect, use } from 'react'
import Link             from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ProductDetail    from '@/components/product/ProductDetail'

export default function ProductPage({ params }) {
  const { id } = use(params)
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const supabase = createClient()

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)
        let query = supabase
          .from('products')
          .select(`
            *,
            vendor:vendors(id, store_name, trust_score, verified, follower_count, badges, business_phone),
            reviews(id, rating, comment, created_at, reviewer_id)
          `)

        if (isUUID) {
          query = query.or(`id.eq.${id},slug.eq.${id}`)
        } else {
          query = query.eq('slug', id)
        }

        const { data, error: fetchError } = await query.single()
        
        if (fetchError) throw fetchError
        setProduct(data)
      } catch (err) {
        console.error('Product fetch error:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id, isUUID, supabase])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 bg-surface">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-secondary font-medium animate-pulse">Loading product details...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">
        <div className="max-w-md w-full bg-surface-2 border border-border rounded-3xl p-8 text-center shadow-xl">
          <div className="w-20 h-20 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            🔍
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">Product Not Found</h1>
          <p className="text-secondary mb-6 leading-relaxed">
            We couldn't find the product you're looking for: <br/>
            <code className="bg-surface-3 px-2 py-1 rounded text-brand break-all">{id}</code>
          </p>
          
          <div className="p-4 bg-danger/5 border border-danger/10 rounded-2xl text-xs text-danger text-left mb-6">
            <p className="font-bold mb-1">Diagnostic Info:</p>
            <p>UUID Detected: {isUUID ? 'Yes' : 'No'}</p>
            {error && <p>Error: {error.message || 'Unknown error'}</p>}
            {!error && <p>Status: No matching record in database.</p>}
          </div>

          <Link 
            href="/feed"
            className="btn btn-primary w-full block text-center"
          >
            Back to Feed
          </Link>
        </div>
      </div>
    )
  }

  return <ProductDetail product={product} />
}