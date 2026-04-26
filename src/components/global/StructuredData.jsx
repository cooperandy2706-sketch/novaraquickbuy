'use client'
// FILE: src/components/global/StructuredData.jsx

export default function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Novara Quickbuy",
    "url": "https://novaraquickbuy.vercel.app",
    "description": "The best place to sell products and buy from trusted vendors globally.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://novaraquickbuy.vercel.app/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  }

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Novara Quickbuy",
    "url": "https://novaraquickbuy.vercel.app",
    "logo": "https://novaraquickbuy.vercel.app/novara-icon.svg",
    "sameAs": [
      "https://facebook.com/novaraquickbuy",
      "https://twitter.com/novaraquickbuy",
      "https://instagram.com/novaraquickbuy"
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
    </>
  )
}
