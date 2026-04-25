'use client'
// FILE: src/components/order/DeliverySelector.jsx
// Delivery method picker used on the checkout/order flow.
// Novara Delivery is flagged "coming soon" and disabled.
// All other options are fully interactive.

import { useState } from 'react'
import { cn } from '@/utils/cn'
import {
  Truck, Store, Package, Zap,
  Clock, MapPin, CheckCircle2, Lock, Phone,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// DELIVERY OPTIONS
// ─────────────────────────────────────────────────────────────

const DELIVERY_OPTIONS = [
  {
    id:       'courier',
    label:    'Courier Shipping',
    sublabel: 'Tracked delivery to your door',
    icon:     Truck,
    eta:      '2 – 5 business days',
    badge:    'Coming Soon',
    disabled: true,
    iconBg:   '#F9FAFB',
    iconColor:'#9CA3AF',
    verify:   'tracking_number',
    verifyLabel: 'Tracking number provided',
  },
  {
    id:       'vendor_delivery',
    label:    'Vendor Delivery',
    sublabel: 'Delivered directly by the seller',
    icon:     Package,
    eta:      '1 – 3 business days',
    badge:    null,
    disabled: false,
    iconBg:   '#F0FDF4',
    iconColor:'#16A34A',
    verify:   'otp',
    verifyLabel: 'OTP code required on delivery',
  },
  {
    id:       'store_pickup',
    label:    'Store Pickup',
    sublabel: 'Collect from the vendor\'s location',
    icon:     Store,
    eta:      'Same day – 1 day',
    badge:    null,
    disabled: false,
    iconBg:   '#FFF7ED',
    iconColor:'#EA580C',
    verify:   'qr',
    verifyLabel: 'QR scan on collection',
  },
  {
    id:       'novara_delivery',
    label:    'Novara Delivery',
    sublabel: 'Lightning-fast delivery by Novara riders',
    icon:     Zap,
    eta:      'Under 2 hours',
    badge:    'Coming Soon',
    disabled: true,
    iconBg:   '#F9FAFB',
    iconColor:'#9CA3AF',
    verify:   'gps_otp',
    verifyLabel: 'GPS-tracked + OTP',
  },
]

// ─────────────────────────────────────────────────────────────
// VERIFY BADGE
// ─────────────────────────────────────────────────────────────

function VerifyBadge({ type }) {
  const map = {
    tracking_number: { label: 'Tracking number', color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100' },
    otp:             { label: 'OTP on delivery',  color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    qr:              { label: 'QR scan',          color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    gps_otp:         { label: 'GPS + OTP',        color: 'text-neutral-400', bg: 'bg-neutral-50', border: 'border-neutral-200' },
  }
  const v = map[type]
  if (!v) return null
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border',
      v.color, v.bg, v.border,
    )}>
      <CheckCircle2 size={9} />
      {v.label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// ADDRESS INPUT (shown when courier or vendor delivery selected)
// ─────────────────────────────────────────────────────────────

function AddressInput({ value, onChange }) {
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-1.5 mb-1">
        <MapPin size={12} className="text-brand" />
        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
          Delivery Address
        </span>
      </div>
      <input
        type="text"
        placeholder="Street / Area"
        value={value.street}
        onChange={e => onChange({ ...value, street: e.target.value })}
        className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-100 placeholder:text-neutral-300 transition-all"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="City"
          value={value.city}
          onChange={e => onChange({ ...value, city: e.target.value })}
          className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-100 placeholder:text-neutral-300 transition-all"
        />
        <input
          type="text"
          placeholder="Region"
          value={value.region}
          onChange={e => onChange({ ...value, region: e.target.value })}
          className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-100 placeholder:text-neutral-300 transition-all"
        />
      </div>
      <input
        type="text"
        placeholder="Nearest landmark (optional)"
        value={value.landmark}
        onChange={e => onChange({ ...value, landmark: e.target.value })}
        className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-100 placeholder:text-neutral-300 transition-all"
      />
      <div className="flex items-center gap-1.5 mb-1 mt-2">
        <Phone size={12} className="text-brand" />
        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
          Contact Phone
        </span>
      </div>
      <input
        type="tel"
        placeholder="Phone number for delivery"
        value={value.phone}
        onChange={e => onChange({ ...value, phone: e.target.value })}
        className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-100 placeholder:text-neutral-300 transition-all"
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

/**
 * DeliverySelector
 *
 * Props:
 *   value       string   — current selected delivery method id
 *   onChange    fn       — (id, address?) => void
 *   vendorName  string   — shown in vendor delivery label
 *   pickupAddress string — shown in store pickup description
 */
export default function DeliverySelector({
  value,
  onChange,
  vendorName   = 'Vendor',
  pickupAddress = 'Contact vendor for location',
}) {
  const [address, setAddress] = useState({ street: '', city: '', region: '', landmark: '', phone: '' })

  const handleSelect = (optionId) => {
    if (DELIVERY_OPTIONS.find(o => o.id === optionId)?.disabled) return
    onChange(optionId, ['courier','vendor_delivery'].includes(optionId) ? address : null)
  }

  const handleAddressChange = (newAddr) => {
    setAddress(newAddr)
    if (['courier','vendor_delivery'].includes(value)) {
      onChange(value, newAddr)
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-brand-50 flex items-center justify-center">
          <Truck size={13} className="text-brand" />
        </div>
        <p className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
          Choose Delivery Method
        </p>
      </div>

      {DELIVERY_OPTIONS.map(opt => {
        const selected = value === opt.id
        const Icon     = opt.icon

        return (
          <div key={opt.id}>
            <button
              type="button"
              disabled={opt.disabled}
              onClick={() => handleSelect(opt.id)}
              className={cn(
                'w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all duration-200',
                opt.disabled
                  ? 'opacity-60 cursor-not-allowed bg-neutral-50 border-neutral-100'
                  : selected
                    ? 'bg-white border-brand shadow-sm shadow-brand-100/50'
                    : 'bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-sm',
              )}
            >
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: opt.disabled ? '#F3F4F6' : opt.iconBg,
                  color: opt.disabled ? '#9CA3AF' : opt.iconColor,
                }}
              >
                {opt.disabled
                  ? <Lock size={15} className="text-neutral-400" />
                  : <Icon size={16} />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    'text-sm font-bold leading-tight',
                    opt.disabled ? 'text-neutral-400' : 'text-neutral-800',
                  )}>
                    {opt.id === 'vendor_delivery'
                      ? 'Door Delivery'
                      : opt.id === 'store_pickup'
                        ? 'Pickup at Store'
                        : opt.label
                    }
                  </span>

                  {/* Coming soon badge */}
                  {opt.badge && (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-400 border border-neutral-200 uppercase tracking-wide">
                      {opt.badge}
                    </span>
                  )}

                  {/* Selected check */}
                  {selected && !opt.disabled && (
                    <CheckCircle2 size={14} className="text-brand ml-auto shrink-0" />
                  )}
                </div>

                <p className={cn(
                  'text-[11px] mt-0.5 leading-snug',
                  opt.disabled ? 'text-neutral-400' : 'text-neutral-500',
                )}>
                  {opt.id === 'store_pickup' ? pickupAddress : opt.sublabel}
                </p>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <div className={cn(
                    'flex items-center gap-1 text-[10px] font-semibold',
                    opt.disabled ? 'text-neutral-400' : 'text-neutral-500',
                  )}>
                    <Clock size={10} />
                    {opt.eta}
                  </div>
                  <VerifyBadge type={opt.verify} />
                </div>
              </div>
            </button>

            {/* Address input — expands under courier or vendor delivery when selected */}
            {selected && ['courier', 'vendor_delivery'].includes(opt.id) && (
              <div className="bg-neutral-50 border border-t-0 border-neutral-200 rounded-b-2xl px-3.5 pb-3.5 -mt-2 pt-4">
                <AddressInput value={address} onChange={handleAddressChange} />
              </div>
            )}

            {/* Contact Phone for Store Pickup */}
            {selected && opt.id === 'store_pickup' && (
              <div className="bg-neutral-50 border border-t-0 border-neutral-200 rounded-b-2xl px-3.5 pb-3.5 -mt-2 pt-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Phone size={12} className="text-brand" />
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Your Contact Phone
                  </span>
                </div>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={address.phone}
                  onChange={e => handleAddressChange({ ...address, phone: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-100 placeholder:text-neutral-300 transition-all"
                />
                <p className="text-[10px] text-neutral-400 mt-2 italic">
                  The vendor will use this number to notify you when your order is ready for pickup.
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}