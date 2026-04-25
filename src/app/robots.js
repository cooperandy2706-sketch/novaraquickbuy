export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/vendor/', '/checkout/', '/cart/'] },
    ],
    sitemap: 'https://novaraquickbuy.vercel.app/sitemap.xml',
  }
}
