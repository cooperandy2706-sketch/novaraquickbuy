// FILE: src/app/(vendor)/layout.jsx
//
// FIX: Removed the !vendor.onboarding_complete → redirect('/vendor/onboarding')
// check that was causing an infinite loop.
//
// WHY IT LOOPED:
//   This layout wraps ALL /vendor/* routes including /vendor/onboarding.
//   The old check redirected to /vendor/onboarding when onboarding_complete=false,
//   but since /vendor/onboarding is INSIDE this layout, the layout ran again,
//   saw onboarding_complete=false, redirected again → infinite loop.
//
// WHO HANDLES ONBOARDING ROUTING NOW:
//   proxy.js (middleware) already handles this correctly with the DB fallback.
//   It runs BEFORE the layout and correctly allows /vendor/onboarding through
//   when onboarding_complete=false. The layout just needs to stay out of the way.

import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import VendorSidebar      from '@/components/layout/vendor/VendorSidebar'
import VendorHeader       from '@/components/layout/vendor/VendorHeader'
import VendorBottomNav    from '@/components/layout/vendor/VendorBottomNav'
import VendorMobileDrawer from '@/components/layout/vendor/VendorMobileDrawer'
import VendorLayoutShell  from '@/components/layout/vendor/VendorLayoutShell'

export default async function VendorLayout({ children }) {
  const supabase = await createClient()

  // ── Must be logged in ─────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/vendor/dashboard')

  // ── Must be a vendor ──────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'vendor') redirect('/feed')

  // ── Must have a vendor row ────────────────────────────────────────────────
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, onboarding_complete, store_status')
    .eq('user_id', user.id)
    .maybeSingle()

  // No vendor row → onboarding will create one
  if (!vendor) redirect('/vendor/onboarding')

  // Deactivated → buyer feed
  if (vendor.store_status === 'deactivated') redirect('/feed')

  // NOTE: No onboarding_complete check here.
  // The middleware (proxy.js) handles routing vendors to /vendor/onboarding
  // when onboarding is incomplete. Checking it here too caused an infinite
  // redirect loop because this layout wraps /vendor/onboarding itself.

  return (
    <div className="min-h-dvh bg-surface">
      <VendorSidebar />
      <VendorMobileDrawer />
      <VendorLayoutShell>
        <VendorHeader />
        <main className="
          px-4 sm:px-6 py-6
          pb-[calc(var(--bottom-nav-h,4rem)+1.5rem)]
          md:pb-8
          max-w-7xl mx-auto
        ">
          {children}
        </main>
      </VendorLayoutShell>
      <VendorBottomNav />
    </div>
  )
}