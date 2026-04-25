'use client'

import { useState } from 'react'

import { cn } from '@/utils/cn'
import {
  Banknote, HandCoins, Smartphone,
  Building2, CreditCard, Lock, CheckCircle2,
  Sparkles, AlertCircle
} from 'lucide-react'

const NOVAPAY_OPTIONS = [
  { id: 'momo', label: 'Mobile Money', icon: Smartphone, iconBg: '#EFF6FF', iconColor: '#2563EB' },
  { id: 'card', label: 'Cards & Wallets', icon: CreditCard, iconBg: '#FDF2F8', iconColor: '#DB2777' },
  { id: 'bank', label: 'Bank Transfer', icon: Building2, iconBg: '#F3F4F6', iconColor: '#4B5563' },
]

const PAYMENT_OPTIONS = [
  {
    id:       'pay_on_delivery',
    label:    'Pay on Delivery',
    sublabel: 'Pay with cash or MoMo when your order arrives',
    icon:     HandCoins,
    badge:    null,
    disabled: false,
    iconBg:   '#F0FDF4',
    iconColor:'#16A34A',
  },
  {
    id:       'pay_at_pickup',
    label:    'Pay at Pickup',
    sublabel: 'Pay the vendor directly when you collect',
    icon:     Banknote,
    badge:    null,
    disabled: false,
    iconBg:   '#FFF7ED',
    iconColor:'#EA580C',
  },
  {
    id:       'contact_to_order',
    label:    'Contact to Order',
    sublabel: 'Contact vendor to arrange payment before delivery',
    icon:     Smartphone,
    badge:    null,
    disabled: false,
    iconBg:   '#EEF2FF',
    iconColor:'#4F46E5',
  },
  {
    id:       'momo',
    label:    'Mobile Money (MoMo)',
    sublabel: 'Pay instantly via MTN, Telecel, or AT',
    icon:     Smartphone,
    badge:    'Coming Soon',
    disabled: true,
    iconBg:   '#EFF6FF',
    iconColor:'#2563EB',
  },
  {
    id:       'bank_transfer',
    label:    'Bank Transfer',
    sublabel: 'Direct transfer to our secure escrow account',
    icon:     Building2,
    badge:    'Coming Soon',
    disabled: true,
    iconBg:   '#F3F4F6',
    iconColor:'#4B5563',
  },
  {
    id:       'card',
    label:    'Credit / Debit Card',
    sublabel: 'Visa, Mastercard, Apple Pay',
    icon:     CreditCard,
    badge:    'Coming Soon',
    disabled: true,
    iconBg:   '#FDF2F8',
    iconColor:'#DB2777',
  },
]

export default function PaymentSelector({ value, onChange }) {
  const [showComingSoon, setShowComingSoon] = useState(false)

  const handleSelect = (optionId) => {
    const option = PAYMENT_OPTIONS.find(o => o.id === optionId)
    if (option?.disabled) {
      setShowComingSoon(true)
      setTimeout(() => setShowComingSoon(false), 3000)
      return
    }
    onChange(optionId)
  }

  return (
    <div className="space-y-4">
      {/* NovaPay Coming Soon Section */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowComingSoon(true)
            setTimeout(() => setShowComingSoon(false), 3000)
          }}
          className="w-full group relative overflow-hidden p-4 rounded-2xl bg-neutral-900 text-white text-left transition-all active:scale-[0.98]"
        >
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Sparkles size={18} className="text-brand" />
              </div>
              <div>
                <p className="text-sm font-black">Pay with NovaPay</p>
                <p className="text-[10px] text-neutral-400">MoMo, Card, Bank & Escrow</p>
              </div>
            </div>
            <span className="text-[9px] font-black px-2 py-1 rounded-lg bg-white/10 border border-white/10 uppercase tracking-wider">
              Coming Soon
            </span>
          </div>
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {showComingSoon && (
          <div className="absolute -top-12 left-0 right-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-neutral-800 text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 mx-auto w-fit border border-neutral-700">
              <AlertCircle size={14} className="text-brand" />
              <p className="text-xs font-bold">NovaPay is coming soon! Try the methods below.</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2.5 pt-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
            <HandCoins size={13} className="text-emerald-600" />
          </div>
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            Available Direct Methods
          </p>
        </div>

      {PAYMENT_OPTIONS.filter(o => !o.disabled).map(opt => {
        const selected = value === opt.id
        const Icon     = opt.icon

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => handleSelect(opt.id)}
            className={cn(
              'w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all duration-200',
              selected
                ? 'bg-white border-emerald-500 shadow-sm shadow-emerald-100/50'
                : 'bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-sm',
            )}
          >
            {/* Icon */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{
                background: opt.iconBg,
                color: opt.iconColor,
              }}
            >
              <Icon size={16} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold leading-tight text-neutral-800">
                  {opt.label}
                </span>

                {/* Selected check */}
                {selected && (
                  <CheckCircle2 size={14} className="text-emerald-500 ml-auto shrink-0" />
                )}
              </div>

              <p className="text-[11px] mt-0.5 leading-snug text-neutral-500">
                {opt.sublabel}
              </p>
            </div>
          </button>
        )
      })}
      </div>
    </div>
  )
}
