// Next.js auto-generates /sitemap.xml from this file
// Add dynamic product and storefront URLs here for Google indexing
export default function sitemap() {
  return [
    { url: 'https://novara.app',         lastModified: new Date(), changeFrequency: 'daily',   priority: 1 },
    { url: 'https://novara.app/explore', lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: 'https://novara.app/feed',    lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.8 },
    // TODO: dynamically add /product/[id] and /store/[vendorId] URLs from DB
  ]
}
