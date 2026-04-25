// FILE: src/app/(customer)/explore/[category]/page.jsx
import ExplorePage from '@/components/explore/ExplorePage'

export async function generateMetadata({ params }) {
  const cat = params.category.charAt(0).toUpperCase() + params.category.slice(1)
  return {
    title:       `${cat} — Explore Novara Quickbuy`,
    description: `Shop ${cat.toLowerCase()} products from verified vendors.`,
  }
}

export default function CategoryExplorePage({ params }) {
  return <ExplorePage defaultCategory={params.category} />
}