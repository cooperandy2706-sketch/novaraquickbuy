// FILE: src/app/(store)/layout.jsx
// Buyer-facing store pages — no vendor chrome
export default function StoreLayout({ children }) {
  return (
    <div className="min-h-dvh bg-neutral-50">
      {children}
    </div>
  )
}