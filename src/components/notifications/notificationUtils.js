// FILE: src/components/notifications/notificationUtils.js
// Shared helpers for rendering notification types.

export function getNotifIcon(type) {
  const map = {
    order_placed:            '🛒',
    order_confirmed:         '✅',
    order_shipped:           '🚚',
    order_out_for_delivery:  '🏃',
    order_delivered:         '📦',
    order_cancelled:         '❌',
    order_refunded:          '💸',
    payment_received:        '💰',
    payment_failed:          '⚠️',
    payment_released:        '🏦',
    payment_disputed:        '⚖️',
    price_drop:              '🏷️',
    back_in_stock:           '🔔',
    wishlist_gifted:         '🎁',
    wishlist_vote:           '❤️',
    new_message:             '💬',
    circle_message:          '👥',
    new_follower:            '👤',
    vendor_post:             '📢',
    review_received:         '⭐',
    review_reply:            '↩️',
    system_announcement:     '📣',
    account_verified:        '✓',
    promo:                   '🎉',
  }
  return map[type] ?? '🔔'
}

export function getNotifColor(type) {
  const green  = { bg: 'bg-brand-50',   text: 'text-brand',   dot: 'bg-brand'   }
  const blue   = { bg: 'bg-blue-50',    text: 'text-blue-600', dot: 'bg-blue-500' }
  const amber  = { bg: 'bg-amber-50',   text: 'text-amber-600',dot: 'bg-amber-500'}
  const red    = { bg: 'bg-red-50',     text: 'text-red-600',  dot: 'bg-red-500'  }
  const purple = { bg: 'bg-purple-50',  text: 'text-purple-600',dot:'bg-purple-500'}
  const neutral= { bg: 'bg-neutral-100',text: 'text-neutral-600',dot:'bg-neutral-500'}

  const map = {
    order_placed:            green,
    order_confirmed:         green,
    order_shipped:           blue,
    order_out_for_delivery:  blue,
    order_delivered:         green,
    order_cancelled:         red,
    order_refunded:          amber,
    payment_received:        green,
    payment_failed:          red,
    payment_released:        green,
    payment_disputed:        red,
    price_drop:              amber,
    back_in_stock:           green,
    wishlist_gifted:         purple,
    wishlist_vote:           red,
    new_message:             blue,
    circle_message:          blue,
    new_follower:            green,
    vendor_post:             amber,
    review_received:         amber,
    review_reply:            amber,
    system_announcement:     neutral,
    account_verified:        green,
    promo:                   purple,
  }
  return map[type] ?? neutral
}

export function getNotifCategory(type) {
  if (type?.startsWith('order_'))    return 'Orders'
  if (type?.startsWith('payment_'))  return 'Payments'
  if (type?.startsWith('wishlist_') || type === 'price_drop' || type === 'back_in_stock') return 'Wishlist'
  if (type === 'new_message' || type === 'circle_message') return 'Messages'
  if (type === 'review_received' || type === 'review_reply') return 'Reviews'
  if (type === 'new_follower' || type === 'vendor_post') return 'Social'
  return 'General'
}

export function timeAgo(iso) {
  if (!iso) return ''
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60)     return 'just now'
  if (s < 3600)   return `${Math.floor(s / 60)}m ago`
  if (s < 86400)  return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}