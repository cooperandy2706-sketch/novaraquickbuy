'use client'
// FILE: src/components/global/DownloadProgressModal.jsx

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, Download, Sparkles, Zap, Shield, Rocket } from 'lucide-react'

import { LogoIcon } from '@/components/brand/Logo'

// ── Icons ──────────────────────────────────────────────────────────────────────
const ICONS = {
  mac: <svg viewBox="0 0 384 512" fill="currentColor" width="40" height="40"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>,
  windows: <svg viewBox="0 0 448 512" fill="currentColor" width="38" height="38"><path d="M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.4H0v149.9zm203.8 28L448 480V268.4H203.8v177.9zm0-380.6v180.1H448V32L203.8 65.7z"/></svg>,
  android: <svg viewBox="0 0 512 512" fill="currentColor" width="42" height="42"><path d="M325.3 234.3c-6.5 0-11.8-5.3-11.8-11.8 0-6.5 5.3-11.8 11.8-11.8 6.5 0 11.8 5.3 11.8 11.8 0 6.5-5.3 11.8-11.8 11.8zm-138.6 0c-6.5 0-11.8-5.3-11.8-11.8 0-6.5 5.3-11.8 11.8-11.8 6.5 0 11.8 5.3 11.8 11.8 0 6.5-5.3 11.8-11.8 11.8zm231.8-85.3l37.2-64.4c1.3-2.3.5-5.3-1.8-6.6-2.3-1.3-5.3-.5-6.6 1.8L409 146c-44-19.6-92.4-30.5-144-30.5s-100 10.9-144 30.5l-38.4-66.2c-1.3-2.3-4.3-3.1-6.6-1.8-2.3 1.3-3.1 4.3-1.8 6.6l37.2 64.4C44.7 186 0 252.1 0 330.8h512c0-78.7-44.7-144.8-111.5-181.8z"/></svg>,
  novara: <LogoIcon size={40} className="text-white" variant="badge" />
}

// ── Staged download messages per platform ──────────────────────────────────────
const PLATFORM_MESSAGES = {
  mac: [
    { icon: ICONS.mac, text: 'Preparing your macOS package…', sub: 'Apple Silicon & Intel ready' },
    { icon: ICONS.mac, text: 'Bundling the .dmg file…', sub: 'Compressing assets' },
    { icon: ICONS.mac, text: 'Signing & notarizing with Apple…', sub: 'Gatekeeper approved' },
    { icon: ICONS.mac, text: 'Turbo-charging the download…', sub: 'Almost at full speed' },
    { icon: ICONS.mac, text: 'Your download has started!', sub: 'Check your Downloads folder' },
  ],
  windows: [
    { icon: ICONS.windows, text: 'Building your Windows installer…', sub: 'NSIS packager running' },
    { icon: ICONS.windows, text: 'Bundling app resources…', sub: 'Packing DLLs & assets' },
    { icon: ICONS.windows, text: 'Running security scan…', sub: 'SmartScreen approved ✓' },
    { icon: ICONS.windows, text: 'Pushing bits to your machine…', sub: 'Download accelerating' },
    { icon: ICONS.windows, text: 'Your download has started!', sub: 'Run the .exe to install' },
  ],
  android: [
    { icon: ICONS.android, text: 'Assembling your Android APK…', sub: 'Gradle build complete' },
    { icon: ICONS.android, text: 'Optimising APK size…', sub: 'ProGuard minifying' },
    { icon: ICONS.android, text: 'Signing the release keystore…', sub: 'v2 Signature scheme' },
    { icon: ICONS.android, text: 'Sending APK your way…', sub: 'No Play Store needed ⚡' },
    { icon: ICONS.android, text: 'Your download has started!', sub: 'Enable "Unknown Sources" to install' },
  ],
  ios: [
    { icon: ICONS.mac, text: 'Opening TestFlight portal…', sub: 'Redirecting to Apple' },
    { icon: ICONS.mac, text: 'Preparing beta invite…', sub: 'One tap to join' },
    { icon: ICONS.mac, text: 'Verifying beta credentials…', sub: 'TestFlight approved ✓' },
    { icon: ICONS.mac, text: 'Redirecting you now…', sub: 'Install via TestFlight app' },
    { icon: ICONS.mac, text: 'Opening TestFlight!', sub: 'Accept the invite to install' },
  ],
  other: [
    { icon: ICONS.novara, text: 'Locating best package for you…', sub: 'Detecting your OS' },
    { icon: ICONS.novara, text: 'Preparing download…', sub: 'Fetching latest release' },
    { icon: ICONS.novara, text: 'Almost ready…', sub: 'Optimizing for your device' },
    { icon: ICONS.novara, text: 'Ready!', sub: 'Download starting now' },
  ],
}

const PLATFORM_LABELS = {
  mac:     { name: 'macOS',   color: 'from-neutral-800 to-neutral-600', accent: '#555' },
  windows: { name: 'Windows', color: 'from-[#00a4ef] to-[#0067b8]',    accent: '#00a4ef' },
  android: { name: 'Android', color: 'from-[#3DDC84] to-[#1a9b54]',    accent: '#3DDC84' },
  ios:     { name: 'iOS',     color: 'from-neutral-800 to-neutral-600', accent: '#888' },
  other:   { name: 'Novara',  color: 'from-brand to-brand-300',         accent: 'var(--brand)' },
}

// ── Particle burst helper ──────────────────────────────────────────────────────
function Particle({ delay, color }) {
  const angle  = Math.random() * 360
  const dist   = 60 + Math.random() * 60
  const x      = Math.cos((angle * Math.PI) / 180) * dist
  const y      = Math.sin((angle * Math.PI) / 180) * dist
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full pointer-events-none"
      style={{ background: color, top: '50%', left: '50%' }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x, y, opacity: 0, scale: 0 }}
      transition={{ duration: 0.8, delay, ease: 'easeOut' }}
    />
  )
}

// ── Main modal ─────────────────────────────────────────────────────────────────
export default function DownloadProgressModal({ platform, onClose, onStartDownload }) {
  const messages     = PLATFORM_MESSAGES[platform] || PLATFORM_MESSAGES.other
  const config       = PLATFORM_LABELS[platform]   || PLATFORM_LABELS.other
  const totalStages  = messages.length

  const [stage,    setStage]    = useState(0)       // current message index
  const [progress, setProgress] = useState(0)       // 0–100
  const [done,     setDone]     = useState(false)
  const [burst,    setBurst]    = useState(false)
  const downloadTriggered       = useRef(false)

  // Advance stages on a realistic timeline
  useEffect(() => {
    if (done) return
    const durations = [700, 900, 800, 600, 0]        // ms per stage

    let cancelled = false
    const advance = (idx) => {
      if (cancelled || idx >= totalStages) return
      const duration = durations[idx] ?? 700

      // Animate progress within this stage
      const start    = (idx / totalStages) * 100
      const end      = ((idx + 1) / totalStages) * 100
      const ticks    = 40
      let tick       = 0

      const interval = setInterval(() => {
        tick++
        const p = start + ((end - start) * tick) / ticks
        setProgress(Math.min(p, end))
        if (tick >= ticks) {
          clearInterval(interval)
          if (idx + 1 < totalStages) {
            setStage(idx + 1)
            setTimeout(() => advance(idx + 1), 80)
          } else {
            // Done!
            setProgress(100)
            setDone(true)
            setBurst(true)
            setTimeout(() => setBurst(false), 900)
            // Trigger the actual download/redirect
            if (!downloadTriggered.current) {
              downloadTriggered.current = true
              onStartDownload?.()
            }
          }
        }
      }, duration / ticks)
    }
    advance(0)
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const current = messages[stage]

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={done ? onClose : undefined}
      >
        {/* Modal card */}
        <motion.div
          key="card"
          className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl overflow-hidden"
          initial={{ opacity: 0, y: 60, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gradient header bar */}
          <div className={`h-2 w-full bg-gradient-to-r ${config.color}`} />

          {/* Close btn (only when done) */}
          <AnimatePresence>
            {done && (
              <motion.button
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-all z-10"
              >
                <X size={14} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Body */}
          <div className="p-8">
            {/* Icon area */}
            <div className="relative flex items-center justify-center mb-8">
              {/* Particle burst */}
              {burst && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <Particle key={i} delay={i * 0.03} color={config.accent} />
                  ))}
                </div>
              )}

              {/* Icon circle with ring animation */}
              <motion.div
                className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${config.color} text-white flex items-center justify-center shadow-2xl`}
                animate={done ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                {/* Rotating ring while downloading */}
                {!done && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-transparent"
                    style={{ borderTopColor: config.accent, borderRightColor: `${config.accent}80` }}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                  />
                )}

                <AnimatePresence mode="wait">
                  {done ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <CheckCircle2 size={44} className="text-white" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`icon-${stage}`}
                      className="flex items-center justify-center"
                      initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                      transition={{ duration: 0.25 }}
                    >
                      {current.icon}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Pulsing glow behind icon */}
              {!done && (
                <motion.div
                  className="absolute w-24 h-24 rounded-full opacity-30"
                  style={{ background: config.accent }}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                />
              )}
            </div>

            {/* Text */}
            <div className="text-center mb-6 min-h-[60px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={done ? 'done' : `stage-${stage}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xl font-black text-neutral-900 dark:text-white mb-1">
                    {done ? messages[totalStages - 1].text : current.text}
                  </p>
                  <p className="text-sm text-neutral-500 font-medium">
                    {done ? messages[totalStages - 1].sub : current.sub}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress track */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-neutral-400 font-bold uppercase tracking-widest mb-2">
                <span>{config.name} Package</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${config.color} relative overflow-hidden`}
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: 'linear', duration: 0.12 }}
                >
                  {/* Shimmer sweep */}
                  {!done && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
                    />
                  )}
                </motion.div>
              </div>
            </div>

            {/* Stage dots */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {messages.map((_, i) => (
                <motion.div
                  key={i}
                  className="rounded-full"
                  animate={{
                    width:      i <= stage ? 20 : 8,
                    background: i < stage
                      ? config.accent
                      : i === stage
                        ? config.accent
                        : '#e5e7eb',
                    opacity: i <= stage ? 1 : 0.4,
                  }}
                  style={{ height: 8 }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>

            {/* CTA */}
            <AnimatePresence>
              {done ? (
                <motion.button
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  onClick={onClose}
                  className={`w-full py-4 rounded-[1.25rem] font-black uppercase tracking-widest text-sm text-white bg-gradient-to-r ${config.color} shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2`}
                >
                  <Sparkles size={16} /> Awesome, Close!
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2 text-xs text-neutral-400 font-medium"
                >
                  <Shield size={12} />
                  Secure · Verified · Official Release
                  <Zap size={12} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
