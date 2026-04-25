// FILE: src/lib/realtime.js
'use client'

import { createClient } from '@/lib/supabase/client'

export const subscribeToTable = (table, filterCol, filterVal, onInsert, event = 'INSERT') => {
  const supabase = createClient()
  const channel  = supabase
    .channel(`${table}:${filterCol}:${filterVal}`)
    .on('postgres_changes', {
      event, schema: 'public', table,
      filter: `${filterCol}=eq.${filterVal}`,
    }, (payload) => {
      event === 'INSERT' ? onInsert(payload.new) : onInsert(payload)
    })
    .subscribe()
  return channel
}

export const subscribeToOrderStatus = (orderId, onChange) => {
  const supabase = createClient()
  return supabase
    .channel(`order:status:${orderId}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'orders',
      filter: `id=eq.${orderId}`,
    }, (payload) => onChange(payload.new))
    .subscribe()
}

export const subscribeToVendorOrders = (vendorId, onNew) => {
  const supabase = createClient()
  return supabase
    .channel(`vendor:orders:${vendorId}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'orders',
      filter: `vendor_id=eq.${vendorId}`,
    }, (payload) => onNew(payload.new))
    .subscribe()
}

export const subscribeToNotifications = (userId, onNew) => {
  const supabase = createClient()
  return supabase
    .channel(`notifications:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, (payload) => onNew(payload.new))
    .subscribe()
}

export const unsubscribe = (channel) => {
  if (!channel) return
  createClient().removeChannel(channel)
}