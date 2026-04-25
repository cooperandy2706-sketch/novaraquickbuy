'use client'
// FILE: src/app/(customer)/layout.jsx
import CustomerShell from '@/components/layout/customer/CustomerShell'

export default function CustomerLayout({ children }) {
  return <CustomerShell>{children}</CustomerShell>
}