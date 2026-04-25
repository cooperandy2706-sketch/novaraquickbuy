import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { source_list_id, new_name } = await req.json()
    if (!source_list_id) return NextResponse.json({ error: 'source_list_id required' }, { status: 400 })

    const { data, error } = await supabase.rpc('copy_wishlist', {
      p_source_list_id: source_list_id,
      p_new_user_id:    user.id,
      p_new_name:       new_name ?? null,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, new_list_id: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
