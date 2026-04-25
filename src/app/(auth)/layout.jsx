// FILE: src/app/(auth)/layout.jsx
import Logo from '@/components/brand/Logo'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements for premium feel */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-brand/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-brand/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md animate-fade-up relative z-10">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        {children}
      </div>
    </div>
  )
}