'use client'
// FILE: src/components/novapay/PaymentMethodManager.jsx
// Manages saved payment methods: cards and MoMo numbers.
// Card details are never stored — only processor tokens.

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'
import {
  CreditCard, Smartphone, Plus, Trash2,
  CheckCircle2, Star, Loader2, AlertCircle,
  Building2, Shield,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// NETWORK COLOURS
// ─────────────────────────────────────────────────────────────

const NETWORK_STYLES = {
  mtn:        { bg: '#FFCC00', text: '#1a1a1a', label: 'MTN'        },
  vodafone:   { bg: '#E60000', text: '#ffffff', label: 'Vodafone'   },
  airteltigo: { bg: '#00B5E2', text: '#ffffff', label: 'AirtelTigo' },
}

const CARD_STYLES = {
  visa:       { bg: '#1A1F71', text: '#ffffff', label: 'VISA'       },
  mastercard: { bg: '#EB001B', text: '#ffffff', label: 'Mastercard' },
  amex:       { bg: '#2671B1', text: '#ffffff', label: 'Amex'       },
}

// ─────────────────────────────────────────────────────────────
// PAYMENT METHOD CARD
// ─────────────────────────────────────────────────────────────

function MethodCard({ method, onDelete, onSetDefault, deleting }) {
  const isMoMo = method.type.startsWith('momo_')
  const networkKey = method.momo_network ?? (
    method.type === 'momo_mtn' ? 'mtn' :
    method.type === 'momo_vodafone' ? 'vodafone' : 'airteltigo'
  )
  const cardKey    = method.card_brand?.toLowerCase() ?? 'visa'
  const style      = isMoMo ? NETWORK_STYLES[networkKey] : CARD_STYLES[cardKey]

  return (
    <div className={cn(
      'group relative flex items-center gap-3.5 p-4 rounded-2xl border-2 transition-all',
      method.is_default
        ? 'border-brand bg-brand-50'
        : 'border-neutral-200 bg-white hover:border-neutral-300',
    )}>
      {/* Icon */}
      <div
        className="w-12 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black"
        style={{ background: style?.bg ?? '#f1f5f9', color: style?.text ?? '#1e293b' }}
      >
        {isMoMo
          ? <Smartphone size={16} style={{ color: style?.text }} />
          : <span className="text-[10px] font-black">{style?.label ?? 'CARD'}</span>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-neutral-800 truncate">
            {method.display_name}
          </p>
          {method.is_default && (
            <span className="flex items-center gap-1 text-[9px] font-black text-brand bg-brand-100 px-1.5 py-0.5 rounded-full shrink-0">
              <Star size={8} className="fill-brand" /> Default
            </span>
          )}
        </div>
        {isMoMo ? (
          <p className="text-[11px] text-neutral-400 mt-0.5">{method.momo_number}</p>
        ) : (
          <p className="text-[11px] text-neutral-400 mt-0.5">
            {method.last_four && `•••• ${method.last_four}`}
            {method.expiry_month && ` · ${String(method.expiry_month).padStart(2,'0')}/${method.expiry_year}`}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!method.is_default && (
          <button
            onClick={() => onSetDefault(method.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-brand hover:bg-brand-50 transition-all"
            title="Set as default"
          >
            <Star size={13} />
          </button>
        )}
        <button
          onClick={() => onDelete(method.id)}
          disabled={deleting === method.id}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40"
          title="Remove"
        >
          {deleting === method.id
            ? <Loader2 size={13} className="animate-spin" />
            : <Trash2 size={13} />
          }
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ADD MOMO FORM
// ─────────────────────────────────────────────────────────────

function AddMoMoForm({ onAdd, onCancel }) {
  const [network, setNetwork] = useState('mtn')
  const [phone,   setPhone]   = useState('')
  const [name,    setName]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const networks = [
    { id: 'mtn',        label: 'MTN',        type: 'momo_mtn'        },
    { id: 'vodafone',   label: 'Vodafone',   type: 'momo_vodafone'   },
    { id: 'airteltigo', label: 'AirtelTigo', type: 'momo_airteltigo' },
  ]

  const handleAdd = async () => {
    if (phone.length < 9 || !name.trim()) { setError('Please enter a valid number and name'); return }
    setLoading(true)
    setError(null)

    const networkObj = networks.find(n => n.id === network)
    const masked     = `+233••••${phone.slice(-4)}`

    await onAdd({
      type:             networkObj.type,
      processor:        'paystack',
      display_name:     `${networkObj.label} MoMo ${masked}`,
      momo_number:      masked,
      momo_network:     network,
      processor_token:  `momo_${network}_+233${phone}`,  // In prod: get from Paystack tokenisation
      is_default:       false,
    })

    setLoading(false)
  }

  return (
    <div className="space-y-3 bg-neutral-50 rounded-2xl p-4 border border-neutral-200">
      <p className="text-xs font-bold text-neutral-600">Add MoMo Number</p>

      {/* Network */}
      <div className="flex gap-2">
        {networks.map(n => (
          <button
            key={n.id}
            onClick={() => setNetwork(n.id)}
            className={cn(
              'flex-1 py-2 rounded-xl text-[11px] font-bold border-2 transition-all',
              network === n.id ? 'border-brand bg-brand-50 text-brand' : 'border-neutral-200 text-neutral-500',
            )}
          >
            {n.label}
          </button>
        ))}
      </div>

      {/* Phone */}
      <div className="flex items-center gap-0 border-2 border-neutral-200 rounded-xl overflow-hidden focus-within:border-brand transition-colors bg-white">
        <span className="bg-neutral-50 px-3 py-2.5 text-xs font-bold text-neutral-500 border-r border-neutral-200 shrink-0">+233</span>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
          placeholder="XXXXXXXXX"
          className="flex-1 px-3 py-2.5 text-sm font-semibold outline-none"
        />
      </div>

      {/* Account name */}
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Account holder name"
        className="w-full border-2 border-neutral-200 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:border-brand transition-colors bg-white"
      />

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <AlertCircle size={12} /> {error}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-neutral-200 text-neutral-600 text-xs font-bold hover:bg-neutral-300 transition-colors">
          Cancel
        </button>
        <button
          onClick={handleAdd}
          disabled={loading || phone.length < 9}
          className="flex-1 py-2.5 rounded-xl bg-brand text-white text-xs font-bold disabled:opacity-40 hover:bg-brand-600 transition-colors flex items-center justify-center gap-1.5"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          Add
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

export default function PaymentMethodManager() {
  const [methods,    setMethods]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [deleting,   setDeleting]   = useState(null)
  const [showAddMoMo,setShowAddMoMo]= useState(false)
  const [success,    setSuccess]    = useState(null)

  const { user }  = useAuthStore()
  const supabase  = createClient()

  useEffect(() => {
    if (!user) return
    supabase
      .from('novapay_payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .then(({ data }) => {
        setMethods(data ?? [])
        setLoading(false)
      })
  }, [user?.id])

  const handleAdd = async (method) => {
    if (!user) return
    const { data, error } = await supabase
      .from('novapay_payment_methods')
      .insert({ ...method, user_id: user.id })
      .select()
      .single()

    if (!error && data) {
      setMethods(prev => [data, ...prev])
      setShowAddMoMo(false)
      setSuccess('Payment method added!')
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    await supabase
      .from('novapay_payment_methods')
      .update({ is_active: false })
      .eq('id', id)
    setMethods(prev => prev.filter(m => m.id !== id))
    setDeleting(null)
  }

  const handleSetDefault = async (id) => {
    await supabase
      .from('novapay_payment_methods')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', user.id)

    setMethods(prev => prev.map(m => ({ ...m, is_default: m.id === id })))
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1,2].map(i => (
          <div key={i} className="h-16 bg-neutral-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-neutral-800">Payment Methods</h3>
          <p className="text-[10px] text-neutral-400 mt-0.5">Saved cards and MoMo numbers</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
          <Shield size={11} className="text-brand" />
          <span>Encrypted & secure</span>
        </div>
      </div>

      {/* Success toast */}
      {success && (
        <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl p-3 text-xs font-semibold text-brand">
          <CheckCircle2 size={13} className="text-brand" /> {success}
        </div>
      )}

      {/* Method list */}
      {methods.length === 0 && !showAddMoMo ? (
        <div className="flex flex-col items-center py-8 text-center bg-neutral-50 rounded-2xl border border-neutral-200">
          <CreditCard size={24} className="text-neutral-300 mb-2" />
          <p className="text-xs font-semibold text-neutral-400">No saved payment methods</p>
          <p className="text-[10px] text-neutral-300 mt-0.5">Add a MoMo number or card for faster checkout</p>
        </div>
      ) : (
        <div className="space-y-2">
          {methods.map(m => (
            <MethodCard
              key={m.id}
              method={m}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
              deleting={deleting}
            />
          ))}
        </div>
      )}

      {/* Add MoMo form */}
      {showAddMoMo && (
        <AddMoMoForm
          onAdd={handleAdd}
          onCancel={() => setShowAddMoMo(false)}
        />
      )}

      {/* Add buttons */}
      {!showAddMoMo && (
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddMoMo(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl border-2 border-dashed border-neutral-300 text-neutral-500 text-xs font-semibold hover:border-brand hover:text-brand hover:bg-brand-50 transition-all"
          >
            <Plus size={13} /> Add MoMo
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl border-2 border-dashed border-neutral-300 text-neutral-500 text-xs font-semibold hover:border-brand hover:text-brand hover:bg-brand-50 transition-all"
            title="Card saving coming soon"
          >
            <CreditCard size={13} /> Add Card
          </button>
        </div>
      )}

      <p className="text-[10px] text-neutral-400 text-center">
        Card numbers are never stored. We only save secure processor tokens.
      </p>
    </div>
  )
}