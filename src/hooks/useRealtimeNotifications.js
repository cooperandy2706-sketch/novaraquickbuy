'use client'
// FILE: src/hooks/useRealtimeNotifications.js
//
// Subscribes to Supabase Realtime for:
//   • New orders       → notify vendor
//   • New messages     → increment unread count
//   • Order status changes → notify vendor
//
// Call this once inside the vendor layout or a top-level provider.

import { useEffect, useRef } from 'react'
import { createClient }      from '@/lib/supabase/client'
import { useNotificationStore } from '@/store/notificationStore'

export function useRealtimeNotifications(vendorId) {
  const supabase      = createClient()
  const addNotif      = useNotificationStore(s => s.addNotification)
  const channelRef    = useRef(null)

  useEffect(() => {
    if (!vendorId) return

    // Clean up any existing subscription first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`vendor-notifications:${vendorId}`)

      // ── New order placed ──────────────────────────────────────────────────────
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'orders',
        filter: `vendor_id=eq.${vendorId}`,
      }, (payload) => {
        addNotif({
          id:      payload.new.id,
          type:    'new_order',
          title:   'New Order',
          message: `Order #${payload.new.id.slice(0, 8).toUpperCase()} received`,
          amount:  payload.new.total_amount,
          href:    `/vendor/orders/${payload.new.id}`,
          at:      new Date().toISOString(),
        })
      })

      // ── Order status changed ──────────────────────────────────────────────────
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'orders',
        filter: `vendor_id=eq.${vendorId}`,
      }, (payload) => {
        const { id, status } = payload.new
        const prev           = payload.old?.status

        if (status === prev) return // no status change

        const labels = {
          delivered: { title: 'Order Delivered',  message: `Order #${id.slice(0,8).toUpperCase()} has been delivered` },
          completed: { title: 'Order Completed',  message: `Payment released for order #${id.slice(0,8).toUpperCase()}` },
          disputed:  { title: 'Dispute Opened',   message: `Buyer opened a dispute on order #${id.slice(0,8).toUpperCase()}` },
          cancelled: { title: 'Order Cancelled',  message: `Order #${id.slice(0,8).toUpperCase()} was cancelled` },
        }

        const label = labels[status]
        if (!label) return // don't notify for every intermediate status

        addNotif({
          id:      `${id}-${status}`,
          type:    `order_${status}`,
          title:   label.title,
          message: label.message,
          href:    `/vendor/orders/${id}`,
          at:      new Date().toISOString(),
        })
      })

      // ── New message received ──────────────────────────────────────────────────
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'messages',
        filter: `vendor_id=eq.${vendorId}`,
      }, (payload) => {
        // Don't count vendor's own messages
        if (payload.new.sender_role === 'vendor') return

        addNotif({
          id:      payload.new.id,
          type:    'new_message',
          title:   'New Message',
          message: payload.new.content?.slice(0, 60) ?? 'You have a new message',
          href:    `/vendor/chat/${payload.new.order_id}`,
          at:      new Date().toISOString(),
        })
      })

      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [vendorId])
}