'use client'

import { useState } from 'react'
import { Search, BadgeCheck, XCircle, Clock, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import VerificationModal from './VerificationModal'

const TABS = [
  { id: 'pending',  label: 'Pending',  icon: Clock,       color: 'text-amber-500',  bg: 'bg-amber-500/10' },
  { id: 'approved', label: 'Approved', icon: BadgeCheck,  color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'rejected', label: 'Rejected', icon: XCircle,     color: 'text-danger',      bg: 'bg-danger/10' },
]

export default function VerificationsClient({ initialData }) {
  const [data, setData] = useState(initialData)
  const [tab, setTab] = useState('pending')
  const [search, setSearch] = useState('')
  const [selectedVendor, setSelectedVendor] = useState(null)

  // Filter logic
  const filtered = data.filter(v => {
    if (v.verification_status !== tab) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      v.store_name?.toLowerCase().includes(q) ||
      v.business_reg_name?.toLowerCase().includes(q) ||
      v.users?.full_name?.toLowerCase().includes(q) ||
      v.users?.email?.toLowerCase().includes(q)
    )
  })

  const handleUpdateStatus = (vendorId, newStatus) => {
    setData(prev => prev.map(v => v.id === vendorId ? { ...v, verification_status: newStatus } : v))
    setSelectedVendor(null)
  }

  const counts = {
    pending:  data.filter(v => v.verification_status === 'pending').length,
    approved: data.filter(v => v.verification_status === 'approved').length,
    rejected: data.filter(v => v.verification_status === 'rejected').length,
  }

  return (
    <div className="space-y-6">
      {/* Controls: Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1 bg-surface-2 rounded-xl border border-border overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0',
                tab === t.id ? 'bg-surface shadow-sm text-primary' : 'text-muted hover:text-secondary'
              )}
            >
              <t.icon size={16} className={tab === t.id ? t.color : ''} />
              {t.label}
              <span className={cn(
                'ml-1.5 px-2 py-0.5 rounded-full text-xs',
                tab === t.id ? t.bg + ' ' + t.color : 'bg-surface-3 text-muted'
              )}>
                {counts[t.id]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative max-w-sm w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search stores or names..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 bg-surface-2 w-full"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted uppercase bg-surface-2 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Store / Owner</th>
                <th className="px-6 py-4 font-semibold">Business Type</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold">Submitted</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-secondary">
                    <p className="mb-1">No {tab} verifications found.</p>
                    {search && <p className="text-xs text-muted">Try clearing your search query.</p>}
                  </td>
                </tr>
              ) : (
                filtered.map(vendor => (
                  <tr 
                    key={vendor.id} 
                    className="hover:bg-surface-2/50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedVendor(vendor)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-semibold text-primary">{vendor.store_name}</p>
                      <p className="text-xs text-muted">{vendor.users?.full_name} ({vendor.users?.email})</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-secondary capitalize">{vendor.business_type?.replace('_', ' ')}</p>
                      <p className="text-xs text-muted truncate max-w-[200px]" title={vendor.business_reg_name}>
                        {vendor.business_reg_name || 'Unregistered'}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-secondary">{vendor.business_country}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-secondary">
                        {new Date(vendor.updated_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <ChevronRight size={16} className="text-muted group-hover:text-primary transition-colors inline-block" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Modal */}
      {selectedVendor && (
        <VerificationModal
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
          onUpdate={handleUpdateStatus}
        />
      )}
    </div>
  )
}
