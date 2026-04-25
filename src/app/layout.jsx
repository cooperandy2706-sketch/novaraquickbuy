// FILE: src/app/layout.jsx

import { Plus_Jakarta_Sans, Noto_Sans_Arabic } from 'next/font/google'
import { Toaster }    from 'react-hot-toast'
import Providers      from '@/components/Providers'
import '@/app/globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets:  ['latin'],
  weight:   ['300', '400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display:  'swap',
})

const notoArabic = Noto_Sans_Arabic({
  subsets:  ['arabic'],
  weight:   ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display:  'swap',
})

export const metadata = {
  metadataBase: new URL('https://novaraquickbuy.vercel.app'),
  title: {
    default:  'Novara Quickbuy — Shop. Discover. Connect.',
    template: '%s | Novara Quickbuy',
  },
  description: 'Global social commerce marketplace. Discover products through video.',
  icons: {
    icon:  '/novara-icon.svg',
    apple: '/novara-icon.svg',
  },
  manifest: '/manifest.json',
}

export const viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#16A34A' },
    { media: '(prefers-color-scheme: dark)',  color: '#052E16' },
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${notoArabic.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              background:   '#14532D',
              color:        '#F0FDF4',
              borderRadius: '12px',
              fontSize:     '14px',
              fontWeight:   '500',
              padding:      '12px 16px',
              boxShadow:    '0 8px 24px rgba(22,163,74,0.25)',
            },
            success: { iconTheme: { primary: '#86EFAC', secondary: '#14532D' } },
            error: {
              style: { background: '#7F1D1D', color: '#FEE2E2' },
              iconTheme: { primary: '#FCA5A5', secondary: '#7F1D1D' },
            },
          }}
        />
      </body>
    </html>
  )
}