// FILE: src/app/layout.jsx

import { Plus_Jakarta_Sans, Noto_Sans_Arabic } from 'next/font/google'
import { Toaster }    from 'react-hot-toast'
import Providers      from '@/components/Providers'
import UpdateCheck    from '@/components/global/UpdateCheck'
import StructuredData from '@/components/global/StructuredData'
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
    default:  'Novara Quickbuy — Where to Sell & Buy from Trusted Vendors',
    template: '%s | Novara Quickbuy',
  },
  description: 'The best place to sell products and buy from trusted vendors. Novara Quickbuy is a video-driven social marketplace for discovery, community, and secure shopping.',
  openGraph: {
    title:       'Novara Quickbuy — Where to Sell & Buy from Trusted Vendors',
    description: 'Discover where to sell your products and buy from verified, trusted vendors through video reviews and community circles.',
    url:         'https://novaraquickbuy.vercel.app',
    siteName:    'Novara Quickbuy',
    images: [
      {
        url:    '/og-image.png',
        width:  1200,
        height: 630,
        alt:    'Novara Quickbuy Social Preview',
      },
    ],
    locale: 'en_US',
    type:   'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Novara Quickbuy — Where to Sell & Buy from Trusted Vendors',
    description: 'The best social marketplace to sell products and find trusted vendors worldwide.',
    images:      ['/og-image.png'],
  },
  icons: {
    icon:  '/novara-icon.svg',
    apple: '/novara-icon.svg',
  },
  manifest: '/manifest.json',
  applicationName: 'Novara Quickbuy',
  appleMobileWebAppTitle: 'Novara Quickbuy',
  appleMobileWebAppStatusBarStyle: 'default',
  formatDetection: {
    telephone: false,
  },
  category: 'shopping',
  classification: 'Marketplace',
}

export const viewport = {
  width: 'device-width', 
  initialScale: 1, 
  maximumScale: 1,
  themeColor: '#16A34A',
}

import PushNotificationProvider from '@/components/providers/PushNotificationProvider'

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${notoArabic.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          <PushNotificationProvider>
            <StructuredData />
            {children}
          </PushNotificationProvider>
        </Providers>
        <UpdateCheck />
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