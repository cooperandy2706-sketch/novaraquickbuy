import { getVerifications } from '@/lib/actions/adminVerifications'
import VerificationsClient from './VerificationsClient'

export const metadata = {
  title: 'Verifications · Admin · Novara',
}

export const revalidate = 0 // always fresh for admin

export default async function VerificationsPage() {
  const { data: verifications, error } = await getVerifications()

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary mb-2">Vendor Verifications</h1>
        <p className="text-sm text-secondary">
          Review and approve vendor identity documents and business details.
        </p>
      </div>

      <VerificationsClient initialData={verifications || []} />
    </div>
  )
}
