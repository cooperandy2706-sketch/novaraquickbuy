import { ImageResponse } from 'next/og'
import { createClient }   from '@/lib/supabase/server'
import { LIST_TYPE_CONFIG } from '@/hooks/useWishlist'

export const runtime = 'edge'
export const alt = 'Novara Wishlist'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const formatCurrency = (n, cur = 'GHS') => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: cur,
  }).format(n)
}

export default async function Image({ params }) {
  const { sharecode } = await params
  const supabase = await createClient()

  // 1. Fetch Wishlist & Items
  const { data: list } = await supabase
    .from('wishlist_lists')
    .select('id, name, emoji, list_type, share_code')
    .eq('share_code', sharecode)
    .single()

  if (!list) return new Response('Not found', { status: 404 })

  const { data: items } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('list_id', list.id)
    .order('vote_count', { ascending: false })
    .limit(4)

  const cfg = LIST_TYPE_CONFIG[list.list_type] ?? LIST_TYPE_CONFIG.general
  const bgColor = cfg.bg || '#064e3b'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `radial-gradient(at 0% 0%, ${cfg.accent || '#10b981'}bb 0px, transparent 50%),
                       radial-gradient(at 100% 0%, ${cfg.accent || '#10b981'}99 0px, transparent 50%),
                       radial-gradient(at 0% 100%, ${cfg.accent || '#10b981'}77 0px, transparent 50%),
                       ${bgColor}`,
          padding: '60px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Main Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '60px',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            padding: '60px',
            position: 'relative',
            boxShadow: '0 40px 100px -20px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '50px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.1)', padding: '10px 24px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '28px' }}>{list.emoji || '🎁'}</span>
                <span style={{ fontSize: '20px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '3px' }}>Exclusive Drop</span>
              </div>
              <h1 style={{ fontSize: '96px', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1, fontStyle: 'italic', letterSpacing: '-4px' }}>{list.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px 16px', borderRadius: '12px', width: 'fit-content' }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '2px' }}>Wishlist curated on QuickBuy</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                    <span style={{ color: cfg.accent || '#10b981', fontSize: '32px', fontWeight: 900 }}>QB</span>
                </div>
                <span style={{ fontSize: '22px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginTop: '20px', letterSpacing: '1px' }}>novara.me/w/{list.share_code}</span>
            </div>
          </div>

          {/* ASYMMETRIC MOSAIC */}
          <div style={{ display: 'flex', gap: '30px', flex: 1, minHeight: 0 }}>
            {items && items.length > 0 ? (
              <>
                {/* Featured Item (Left) */}
                <div style={{ flex: 1.6, display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: '44px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative' }}>
                  {items[0].product_image ? (
                    <img src={items[0].product_image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '100px', opacity: 0.1 }}>{list.emoji || '📦'}</div>
                  )}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '24px', fontWeight: 900, color: 'white', textTransform: 'uppercase', marginBottom: '8px' }}>{items[0].product_name}</span>
                    <span style={{ fontSize: '32px', fontWeight: 900, color: 'white', opacity: 0.8 }}>{formatCurrency(items[0].product_price, items[0].currency)}</span>
                  </div>
                </div>

                {/* Sidebar Column (Right) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  {items.slice(1, 3).map((item, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative' }}>
                      {item.product_image ? (
                        <img src={item.product_image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px', opacity: 0.1 }}>{list.emoji || '📦'}</div>
                      )}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ fontSize: '18px', fontWeight: 900, color: 'white', opacity: 0.9 }}>{formatCurrency(item.product_price, item.currency)}</span>
                      </div>
                    </div>
                  ))}
                  
                  {items.length > 3 && (
                    <div style={{ height: '120px', display: 'flex', background: 'rgba(255,255,255,0.15)', borderRadius: '32px', border: '2px dashed rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        <span style={{ fontSize: '32px', fontWeight: 900, color: 'white' }}>+{items.length - 3}</span>
                        <span style={{ fontSize: '14px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '4px' }}>Items</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: '36px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '44px' }}>
                No items added yet... 📦
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
