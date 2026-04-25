// FILE: src/app/(vendor)/vendor/notifications/page.jsx
import NotificationsClient from './NotificationsClient'

export const metadata = {
  title: 'Alerts · Novara Vendor',
  description: 'Manage your vendor notifications and alerts'
}

export default function NotificationsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <NotificationsClient />
    </div>
  )
}
