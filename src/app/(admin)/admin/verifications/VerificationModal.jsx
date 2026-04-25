'use client'

import { useState } from 'react'
import { X, CheckCircle, XCircle, FileImage, User, Building, MapPin, Store } from 'lucide-react'
import { approveVerification, rejectVerification } from '@/lib/actions/adminVerifications'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center shrink-0 text-muted">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-xs font-semibold text-muted mb-0.5">{label}</p>
        <p className="text-sm text-primary">{value}</p>
      </div>
    </div>
  )
}

function DocumentViewer({ title, url }) {
  const [expanded, setExpanded] = useState(false)
  
  if (!url) return null

  return (
    <div className="mb-4">
      <p className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
        <FileImage size={16} className="text-brand" />
        {title}
      </p>
      <div 
        className={cn(
          "relative rounded-xl overflow-hidden bg-surface-2 border border-border transition-all cursor-pointer",
          expanded ? "fixed inset-4 z-50 flex items-center justify-center bg-black/90 p-4" : "aspect-video"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded && (
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-50">
            <X size={20} />
          </button>
        )}
        <img 
          src={url} 
          alt={title} 
          className={cn(
            "w-full h-full object-cover",
            expanded && "object-contain"
          )} 
        />
      </div>
    </div>
  )
}

export default function VerificationModal({ vendor, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this vendor?')) return
    setLoading(true)
    const { error } = await approveVerification(vendor.id)
    if (error) {
      toast.error(error)
      setLoading(false)
    } else {
      toast.success('Vendor approved successfully')
      onUpdate(vendor.id, 'approved')
    }
  }

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this vendor?')) return
    setLoading(true)
    const { error } = await rejectVerification(vendor.id)
    if (error) {
      toast.error(error)
      setLoading(false)
    } else {
      toast.success('Vendor rejected')
      onUpdate(vendor.id, 'rejected')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-surface rounded-2xl shadow-2xl flex flex-col max-h-[90dvh] animate-scale-in border border-border">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-bold text-primary">Review Verification</h2>
            <p className="text-sm text-secondary">{vendor.store_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn(
              "px-3 py-1 text-xs font-bold uppercase rounded-full tracking-wider",
              vendor.verification_status === 'pending'  && "bg-amber-500/10 text-amber-500",
              vendor.verification_status === 'approved' && "bg-emerald-500/10 text-emerald-500",
              vendor.verification_status === 'rejected' && "bg-danger/10 text-danger"
            )}>
              {vendor.verification_status}
            </span>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-muted hover:text-primary transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body Split View */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left: Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm uppercase tracking-widest font-bold text-muted mb-4 border-b border-border pb-2">Business Details</h3>
                <div className="card p-4">
                  <InfoRow icon={Store} label="Store Name" value={vendor.store_name} />
                  <InfoRow icon={Store} label="Category" value={vendor.store_category} />
                  <InfoRow icon={Building} label="Business Type" value={vendor.business_type?.replace('_', ' ')} />
                  <InfoRow icon={Building} label="Registered Name" value={vendor.business_reg_name} />
                  <InfoRow icon={Building} label="Registration Number" value={vendor.business_reg_number} />
                  <InfoRow icon={MapPin} label="Country" value={vendor.business_country} />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm uppercase tracking-widest font-bold text-muted mb-4 border-b border-border pb-2">Owner Details</h3>
                <div className="card p-4">
                  <InfoRow icon={User} label="Full Name" value={vendor.users?.full_name} />
                  <InfoRow icon={User} label="Email Address" value={vendor.users?.email} />
                  <InfoRow icon={User} label="ID Type" value={vendor.id_type?.toUpperCase()} />
                </div>
              </div>
            </div>

            {/* Right: Documents */}
            <div>
              <h3 className="text-sm uppercase tracking-widest font-bold text-muted mb-4 border-b border-border pb-2">Uploaded Documents</h3>
              <div className="card p-4">
                <DocumentViewer title="Selfie / Photo" url={vendor.selfie_url} />
                <DocumentViewer title="ID Front" url={vendor.id_front_url} />
                <DocumentViewer title="ID Back" url={vendor.id_back_url} />
                
                {(!vendor.id_front_url && !vendor.selfie_url) && (
                  <div className="py-12 text-center text-muted border-2 border-dashed border-border rounded-xl">
                    <FileImage size={32} className="mx-auto mb-3 opacity-20" />
                    <p>No documents uploaded yet.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions (Only show if pending) */}
        {vendor.verification_status === 'pending' && (
          <div className="p-4 border-t border-border bg-surface-2 flex items-center justify-end gap-3 shrink-0 rounded-b-2xl">
            <button 
              onClick={handleReject} 
              disabled={loading}
              className="btn bg-danger/10 text-danger hover:bg-danger hover:text-white"
            >
              <XCircle size={16} /> Reject Vendor
            </button>
            <button 
              onClick={handleApprove} 
              disabled={loading}
              className="btn btn-primary bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-emerald-500/20"
            >
              <CheckCircle size={16} /> Approve Vendor
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
