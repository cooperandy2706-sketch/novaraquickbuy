import { Rocket, Sparkles } from 'lucide-react'

export default function ComingSoon({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-up">
      <div className="relative mb-8 group">
        <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="w-24 h-24 rounded-[2rem] bg-neutral-900 border border-neutral-800 flex items-center justify-center relative shadow-2xl overflow-hidden ring-1 ring-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
          <Rocket size={40} className="text-amber-500 relative z-10" strokeWidth={1.5} />
          <Sparkles size={16} className="absolute top-4 right-4 text-amber-400/50 animate-pulse" />
        </div>
      </div>
      
      <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
        {title}
      </h2>
      <p className="text-neutral-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
        {description || "We're currently building this feature. It will be available in an upcoming release."}
      </p>
      
      <div className="mt-10 px-4 py-2 rounded-full bg-neutral-900 border border-neutral-800 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">In Development</span>
      </div>
    </div>
  )
}
