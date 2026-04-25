export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/vendor/', '/checkout/', '/cart/'] },
    ],
    sitemap: 'https://novara.app/sitemap.xml',
  }
}
