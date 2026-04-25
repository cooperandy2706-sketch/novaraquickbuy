'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const PAGE_SIZE = 24

const PRODUCT_SELECT = `
  id, name, description, price, discount_price,
  images, category, avg_rating, review_count,
  total_sold, stock_quantity, created_at,
  vendor:vendors!inner (
    id, store_name, logo_url, verified, verification_status,
    trust_score, follower_count, business_country
  )
`

export function useSearch(query = '', country = 'all') {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [page,    setPage]    = useState(0)
  const supabase = createClient()

  const fetchResults = useCallback(async (isLoadMore = false) => {
    try {
      setLoading(true)
      const currentPage = isLoadMore ? page + 1 : 0
      const from = currentPage * PAGE_SIZE
      const to   = from + PAGE_SIZE - 1

      let q = supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('is_active', true)
        .range(from, to)

      // Search filters
      if (query) {
        q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      }

      // Country filter
      if (country && country !== 'all') {
        q = q.eq('vendor.business_country', country)
      }

      // Default sort by latest
      q = q.order('created_at', { ascending: false })

      const { data, error: err } = await q

      if (err) throw err

      if (isLoadMore) {
        setResults(prev => [...prev, ...(data ?? [])])
      } else {
        setResults(data ?? [])
      }

      setHasMore((data?.length ?? 0) === PAGE_SIZE)
      setPage(currentPage)
    } catch (err) {
      console.error('Search error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [query, country, page, supabase])

  // Reset and fetch on query/country change
  useEffect(() => {
    fetchResults(false)
  }, [query, country]) // eslint-disable-line

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchResults(true)
    }
  }

  return { results, loading, error, hasMore, loadMore }
}
