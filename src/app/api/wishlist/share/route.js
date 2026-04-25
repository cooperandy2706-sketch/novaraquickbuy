import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { list_id, platform } = await req.json()
    if (!list_id) return NextResponse.json({ error: 'list_id required' }, { status: 400 })

    await supabase.rpc('record_wishlist_share', {
      p_user_id:  user.id,
      p_list_id:  list_id,
      p_platform: platform ?? 'copy_link',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
