'use client'
import { useState, Suspense } from 'react'
import { useSearchParams }    from 'next/navigation'
import { Package, Search as SearchIcon, SlidersHorizontal } from 'lucide-react'
import { useSearch }       from '@/hooks/useSearch'
import { useLocaleStore }  from '@/store/localeStore'
import ProductCard         from '@/components/product/ProductCard'
import ProductModal        from '@/components/explore/ProductModal'
import { cn }              from '@/utils/cn'

function SearchContent() {
  const searchParams = useSearchParams()
  const query        = searchParams.get('q') || ''
  const { country }  = useLocaleStore()
  
  const { results, loading, hasMore, loadMore } = useSearch(query, country)
  const [selectedProduct, setSelectedProduct] = useState(null)

  return (
    <div className="min-h-screen bg-surface">
      {/* Header / Summary */}
      <div className="sticky top-[56px] z-20 bg-surface/95 backdrop-blur-md border-b border-border py-4">
        <div className="page flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-muted text-xs font-medium mb-1">
              <SearchIcon size={12} />
              <span>Search Results</span>
            </div>
            <h1 className="text-xl font-bold text-primary flex items-center gap-2">
              {query ? `"${query}"` : 'All Products'}
              {country !== 'all' && (
                <span className="text-xs font-normal text-muted px-2 py-0.5 bg-surface-2 rounded-full border border-border">
                  in {country}
                </span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-2">
             <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-surface text-secondary text-xs font-semibold hover:bg-surface-2 transition-all">
                <SlidersHorizontal size={14} />
                Filters
             </button>
          </div>
        </div>
      </div>

      <div className="page py-8">
        {loading && results.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-pulse">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-surface-2 rounded-2xl border border-border" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-20 h-20 rounded-3xl bg-surface-2 border border-border flex items-center justify-center text-4xl shadow-sm">
              🔍
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-primary">No results found</h2>
              <p className="text-sm text-muted max-w-xs">
                We couldn't find any products matching "{query}" in {country === 'all' ? 'any country' : country}.
              </p>
            </div>
            <button 
              onClick={() => window.history.back()}
              className="mt-2 btn btn-secondary btn-sm px-6"
            >
              Go Back
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {results.map((product, idx) => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  onOpen={setSelectedProduct}
                  style={{ animationDelay: `${Math.min(idx % 10, 9) * 50}ms` }}
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-12">
                <button 
                  onClick={loadMore}
                  disabled={loading}
                  className="btn btn-secondary px-8"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
            
            {!hasMore && results.length > 0 && (
              <div className="text-center py-12 text-muted text-sm">
                <div className="w-12 h-0.5 bg-border mx-auto mb-4" />
                You've reached the end of the results
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="page py-10 animate-pulse">
        <div className="h-8 w-48 bg-surface-2 rounded-lg mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="aspect-[3/4] bg-surface-2 rounded-2xl" />)}
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}