'use client'
// FILE: src/hooks/useWishlist.js
// All wishlist hooks.
//
// Exports:
//   useMyWishlists       — auth user's full list collection
//   useWishlistDetail    — single list + items (owner view)
//   usePublicWishlist    — public share page (no auth required)
//   useWishlistPoints    — points balance + event history
//   useWishlistQuickAdd  — drop-in hook for "add to wishlist" button on product pages
//   addToWishlist        — standalone utility

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore }  from '@/store/authStore'
import { useWishlistStore } from '@/store/wishlistStore'

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

export const LIST_TYPE_CONFIG = {
  general:        { label: 'General',        emoji: '✨', gradient: 'from-emerald-900 to-emerald-600',   accent: '#16A34A', bg: 'rgba(22, 163, 74, 0.15)' },
  birthday:       { label: 'Birthday',       emoji: '🎂', gradient: 'from-orange-800 to-rose-600',       accent: '#EA580C', bg: 'rgba(234, 88, 12, 0.15)' },
  wedding:        { label: 'Wedding',        emoji: '💍', gradient: 'from-purple-900 to-purple-600',     accent: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)' },
  baby_shower:    { label: 'Baby Shower',    emoji: '🍼', gradient: 'from-sky-800 to-blue-500',          accent: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
  home:           { label: 'Home',           emoji: '🏡', gradient: 'from-teal-900 to-emerald-600',      accent: '#0D9488', bg: 'rgba(13, 148, 136, 0.15)' },
  travel:         { label: 'Travel',         emoji: '✈️',  gradient: 'from-cyan-900 to-sky-600',         accent: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.15)' },
  fashion:        { label: 'Fashion',        emoji: '👗', gradient: 'from-rose-800 to-pink-600',         accent: '#F43F5E', bg: 'rgba(244, 63, 94, 0.15)' },
  tech:           { label: 'Tech',           emoji: '💻', gradient: 'from-indigo-900 to-violet-700',     accent: '#6366F1', bg: 'rgba(99, 102, 241, 0.15)' },
  secret:         { label: 'Secret',         emoji: '🔒', gradient: 'from-neutral-900 to-neutral-700',   accent: '#64748B', bg: 'rgba(100, 116, 139, 0.15)' },
  holiday:        { label: 'Holiday',        emoji: '🎄', gradient: 'from-red-900 to-red-700',           accent: '#DC2626', bg: 'rgba(220, 38, 38, 0.15)' },
  graduation:     { label: 'Graduation',     emoji: '🎓', gradient: 'from-yellow-800 to-amber-600',      accent: '#D97706', bg: 'rgba(217, 119, 6, 0.15)' },
  anniversary:    { label: 'Anniversary',    emoji: '❤️',  gradient: 'from-red-800 to-rose-600',         accent: '#E11D48', bg: 'rgba(225, 29, 72, 0.15)' },
  back_to_school: { label: 'Back to School', emoji: '🎒', gradient: 'from-blue-900 to-blue-600',         accent: '#2563EB', bg: 'rgba(37, 99, 235, 0.15)' },
  self_care:      { label: 'Self Care',      emoji: '🧴', gradient: 'from-pink-900 to-fuchsia-600',      accent: '#D946EF', bg: 'rgba(217, 70, 239, 0.15)' },
}

export const POINT_VALUES = {
  list_shared:        10,
  first_share:        15,
  item_voted:         5,
  gift_received:      50,
  friend_joined:      20,
  friend_purchased:   25,
  list_completed:     100,
  streak_bonus:       25,
  milestone_10_votes: 30,
  referral_purchase:  25,
  list_copied:        10,
}

export const LEVEL_THRESHOLDS = [0, 50, 150, 250, 400, 700, 1000, 1500, 2500, 5000]
export const LEVEL_TITLES = [
  '', 'Wishmaker', 'Dreamer', 'Curator', 'Trendsetter',
  'Influencer', 'Tastemaker', 'Connoisseur', 'Icon', 'Legend', 'Supreme'
]


// ─────────────────────────────────────────────────────────────
// useMyWishlists
// ─────────────────────────────────────────────────────────────

export function useMyWishlists() {
  const [lists,   setLists]   = useState([])
  const [points,  setPoints]  = useState(null)
  const [loading, setLoading] = useState(true)
  const { user }  = useAuthStore()
  const supabase  = createClient()

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)

    const [listsRes, pointsRes] = await Promise.all([
      supabase
        .from('wishlist_lists')
        .select(`
          id, name, description, list_type, privacy, cover_image,
          cover_color, emoji, share_code, share_count, view_count,
          event_date, event_title, item_count, vote_count, gift_count,
          copy_count, is_archived, is_completed, created_at, updated_at,
          items:wishlist_items (
            id, product_name, product_image, product_price, currency,
            vote_count, is_purchased, priority, position, vendor_name
          )
        `)
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false }),

      supabase
        .from('wishlist_points')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    if (listsRes.data) setLists(listsRes.data)
    if (pointsRes.data) setPoints(pointsRes.data)
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    fetchAll()
    if (!user) return

    const ch = supabase
      .channel(`my-wishlists:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist_lists', filter: `user_id=eq.${user.id}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist_points', filter: `user_id=eq.${user.id}` }, fetchAll)
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [user?.id])

  const createList = useCallback(async (data) => {
    if (!user) return null
    const payload = { ...data, user_id: user.id }
    if (payload.event_date === '') payload.event_date = null
    
    const { data: list, error } = await supabase
      .from('wishlist_lists')
      .insert(payload)
      .select('id, name, share_code')
      .single()
    
    if (error) console.error('Error creating wishlist:', error)
    if (!error) fetchAll()
    return error ? null : list
  }, [user?.id, fetchAll])

  const updateList = useCallback(async (id, data) => {
    const payload = { ...data, updated_at: new Date().toISOString() }
    if (payload.event_date === '') payload.event_date = null
    
    const { error } = await supabase
      .from('wishlist_lists')
      .update(payload)
      .eq('id', id).eq('user_id', user?.id)
      
    if (error) console.error('Error updating wishlist:', error)
    fetchAll()
  }, [user?.id, fetchAll])

  const deleteList = useCallback(async (id) => {
    await supabase.from('wishlist_lists').delete().eq('id', id).eq('user_id', user?.id)
    setLists(p => p.filter(l => l.id !== id))
  }, [user?.id])

  const archiveList = useCallback(async (id) => {
    await supabase.from('wishlist_lists').update({ is_archived: true }).eq('id', id).eq('user_id', user?.id)
    setLists(p => p.filter(l => l.id !== id))
  }, [user?.id])

  const recordShare = useCallback(async (listId, platform = 'copy_link') => {
    if (!user?.id || !listId) return
    await supabase.rpc('record_wishlist_share', { p_user_id: user.id, p_list_id: listId, p_platform: platform })
  }, [user?.id])

  return {
    lists, points, loading,
    createList, updateList, deleteList, archiveList, recordShare,
    refetch: fetchAll,
  }
}


// ─────────────────────────────────────────────────────────────
// useWishlistDetail
// ─────────────────────────────────────────────────────────────

export function useWishlistDetail(listId) {
  const [list,    setList]    = useState(null)
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const { user }  = useAuthStore()
  const supabase  = createClient()

  const fetchAll = useCallback(async () => {
    if (!listId) return
    setLoading(true)

    const [listRes, itemsRes] = await Promise.all([
      supabase.from('wishlist_lists').select('*').eq('id', listId).single(),
      supabase.from('wishlist_items').select('*').eq('list_id', listId).order('position', { ascending: true }),
    ])

    if (listRes.error) { setError('List not found'); setLoading(false); return }
    setList(listRes.data)
    setItems(itemsRes.data ?? [])
    setLoading(false)
  }, [listId])

  useEffect(() => {
    fetchAll()
    const ch = supabase
      .channel(`wishlist-detail:${listId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist_items', filter: `list_id=eq.${listId}` }, fetchAll)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'wishlist_lists', filter: `id=eq.${listId}` }, (p) => setList(prev => ({ ...prev, ...p.new })))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [listId])

  const addItem = useCallback(async (product) => {
    if (!user || !list) return null
    const { data, error } = await supabase
      .from('wishlist_items')
      .insert({
        list_id: listId, user_id: user.id,
        product_id:    product.product_id ?? null,
        product_name:  product.name,
        product_image: product.image_url ?? null,
        product_price: product.price,
        currency:      product.currency ?? 'GHS',
        vendor_id:     product.vendor_id ?? null,
        vendor_name:   product.vendor_name ?? null,
        variant_label: product.variant_label ?? null,
        note:          product.note ?? null,
        product_url:   product.product_url ?? `/product/${product.product_id}`,
        priority:      product.priority ?? 0,
        position:      items.length,
      })
      .select().single()
    if (!error) setItems(p => [...p, data])
    return error ? null : data
  }, [user?.id, listId, list, items.length])

  const removeItem = useCallback(async (itemId) => {
    await supabase.from('wishlist_items').delete().eq('id', itemId).eq('user_id', user?.id)
    setItems(p => p.filter(i => i.id !== itemId))
  }, [user?.id])

  const updateItem = useCallback(async (itemId, data) => {
    await supabase.from('wishlist_items').update(data).eq('id', itemId)
    setItems(p => p.map(i => i.id === itemId ? { ...i, ...data } : i))
  }, [])

  const moveItem = useCallback(async (itemId, toListId) => {
    await supabase.from('wishlist_items').update({ list_id: toListId }).eq('id', itemId)
    setItems(p => p.filter(i => i.id !== itemId))
  }, [])

  const shareList = useCallback(async (platform = 'copy_link') => {
    if (!user?.id || !list) return
    await supabase.rpc('record_wishlist_share', {
      p_user_id: user.id, p_list_id: listId, p_platform: platform,
    })
  }, [user?.id, listId, list])

  return {
    list, items, loading, error,
    addItem, removeItem, updateItem, moveItem, shareList,
    refetch: fetchAll,
    isOwner: list?.user_id === user?.id,
  }
}


// ─────────────────────────────────────────────────────────────
// usePublicWishlist  (share page — no auth required)
// ─────────────────────────────────────────────────────────────

export function usePublicWishlist(shareCode) {
  const [list,    setList]    = useState(null)
  const [items,   setItems]   = useState([])
  const [owner,   setOwner]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [myVotes, setMyVotes] = useState(new Set())
  const { user }  = useAuthStore()
  const supabase  = createClient()
  const viewedRef = useRef(false)

  // Session key for anonymous voters
  const sessionKey = useRef(
    typeof window !== 'undefined'
      ? (localStorage.getItem('novara_session') ?? (() => {
          const k = Math.random().toString(36).slice(2)
          localStorage.setItem('novara_session', k)
          return k
        })())
      : null
  )

  useEffect(() => {
    if (!shareCode) return
    ;(async () => {
      const { data: listData } = await supabase
        .from('wishlist_lists')
        .select('*')
        .eq('share_code', shareCode)
        .in('privacy', ['public', 'friends_only'])
        .single()

      if (!listData) { setError('Wishlist not found or private'); setLoading(false); return }
      setList(listData)

      const [itemsRes, ownerRes] = await Promise.all([
        supabase.from('wishlist_items').select('*').eq('list_id', listData.id).order('position', { ascending: true }),
        supabase.from('users').select('id, full_name, avatar_url').eq('id', listData.user_id).maybeSingle(),
      ])

      setItems(itemsRes.data ?? [])
      setOwner(ownerRes.data)

      // Track view once
      if (!viewedRef.current) {
        viewedRef.current = true
        supabase.from('wishlist_lists').update({ view_count: (listData.view_count ?? 0) + 1 }).eq('id', listData.id).then(() => {})
      }

      // Load my votes
      if (user?.id || sessionKey.current) {
        const voteFilter = user?.id
          ? supabase.from('wishlist_votes').select('item_id').eq('voter_id', user.id).in('item_id', (itemsRes.data ?? []).map(i => i.id))
          : supabase.from('wishlist_votes').select('item_id').eq('session_key', sessionKey.current).in('item_id', (itemsRes.data ?? []).map(i => i.id))
        const { data: votes } = await voteFilter
        if (votes) setMyVotes(new Set(votes.map(v => v.item_id)))
      }

      setLoading(false)
    })()
  }, [shareCode, user?.id])

  // Realtime votes
  useEffect(() => {
    if (!list?.id) return
    const ch = supabase
      .channel(`public-wishlist:${list.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist_items', filter: `list_id=eq.${list.id}` }, (p) => {
        if (p.eventType === 'UPDATE') setItems(prev => prev.map(i => i.id === p.new.id ? { ...i, ...p.new } : i))
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [list?.id])

  const vote = useCallback(async (itemId) => {
    const { data, error } = await supabase.rpc('vote_wishlist_item', {
      p_item_id:    itemId,
      p_voter_id:   user?.id ?? null,
      p_voter_name: user ? (user.user_metadata?.full_name ?? 'Anonymous') : 'Anonymous',
      p_session_key: sessionKey.current,
    })

    if (!error && data?.success) {
      const voted = data.voted
      setMyVotes(prev => {
        const next = new Set(prev)
        voted ? next.add(itemId) : next.delete(itemId)
        return next
      })
      setItems(prev => prev.map(i =>
        i.id === itemId ? { ...i, vote_count: i.vote_count + (voted ? 1 : -1) } : i
      ))
      return voted
    }
    return null
  }, [user?.id])

  const recordShare = useCallback(async (platform) => {
    if (!user?.id || !list) return
    await supabase.rpc('record_wishlist_share', { p_user_id: user.id, p_list_id: list.id, p_platform: platform })
  }, [user?.id, list])

  const copyList = useCallback(async () => {
    if (!user?.id || !list) return null
    const { data, error } = await supabase.rpc('copy_wishlist', {
      p_source_list_id: list.id,
      p_new_user_id:    user.id,
    })
    return error ? null : data
  }, [user?.id, list])

  return {
    list, items, owner, loading, error, myVotes,
    vote, recordShare, copyList,
    isOwner: list?.user_id === user?.id,
  }
}


// ─────────────────────────────────────────────────────────────
// useWishlistPoints
// ─────────────────────────────────────────────────────────────

export function useWishlistPoints() {
  const [points, setPoints] = useState(null)
  const [events, setEvents] = useState([])
  const { user }  = useAuthStore()
  const supabase  = createClient()

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('wishlist_points').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('wishlist_point_events').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    ]).then(([p, e]) => {
      if (p.data) setPoints(p.data)
      if (e.data) setEvents(e.data)
    })

    const ch = supabase
      .channel(`wishlist-points:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist_points', filter: `user_id=eq.${user.id}` }, (p) => setPoints(prev => ({ ...prev, ...p.new })))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wishlist_point_events', filter: `user_id=eq.${user.id}` }, (p) => setEvents(prev => [p.new, ...prev]))
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [user?.id])

  const levelProgress = useMemo(() => {
    if (!points) return { pct: 0, current: 0, next: 50, level: 1 }
    const lvl     = points.level ?? 1
    const current = LEVEL_THRESHOLDS[lvl - 1] ?? 0
    const next    = LEVEL_THRESHOLDS[lvl]     ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
    const pct     = next === current ? 100 : Math.round(((points.total_points - current) / (next - current)) * 100)
    return { pct: Math.min(100, pct), current, next, level: lvl }
  }, [points])

  return { points, events, levelProgress }
}


// ─────────────────────────────────────────────────────────────
// useWishlistQuickAdd
// Drop-in hook for product pages — picks up user's lists,
// lets them add to an existing list or create new one.
// ─────────────────────────────────────────────────────────────

export function useWishlistQuickAdd(product) {
  const [lists,   setLists]   = useState([])
  const [loading, setLoading] = useState(false)
  const [open,    setOpen]    = useState(false)
  const [saving,  setSaving]  = useState(null)   // listId being saved to
  const [success, setSuccess] = useState(null)   // listId saved to
  const { user }  = useAuthStore()
  const wishStore = useWishlistStore()
  const supabase  = createClient()

  useEffect(() => {
    if (!user || !open) return
    setLoading(true)
    supabase
      .from('wishlist_lists')
      .select('id, name, emoji, list_type, item_count, cover_color')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        setLists(data ?? [])
        setLoading(false)
      })
  }, [user?.id, open])

  const addToList = useCallback(async (listId) => {
    if (!user || !product) return
    setSaving(listId)

    const { error } = await supabase
      .from('wishlist_items')
      .insert({
        list_id:       listId,
        user_id:       user.id,
        product_id:    product.id ?? product.product_id,
        product_name:  product.name,
        product_image: product.image_url ?? product.images?.[0] ?? null,
        product_price: product.price,
        currency:      product.currency ?? 'GHS',
        vendor_id:     product.vendor_id ?? null,
        vendor_name:   product.vendor_name ?? null,
        variant_label: product.variant_label ?? null,
        product_url:   `/product/${product.id ?? product.product_id}`,
        position:      999,
      })

    setSaving(null)
    if (!error) {
      setSuccess(listId)
      wishStore.markAdded(product.id ?? product.product_id, listId)
      wishStore.setLastList(listId, lists.find(l => l.id === listId)?.name ?? 'Wishlist')
      setTimeout(() => { setSuccess(null); setOpen(false) }, 1200)
    }
  }, [user?.id, product, lists, wishStore])

  const alreadyAdded = wishStore.isAdded(product?.id ?? product?.product_id ?? '')

  return {
    open, setOpen,
    lists, loading,
    saving, success,
    addToList,
    alreadyAdded,
    isAuthenticated: !!user,
  }
}


// ─────────────────────────────────────────────────────────────
// Standalone utility
// ─────────────────────────────────────────────────────────────

export async function addToWishlist(supabase, userId, listId, product) {
  return supabase.from('wishlist_items').insert({
    list_id:       listId,
    user_id:       userId,
    product_id:    product.product_id ?? product.id ?? null,
    product_name:  product.name,
    product_image: product.image_url ?? product.images?.[0] ?? null,
    product_price: product.price,
    currency:      product.currency ?? 'GHS',
    vendor_id:     product.vendor_id ?? null,
    vendor_name:   product.vendor_name ?? null,
    variant_label: product.variant_label ?? null,
    product_url:   `/product/${product.product_id ?? product.id}`,
    position:      999,
  }).select().single()
}