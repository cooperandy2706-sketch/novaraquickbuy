'use client'
// FILE: src/app/w/[shareCode]/page.jsx
// PUBLIC wishlist share page.
// No auth required to view or vote.
// Full NovaPay gift checkout integration.

import { useParams }         from 'next/navigation'
import { usePublicWishlist } from '@/hooks/useWishlist'
import { useAuthStore }      from '@/store/authStore'
import WishlistShareCard     from '@/components/wishlist/WishlistShareCard'
import { Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function PublicWishlistPage() {
  const { shareCode } = useParams()
  const { user }      = useAuthStore()

  const {
    list, items, owner, loading, error,
    myVotes, vote, recordShare, copyList, isOwner,
  } = usePublicWishlist(shareCode)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-1">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={28} className="text-brand animate-spin" />
          <p className="text-sm text-secondary">Loading wishlist…</p>
        </div>
      </div>
    )
  }

  if (error || !list) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-surface-1">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-3xl bg-surface-2 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <AlertCircle size={24} className="text-muted" />
          </div>
          <h2 className="text-lg font-black text-primary mb-2">Wishlist not found</h2>
          <p className="text-sm text-secondary mb-6 leading-relaxed">
            This wishlist may be private, deleted, or the link may be incorrect.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 text-white text-sm font-bold rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #052E16, #16A34A)' }}
          >
            Go to Novara
          </Link>
        </div>
      </div>
    )
  }

  return (
    <WishlistShareCard
      list={list}
      items={items}
      owner={owner}
      myVotes={myVotes}
      onVote={vote}
      onShare={recordShare}
      onCopyList={copyList}
      isAuthenticated={!!user}
      isOwner={isOwner}
    />
  )
}

