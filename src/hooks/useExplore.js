'use client'
// FILE: src/hooks/useExplore.js

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const PAGE_SIZE = 20

const PRODUCT_SELECT = `
  id, name, description, price, discount_price,
  images, category, avg_rating, review_count,
  total_sold, stock_quantity, created_at,
  is_hero, hero_position,
  vendor:vendors!inner (
    id, store_name, logo_url, verified, verification_status,
    trust_score, follower_count, business_city, business_country
  )
`

// Temporal placeholder banners used when admin hasn't set real ones yet
export const PLACEHOLDER_BANNERS = {
  main: [
    {
      id: 'ph-1',
      name: 'Summer Collection 2025',
      description: 'Discover our curated summer picks — fresh styles, unbeatable prices.',
      price: 0,
      images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80'],
      category: 'Fashion',
      avg_rating: 4.8,
      vendor: { store_name: 'Novara Picks', verified: true },
      _placeholder: true,
    },
    {
      id: 'ph-2',
      name: 'Tech Deals Week',
      description: 'Top gadgets and accessories at flash prices. Limited stock.',
      price: 0,
      images: ['https://images.unsplash.com/photo-1498049794561-7780e7231661?w=900&q=80'],
      category: 'Tech',
      avg_rating: 4.6,
      vendor: { store_name: 'Novara Tech', verified: true },
      _placeholder: true,
    },
    {
      id: 'ph-3',
      name: 'Beauty Essentials',
      description: 'Premium skincare and beauty products from verified vendors.',
      price: 0,
      images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900&q=80'],
      category: 'Beauty',
      avg_rating: 4.7,
      vendor: { store_name: 'Novara Beauty', verified: true },
      _placeholder: true,
    },
  ],
  sideTop: {
    id: 'ph-4',
    name: 'Flash Sale — 50% Off',
    description: 'Today only',
    price: 0,
    images: ['https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80'],
    category: 'Sale',
    vendor: { store_name: 'Novara Deals', verified: true },
    _placeholder: true,
  },
  sideBottom: {
    id: 'ph-5',
    name: 'New Arrivals',
    description: 'Fresh drops every day',
    price: 0,
    images: ['https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80'],
    category: 'New',
    vendor: { store_name: 'Novara', verified: true },
    _placeholder: true,
  },
}

export function useExplore(country = 'all') {
  const [products,       setProducts]       = useState([])
  const [heroMain,       setHeroMain]       = useState([])
  const [heroSideTop,    setHeroSideTop]    = useState(null)
  const [heroSideBottom, setHeroSideBottom] = useState(null)
  const [hotDeals,       setHotDeals]       = useState([])
  const [trending,       setTrending]       = useState([])
  const [newArrivals,    setNewArrivals]    = useState([])
  const [featuredVendors,setFeaturedVendors]= useState([])
  const [loading,        setLoading]        = useState(true)
  const [hasMore,        setHasMore]        = useState(true)
  const [page,           setPage]           = useState(0)
  const [error,          setError]          = useState(null)
  const channelRef = useRef(null)
  const supabase   = createClient()

  useEffect(() => {
    const init = async () => {
      try {
        const applyC = (q) => (country && country !== 'all') ? q.eq('vendor.business_country', country) : q
        const applyVC = (q) => (country && country !== 'all') ? q.eq('business_country', country) : q

        const [
          heroMainRes, heroTopRes, heroBottomRes,
          hotRes, trendingRes, newRes,
          vendorsRes, productsRes,
        ] = await Promise.all([
          applyC(supabase.from('products').select(PRODUCT_SELECT)
            .eq('is_hero', true).eq('hero_position', 'main').eq('is_active', true)
            .order('created_at', { ascending: false }).limit(5)),
          applyC(supabase.from('products').select(PRODUCT_SELECT)
            .eq('is_hero', true).eq('hero_position', 'side_top').eq('is_active', true).limit(1)),
          applyC(supabase.from('products').select(PRODUCT_SELECT)
            .eq('is_hero', true).eq('hero_position', 'side_bottom').eq('is_active', true).limit(1)),
          applyC(supabase.from('products').select(PRODUCT_SELECT)
            .eq('is_active', true).not('discount_price', 'is', null)
            .order('discount_price', { ascending: true }).limit(8)),
          applyC(supabase.from('products').select(PRODUCT_SELECT)
            .eq('is_active', true).order('total_sold', { ascending: false }).limit(10)),
          applyC(supabase.from('products').select(PRODUCT_SELECT)
            .eq('is_active', true).order('created_at', { ascending: false }).limit(10)),
          applyVC(supabase.from('vendors').select('id, store_name, logo_url, banner_url, verified, verification_status, trust_score, follower_count, store_category')
            .eq('is_active', true).eq('verified', true)
            .order('follower_count', { ascending: false }).limit(6)),
          applyC(supabase.from('products').select(PRODUCT_SELECT)
            .eq('is_active', true).order('created_at', { ascending: false })
            .range(0, PAGE_SIZE - 1)),
        ])

        // Use real data if available, fallback to placeholders
        setHeroMain(heroMainRes.data?.length ? heroMainRes.data : PLACEHOLDER_BANNERS.main)
        setHeroSideTop(heroTopRes.data?.[0] ?? PLACEHOLDER_BANNERS.sideTop)
        setHeroSideBottom(heroBottomRes.data?.[0] ?? PLACEHOLDER_BANNERS.sideBottom)
        setHotDeals(hotRes.data ?? [])
        setTrending(trendingRes.data ?? [])
        setNewArrivals(newRes.data ?? [])
        setFeaturedVendors(vendorsRes.data ?? [])
        setProducts(productsRes.data ?? [])
        if ((productsRes.data ?? []).length < PAGE_SIZE) setHasMore(false)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [country])

  // Realtime hero sync
  useEffect(() => {
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    const channel = supabase
      .channel('explore-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, async (payload) => {
        const n = payload.new
        // Refresh hero from DB when a product's hero status changes
        if (n.is_hero !== undefined) {
          let mainQ = supabase.from('products').select(PRODUCT_SELECT).eq('is_hero', true).eq('hero_position', 'main').eq('is_active', true).order('created_at', { ascending: false }).limit(5)
          let topQ = supabase.from('products').select(PRODUCT_SELECT).eq('is_hero', true).eq('hero_position', 'side_top').eq('is_active', true).limit(1)
          let bottomQ = supabase.from('products').select(PRODUCT_SELECT).eq('is_hero', true).eq('hero_position', 'side_bottom').eq('is_active', true).limit(1)
          
          if (country && country !== 'all') {
            mainQ = mainQ.eq('vendor.business_country', country)
            topQ = topQ.eq('vendor.business_country', country)
            bottomQ = bottomQ.eq('vendor.business_country', country)
          }

          const { data } = await mainQ
          if (data?.length) setHeroMain(data)

          const { data: top }    = await topQ
          const { data: bottom } = await bottomQ
          setHeroSideTop(top?.[0] ?? PLACEHOLDER_BANNERS.sideTop)
          setHeroSideBottom(bottom?.[0] ?? PLACEHOLDER_BANNERS.sideBottom)
        }
        // Update product in grids — remove it if it's no longer active
        if (n.is_active === false) {
          const remove = (prev) => prev.filter(p => p.id !== n.id)
          setProducts(remove)
          setHotDeals(remove)
          setTrending(remove)
          setNewArrivals(remove)
        } else {
          const sync = (prev) => prev.map(p => p.id === n.id ? { ...p, ...n } : p)
          setProducts(sync)
          setHotDeals(sync)
          setTrending(sync)
          setNewArrivals(sync)
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, async (payload) => {
        if (!payload.new.is_active) return
        let query = supabase.from('products').select(PRODUCT_SELECT).eq('id', payload.new.id)
        if (country && country !== 'all') query = query.eq('vendor.business_country', country)
        const { data } = await query.single()
        if (!data) return
        setProducts(prev  => [data, ...prev])
        setNewArrivals(prev => [data, ...prev.slice(0, 9)])
      })
      .subscribe()
    channelRef.current = channel
    return () => supabase.removeChannel(channel)
  }, [country])

  const loadMore = useCallback(async (filters = {}) => {
    if (!hasMore) return
    const next = page + 1
    const from = next * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1
    let q = supabase.from('products').select(PRODUCT_SELECT).eq('is_active', true).range(from, to)
    if (country && country !== 'all') q = q.eq('vendor.business_country', country)
    if (filters.category && filters.category !== 'all') q = q.eq('category', filters.category)
    if (filters.search)    q = q.ilike('name', `%${filters.search}%`)
    if (filters.minPrice)  q = q.gte('price', filters.minPrice)
    if (filters.maxPrice)  q = q.lte('price', filters.maxPrice)
    if (filters.inStock)   q = q.gt('stock_quantity', 0)
    if (filters.sort === 'price_asc')  q = q.order('price',       { ascending: true  })
    else if (filters.sort === 'price_desc') q = q.order('price',  { ascending: false })
    else if (filters.sort === 'popular')    q = q.order('total_sold', { ascending: false })
    else if (filters.sort === 'rating')     q = q.order('avg_rating', { ascending: false })
    else q = q.order('created_at', { ascending: false })
    const { data } = await q
    if ((data ?? []).length < PAGE_SIZE) setHasMore(false)
    setProducts(prev => [...prev, ...(data ?? [])])
    setPage(next)
  }, [page, hasMore, country])

  const filterProducts = useCallback(async (filters = {}) => {
    setLoading(true); setPage(0); setHasMore(true)
    let q = supabase.from('products').select(PRODUCT_SELECT).eq('is_active', true).range(0, PAGE_SIZE - 1)
    if (country && country !== 'all') q = q.eq('vendor.business_country', country)
    if (filters.category && filters.category !== 'all') q = q.eq('category', filters.category)
    if (filters.search)    q = q.ilike('name', `%${filters.search}%`)
    if (filters.minPrice)  q = q.gte('price', filters.minPrice)
    if (filters.maxPrice)  q = q.lte('price', filters.maxPrice)
    if (filters.inStock)   q = q.gt('stock_quantity', 0)
    if (filters.sort === 'price_asc')  q = q.order('price',       { ascending: true  })
    else if (filters.sort === 'price_desc') q = q.order('price',  { ascending: false })
    else if (filters.sort === 'popular')    q = q.order('total_sold', { ascending: false })
    else if (filters.sort === 'rating')     q = q.order('avg_rating', { ascending: false })
    else q = q.order('created_at', { ascending: false })
    const { data } = await q
    setProducts(data ?? [])
    if ((data ?? []).length < PAGE_SIZE) setHasMore(false)
    setLoading(false)
  }, [country])

  return {
    products, heroMain, heroSideTop, heroSideBottom,
    hotDeals, trending, newArrivals, featuredVendors,
    loading, hasMore, error,
    loadMore, filterProducts,
  }
}