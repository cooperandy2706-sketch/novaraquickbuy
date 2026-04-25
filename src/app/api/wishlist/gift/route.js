import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req) {
  try {
    const supabase = createClient()
    const {
      item_id, list_id, gifter_id, gifter_name,
      order_id, amount, currency, message,
    } = await req.json()

    if (!item_id || !list_id) {
      return NextResponse.json({ error: 'item_id and list_id required' }, { status: 400 })
    }

    const { error } = await supabase.rpc('record_wishlist_gift', {
      p_item_id:     item_id,
      p_list_id:     list_id,
      p_gifter_id:   gifter_id ?? null,
      p_gifter_name: gifter_name ?? 'Anonymous',
      p_order_id:    order_id ?? null,
      p_amount:      amount,
      p_currency:    currency ?? 'GHS',
      p_message:     message ?? null,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
