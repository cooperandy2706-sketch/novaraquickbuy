// FILE: src/app/(admin)/layout.jsx
import { redirect }      from 'next/navigation'
import { createClient }  from '@/lib/supabase/server'
import AdminSidebar      from '@/components/layout/admin/AdminSidebar'
import AdminHeader       from '@/components/layout/admin/AdminHeader'
import AdminBottomNav    from '@/components/layout/admin/AdminBottomNav'
import AdminMobileDrawer from '@/components/layout/admin/AdminMobileDrawer'
import AdminLayoutShell  from '@/components/layout/admin/AdminLayoutShell'

export default async function AdminLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users
  if (!user) redirect('/login')

  // Check admin role — try both admins table and users.role column
  const [{ data: adminRow }, { data: userRow }] = await Promise.all([
    supabase.from('admins').select('id, role').eq('user_id', user.id).maybeSingle(),
    supabase.from('users').select('role').eq('id', user.id).maybeSingle(),
  ])

  const isAdmin = !!adminRow || userRow?.role === 'admin'
  if (!isAdmin) redirect('/feed')

  return (
    <div className="min-h-dvh bg-neutral-950">
      <AdminSidebar />
      <AdminMobileDrawer />
      <AdminLayoutShell>
        <AdminHeader />
        <main className="
          px-4 sm:px-6 py-6
          pb-[calc(var(--bottom-nav-h,4rem)+1.5rem)]
          md:pb-8
          max-w-[1400px] mx-auto
        ">
          {children}
        </main>
        <AdminBottomNav />
      </AdminLayoutShell>
    </div>
  )
}