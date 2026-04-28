'use client'
// FILE: src/app/page.jsx

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  ShieldCheck, Video, Users, ShoppingBag, 
  ArrowRight, CheckCircle2, Star, Zap,
  Globe, Heart, MessageSquare, TrendingUp,
  Monitor, Smartphone, Apple, Download
} from 'lucide-react'
import Link from 'next/link'

import { useAuthStore } from '@/store/authStore'
import { useRouter }    from 'next/navigation'
import DownloadProgressModal from '@/components/global/DownloadProgressModal'

// ── Download URLs — update these once files are hosted ──────────────────────
const DOWNLOAD_LINKS = {
  mac:     '/downloads/Novara-Quickbuy-arm64.dmg',
  windows: '/downloads/Novara-Quickbuy-Setup.exe',
  android: '/downloads/Novara-Quickbuy.apk',
  ios:     'https://testflight.apple.com/join/XXXXXXXX', // Replace with your TestFlight link
}

// ── Detect platform on the client ───────────────────────────────────────────
function usePlatform() {
  const [platform, setPlatform] = useState(null)
  useEffect(() => {
    const ua = navigator.userAgent
    if (/android/i.test(ua))                                   setPlatform('android')
    else if (/ipad|iphone|ipod/i.test(ua))                     setPlatform('ios')
    else if (/macintosh|mac os x/i.test(ua))                   setPlatform('mac')
    else if (/windows/i.test(ua))                              setPlatform('windows')
    else                                                        setPlatform('other')
  }, [])
  return platform
}

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

// ── Per-platform download card config ──────────────────────────────────────
const PLATFORM_CONFIG = {
  mac: {
    label: 'Download for Mac',
    sub: 'macOS 11+ · Apple Silicon & Intel',
    href: DOWNLOAD_LINKS.mac,
    badge: null,
    primary: true,
  },
  windows: {
    label: 'Download for Windows',
    sub: 'Windows 10 / 11 · 64-bit installer',
    href: DOWNLOAD_LINKS.windows,
    badge: null,
    primary: true,
  },
  android: {
    label: 'Download for Android',
    sub: 'Direct APK · Android 8.0+',
    href: DOWNLOAD_LINKS.android,
    badge: '⚡ No Play Store needed',
    primary: true,
  },
  ios: {
    label: 'Join via TestFlight',
    sub: 'iPhone & iPad · iOS 15+',
    href: DOWNLOAD_LINKS.ios,
    badge: 'Beta Access',
    primary: true,
  },
  other: {
    label: 'Get the App',
    sub: 'Available for Mac, Windows & Android',
    href: '#download',
    badge: null,
    primary: false,
  },
}

export default function RootPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const platform = usePlatform()

  // ── Download modal state ──────────────────────────────────────────────────
  const [dlModal, setDlModal] = useState(null) // { platform, href, isExternal }

  const openDownload = useCallback((platformKey, href, isExternal = false) => {
    setDlModal({ platform: platformKey, href, isExternal })
  }, [])

  const handleActualDownload = useCallback(() => {
    if (!dlModal) return
    if (dlModal.isExternal) {
      window.open(dlModal.href, '_blank', 'noopener noreferrer')
    } else {
      // Trigger native browser download
      const a = document.createElement('a')
      a.href = dlModal.href
      a.download = ''
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }, [dlModal])

  useEffect(() => {
    if (user) {
      router.replace('/feed')
    }
  }, [user, router])

  // If user is logged in, show nothing (it will redirect anyway)
  if (user) return null
  return (
    <>
    <div className="min-h-screen bg-surface selection:bg-brand/10 selection:text-brand transition-colors duration-300">
      
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
            className="text-5xl md:text-7xl font-black text-primary leading-[1.1] tracking-tight mb-8"
          >
            Where to Sell, Buy, <br/> and <span className="text-brand">Connect</span> with Trust.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto text-lg md:text-xl text-secondary font-medium leading-relaxed mb-12"
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
            <Link href="/feed" className="px-10 py-5 bg-brand text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
              Start Shopping <ArrowRight size={20} />
            </Link>
            <Link href="/register" className="px-10 py-5 bg-surface-2 text-primary border border-border rounded-[2rem] font-black uppercase tracking-widest hover:bg-surface-3 active:scale-95 transition-all">
              Become a Vendor
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-14 flex flex-col items-center justify-center gap-4"
          >
            <p className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Available on all your devices</p>
            <a href="#download" className="flex items-center gap-8 text-neutral-400 hover:text-brand transition-colors cursor-pointer group">
              <svg viewBox="0 0 384 512" fill="currentColor" width="24" height="24" className="group-hover:text-neutral-800 transition-colors"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
              <svg viewBox="0 0 448 512" fill="currentColor" width="22" height="22" className="group-hover:text-[#00a4ef] transition-colors"><path d="M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.4H0v149.9zm203.8 28L448 480V268.4H203.8v177.9zm0-380.6v180.1H448V32L203.8 65.7z"/></svg>
              <svg viewBox="0 0 512 512" fill="currentColor" width="26" height="26" className="group-hover:text-[#3DDC84] transition-colors"><path d="M325.3 234.3c-6.5 0-11.8-5.3-11.8-11.8 0-6.5 5.3-11.8 11.8-11.8 6.5 0 11.8 5.3 11.8 11.8 0 6.5-5.3 11.8-11.8 11.8zm-138.6 0c-6.5 0-11.8-5.3-11.8-11.8 0-6.5 5.3-11.8 11.8-11.8 6.5 0 11.8 5.3 11.8 11.8 0 6.5-5.3 11.8-11.8 11.8zm231.8-85.3l37.2-64.4c1.3-2.3.5-5.3-1.8-6.6-2.3-1.3-5.3-.5-6.6 1.8L409 146c-44-19.6-92.4-30.5-144-30.5s-100 10.9-144 30.5l-38.4-66.2c-1.3-2.3-4.3-3.1-6.6-1.8-2.3 1.3-3.1 4.3-1.8 6.6l37.2 64.4C44.7 186 0 252.1 0 330.8h512c0-78.7-44.7-144.8-111.5-181.8z"/></svg>
            </a>
          </motion.div>
        </div>

        {/* Background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-brand/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      </section>

      {/* ── Why Novara? ─────────────────────────────────────────── */}
      <section className="py-24 bg-surface/50 backdrop-blur-3xl border-y border-border">
        <div className="page">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-primary uppercase tracking-tighter mb-4">Why Choose Novara?</h2>
            <p className="text-muted font-bold uppercase tracking-widest text-xs">Built on three pillars of excellence</p>
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
              <h2 className="text-4xl md:text-6xl font-black text-primary leading-tight mb-8">
                Wondering <span className="text-brand">Where to Sell</span> Your Products?
              </h2>
              <div className="space-y-8">
                <p className="text-lg text-secondary leading-relaxed">
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
                      <p className="text-secondary font-bold">{text}</p>
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
      <section className="py-32 bg-primary text-surface rounded-[4rem] mx-4 md:mx-10 mb-20 overflow-hidden relative">
        <div className="page relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
              The Hub for <br/> <span className="text-brand-300">Trusted Vendors.</span>
            </h2>
            <p className="text-xl text-surface/70 font-medium leading-relaxed">
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
              <div key={i} className="p-8 bg-surface/5 rounded-[2.5rem] border border-surface/10 hover:bg-surface/10 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-brand/20 flex items-center justify-center text-brand-300 mb-6">
                  <item.icon size={24} />
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight mb-2">{item.label}</h4>
                <p className="text-surface/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-20 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="currentColor" />)}
            </div>
            <p className="text-surface/50 font-bold uppercase tracking-[0.3em] text-xs">Trusted by over 50,000 customers</p>
          </div>
        </div>

        {/* Decorative mask */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand/5 -skew-x-12 translate-x-1/2 pointer-events-none" />
      </section>

      {/* ── SEO FAQ SECTION ─────────────────────────────────────── */}
      <section className="py-24 page">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-primary mb-12 uppercase tracking-tighter text-center">Frequently Asked Questions</h2>
          <div className="space-y-12">
            <div>
              <h4 className="text-lg font-black text-primary mb-3">Where can I sell my handmade products online?</h4>
              <p className="text-secondary leading-relaxed font-medium">Novara Quickbuy is the perfect platform for artisans and makers. We specialize in video-first discovery, allowing you to show the craftsmanship behind your products, which builds more trust than traditional photos.</p>
            </div>
            <div>
              <h4 className="text-lg font-black text-primary mb-3">How do I find trusted vendors in Ghana and Africa?</h4>
              <p className="text-secondary leading-relaxed font-medium">Our platform features a "Verified Only" filter and clear verification badges. We vet our vendors based on their business registration and track record of successful deliveries to ensure your peace of mind.</p>
            </div>
            <div>
              <h4 className="text-lg font-black text-primary mb-3">Is Novara Quickbuy safe for online shopping?</h4>
              <p className="text-secondary leading-relaxed font-medium">Absolutely. We use industry-standard encryption for all transactions and offer built-in communication tools so you can talk to sellers directly before making a purchase.</p>
            </div>
            <div>
              <h4 className="text-lg font-black text-primary mb-3">Can I sell globally on Novara?</h4>
              <p className="text-secondary leading-relaxed font-medium">Yes! Novara supports multi-currency payments and global shipping integrations, making it a powerful choice for businesses looking to expand beyond their local borders.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Download Section ─────────────────────────────────────── */}
      <section id="download" className="py-24 bg-surface/50 backdrop-blur-3xl border-y border-border">
        <div className="page">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 text-brand rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6"
            >
              <Download size={13} /> Get the App
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-black text-primary uppercase tracking-tighter mb-4">
              Novara on Every Device
            </h2>
            <p className="text-muted font-bold uppercase tracking-widest text-xs">
              Mac · Windows · Android · iPhone
            </p>
          </div>

          {/* Detected platform — big hero CTA */}
          {platform && PLATFORM_CONFIG[platform] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-lg mx-auto mb-16"
            >
              <button
                id={`download-hero-${platform}`}
                onClick={() => openDownload(
                  platform,
                  PLATFORM_CONFIG[platform].href,
                  platform === 'ios'
                )}
                className="group w-full flex flex-col items-center gap-3 p-8 bg-brand text-white rounded-[2.5rem] shadow-2xl shadow-brand/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                {PLATFORM_CONFIG[platform].badge && (
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/20 px-3 py-1 rounded-full">
                    {PLATFORM_CONFIG[platform].badge}
                  </span>
                )}
                <span className="text-2xl font-black">{PLATFORM_CONFIG[platform].label}</span>
                <span className="text-brand-100 text-sm font-medium">{PLATFORM_CONFIG[platform].sub}</span>
                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>
          )}

          {/* All platforms grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                key: 'mac',
                icon: <svg viewBox="0 0 384 512" fill="currentColor" width="40" height="40" className="text-neutral-800"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>,
                name: 'macOS',
                sub: 'Direct .dmg',
                href: DOWNLOAD_LINKS.mac,
                download: true,
              },
              {
                key: 'windows',
                icon: <svg viewBox="0 0 448 512" fill="currentColor" width="38" height="38" className="text-[#00a4ef]"><path d="M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.4H0v149.9zm203.8 28L448 480V268.4H203.8v177.9zm0-380.6v180.1H448V32L203.8 65.7z"/></svg>,
                name: 'Windows',
                sub: 'Direct .exe installer',
                href: DOWNLOAD_LINKS.windows,
                download: true,
              },
              {
                key: 'android',
                icon: <svg viewBox="0 0 512 512" fill="currentColor" width="42" height="42" className="text-[#3DDC84]"><path d="M325.3 234.3c-6.5 0-11.8-5.3-11.8-11.8 0-6.5 5.3-11.8 11.8-11.8 6.5 0 11.8 5.3 11.8 11.8 0 6.5-5.3 11.8-11.8 11.8zm-138.6 0c-6.5 0-11.8-5.3-11.8-11.8 0-6.5 5.3-11.8 11.8-11.8 6.5 0 11.8 5.3 11.8 11.8 0 6.5-5.3 11.8-11.8 11.8zm231.8-85.3l37.2-64.4c1.3-2.3.5-5.3-1.8-6.6-2.3-1.3-5.3-.5-6.6 1.8L409 146c-44-19.6-92.4-30.5-144-30.5s-100 10.9-144 30.5l-38.4-66.2c-1.3-2.3-4.3-3.1-6.6-1.8-2.3 1.3-3.1 4.3-1.8 6.6l37.2 64.4C44.7 186 0 252.1 0 330.8h512c0-78.7-44.7-144.8-111.5-181.8z"/></svg>,
                name: 'Android',
                sub: 'Direct .apk sideload',
                href: DOWNLOAD_LINKS.android,
                download: true,
              },
              {
                key: 'ios',
                icon: <svg viewBox="0 0 384 512" fill="currentColor" width="40" height="40" className="text-neutral-800"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>,
                name: 'iPhone',
                sub: 'TestFlight beta',
                href: DOWNLOAD_LINKS.ios,
                download: false,
              },
            ].map(({ key, icon, name, sub, href, download: isDirect }) => (
              <motion.button
                key={key}
                id={`download-card-${key}`}
                onClick={() => openDownload(key, href, !isDirect)}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`flex flex-col items-center justify-center text-center gap-3 p-6 rounded-[2rem] border transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer
                  ${ platform === key
                    ? 'bg-brand/10 border-brand/30 ring-2 ring-brand/20'
                    : 'bg-white border-neutral-100'
                  }`}
              >
                <div className="flex items-center justify-center h-12 w-12">{icon}</div>
                <div className="text-center">
                  <p className="font-black text-primary text-sm uppercase tracking-tight">{name}</p>
                  <p className="text-muted text-xs font-medium mt-1">{sub}</p>
                </div>
                {platform === key && (
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-brand bg-brand/10 px-2 py-1 rounded-full">
                    Your Device
                  </span>
                )}
              </motion.button>
            ))}
          </div>

          {/* Android sideload note */}
          <p className="text-center text-xs text-muted font-medium mt-8 max-w-md mx-auto">
            Android users: after downloading the APK, go to <strong>Settings → Install unknown apps</strong> and enable it for your browser to complete the install.
          </p>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────── */}
      <section className="py-32 text-center page">
        <h2 className="text-4xl md:text-6xl font-black text-primary mb-8 leading-tight">Ready to Join the Revolution?</h2>
        <p className="text-xl text-secondary mb-12 max-w-2xl mx-auto font-medium">Start your journey today—whether you're looking to buy the best or sell your best.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link href="/register" className="px-12 py-6 bg-brand text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all">
            Join as a Vendor
          </Link>
          <Link href="/feed" className="px-12 py-6 bg-surface-2 text-primary border border-border rounded-[2.5rem] font-black uppercase tracking-widest hover:bg-surface-3 active:scale-95 transition-all">
            Browse the Market
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="py-12 border-t border-border bg-surface">
        <div className="page flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-muted text-sm font-medium">© 2026 Novara Quickbuy. All rights reserved.</p>
          <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
            <Link href="/terms" className="hover:text-brand transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-brand transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-brand transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>

      {/* ── Download Progress Modal ──────────────────────────────── */}
      {dlModal && (
        <DownloadProgressModal
          platform={dlModal.platform}
          onClose={() => setDlModal(null)}
          onStartDownload={handleActualDownload}
        />
      )}
    </>
  )
}