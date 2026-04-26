'use client'
// FILE: src/app/(customer)/about/page.jsx

import React from 'react'
import { motion } from 'framer-motion'
import { 
  ShieldCheck, Video, Users, ShoppingBag, 
  ArrowRight, CheckCircle2, Star, Zap,
  Globe, Heart, MessageSquare, TrendingUp
} from 'lucide-react'
import Link from 'next/link'

const Feature = ({ icon: Icon, title, desc }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="p-8 bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
  >
    <div className="w-14 h-14 rounded-2xl bg-brand/5 flex items-center justify-center text-brand mb-6">
      <Icon size={28} />
    </div>
    <h3 className="text-xl font-black text-neutral-900 mb-3 uppercase tracking-tight">{title}</h3>
    <p className="text-neutral-500 leading-relaxed font-medium">{desc}</p>
  </motion.div>
)

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface selection:bg-brand/10 selection:text-brand">
      
      {/* ── Hero Section ────────────────────────────────────────── */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="page relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 text-brand rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8"
          >
            <Zap size={14} /> The Future of Social Commerce
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black text-neutral-900 leading-[1.1] tracking-tight mb-8"
          >
            Where to Sell, Buy, <br/> and <span className="text-brand">Connect</span> with Trust.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto text-lg md:text-xl text-neutral-500 font-medium leading-relaxed mb-12"
          >
            Novara Quickbuy is a video-first social marketplace designed for the modern era. 
            Discover thousands of products from verified vendors through authentic video reviews 
            and a community that values transparency.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/explore" className="px-10 py-5 bg-brand text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
              Start Shopping <ArrowRight size={20} />
            </Link>
            <Link href="/onboarding/vendor" className="px-10 py-5 bg-white text-neutral-900 border border-neutral-200 rounded-[2rem] font-black uppercase tracking-widest hover:bg-neutral-50 active:scale-95 transition-all">
              Become a Vendor
            </Link>
          </motion.div>
        </div>

        {/* Background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-brand/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      </section>

      {/* ── Why Novara? ─────────────────────────────────────────── */}
      <section className="py-24 bg-white/50 backdrop-blur-3xl border-y border-neutral-100">
        <div className="page">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-neutral-900 uppercase tracking-tighter mb-4">Why Choose Novara?</h2>
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Built on three pillars of excellence</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Feature 
              icon={Video} 
              title="Video First" 
              desc="Forget static photos. See products in action through real videos from real sellers and customers. Authenticity is just a play button away."
            />
            <Feature 
              icon={ShieldCheck} 
              title="Verified Trust" 
              desc="Every vendor goes through a rigorous verification process. Look for the badge to know you're buying from the most trusted vendors in the market."
            />
            <Feature 
              icon={Users} 
              title="Social Circles" 
              desc="Join communities of like-minded shoppers. Share recommendations, leave reviews, and connect directly with the people behind the brands."
            />
          </div>
        </div>
      </section>

      {/* ── FOR SELLERS (SEO RICH) ──────────────────────────────── */}
      <section className="py-32 overflow-hidden">
        <div className="page">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-6xl font-black text-neutral-900 leading-tight mb-8">
                Wondering <span className="text-brand">Where to Sell</span> Your Products?
              </h2>
              <div className="space-y-8">
                <p className="text-lg text-neutral-500 leading-relaxed">
                  Selling online shouldn't be a struggle. Novara Quickbuy provides a robust platform for vendors, entrepreneurs, and established brands to showcase their inventory to a global audience. 
                </p>
                <div className="space-y-4">
                  {[
                    "List unlimited products with video showcases",
                    "Manage orders with an advanced admin console",
                    "Get verified and build instant trust with buyers",
                    "Direct communication through our built-in chat system",
                    "Secure payments and transparent tracking"
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="mt-1 w-6 h-6 rounded-full bg-success-light flex items-center justify-center text-success shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      <p className="text-neutral-700 font-bold">{text}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-8">
                  <Link href="/onboarding/vendor" className="text-brand font-black uppercase tracking-widest flex items-center gap-2 group">
                    Start your vendor journey <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square bg-gradient-to-tr from-brand to-brand-300 rounded-[4rem] flex items-center justify-center text-white shadow-2xl relative overflow-hidden">
                <ShoppingBag size={200} strokeWidth={1} className="opacity-20 absolute -bottom-10 -right-10" />
                <div className="p-12 relative z-10 text-center">
                  <div className="w-24 h-24 rounded-[2rem] bg-white/20 backdrop-blur-xl flex items-center justify-center mb-8 mx-auto border border-white/30">
                    <TrendingUp size={40} />
                  </div>
                  <h3 className="text-3xl font-black mb-4">Sell Smarter.</h3>
                  <p className="text-brand-50 font-medium">Join 2,000+ vendors already growing their business on Novara.</p>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/20 blur-3xl rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand/20 blur-3xl rounded-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FOR BUYERS (SEO RICH) ───────────────────────────────── */}
      <section className="py-32 bg-neutral-900 text-white rounded-[4rem] mx-4 md:mx-10 mb-20 overflow-hidden relative">
        <div className="page relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
              The Hub for <br/> <span className="text-brand-300">Trusted Vendors.</span>
            </h2>
            <p className="text-xl text-neutral-400 font-medium leading-relaxed">
              We know that trust is everything when shopping online. That's why Novara Quickbuy implements 
              multi-layered verification for every storefront on our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Verified Badge", desc: "Only vendors who pass our security checks get the green badge.", icon: ShieldCheck },
              { label: "Authentic Reviews", desc: "Real people sharing real experiences through video and text.", icon: MessageSquare },
              { label: "Global Shipping", desc: "Reach or buy from anywhere in the world with ease.", icon: Globe },
              { label: "Buyer Protection", desc: "Your payments are secure until you receive your order.", icon: Heart },
            ].map((item, i) => (
              <div key={i} className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-brand/20 flex items-center justify-center text-brand-300 mb-6">
                  <item.icon size={24} />
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight mb-2">{item.label}</h4>
                <p className="text-neutral-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-20 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="currentColor" />)}
            </div>
            <p className="text-neutral-400 font-bold uppercase tracking-[0.3em] text-xs">Trusted by over 50,000 customers</p>
          </div>
        </div>

        {/* Decorative mask */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand/5 -skew-x-12 translate-x-1/2 pointer-events-none" />
      </section>

      {/* ── SEO FAQ SECTION ─────────────────────────────────────── */}
      <section className="py-24 page">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-neutral-900 mb-12 uppercase tracking-tighter text-center">Frequently Asked Questions</h2>
          <div className="space-y-12">
            <div>
              <h4 className="text-lg font-black text-neutral-800 mb-3">Where can I sell my handmade products online?</h4>
              <p className="text-neutral-500 leading-relaxed font-medium">Novara Quickbuy is the perfect platform for artisans and makers. We specialize in video-first discovery, allowing you to show the craftsmanship behind your products, which builds more trust than traditional photos.</p>
            </div>
            <div>
              <h4 className="text-lg font-black text-neutral-800 mb-3">How do I find trusted vendors in Ghana and Africa?</h4>
              <p className="text-neutral-500 leading-relaxed font-medium">Our platform features a "Verified Only" filter and clear verification badges. We vet our vendors based on their business registration and track record of successful deliveries to ensure your peace of mind.</p>
            </div>
            <div>
              <h4 className="text-lg font-black text-neutral-800 mb-3">Is Novara Quickbuy safe for online shopping?</h4>
              <p className="text-neutral-500 leading-relaxed font-medium">Absolutely. We use industry-standard encryption for all transactions and offer built-in communication tools so you can talk to sellers directly before making a purchase.</p>
            </div>
            <div>
              <h4 className="text-lg font-black text-neutral-800 mb-3">Can I sell globally on Novara?</h4>
              <p className="text-neutral-500 leading-relaxed font-medium">Yes! Novara supports multi-currency payments and global shipping integrations, making it a powerful choice for businesses looking to expand beyond their local borders.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────── */}
      <section className="py-32 text-center page">
        <h2 className="text-4xl md:text-6xl font-black text-neutral-900 mb-8 leading-tight">Ready to Join the Revolution?</h2>
        <p className="text-xl text-neutral-500 mb-12 max-w-2xl mx-auto font-medium">Start your journey today—whether you're looking to buy the best or sell your best.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link href="/onboarding/vendor" className="px-12 py-6 bg-brand text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all">
            Join as a Vendor
          </Link>
          <Link href="/explore" className="px-12 py-6 bg-white text-neutral-900 border border-neutral-200 rounded-[2.5rem] font-black uppercase tracking-widest hover:bg-neutral-50 active:scale-95 transition-all">
            Browse the Market
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="py-12 border-t border-neutral-100 bg-white">
        <div className="page flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-neutral-400 text-sm font-medium">© 2026 Novara Quickbuy. All rights reserved.</p>
          <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
            <Link href="/terms" className="hover:text-brand transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-brand transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-brand transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
