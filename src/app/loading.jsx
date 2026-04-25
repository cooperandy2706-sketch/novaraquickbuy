// FILE: src/app/loading.jsx
import Logo from '@/components/brand/Logo'

export default function Loading() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-brand-50">
      <div className="animate-scale-in">
        <Logo size="lg" />
      </div>
      <div className="flex gap-1.5 mt-8">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-brand animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
