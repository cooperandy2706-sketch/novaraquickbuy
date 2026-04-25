export const LOW_STOCK_THRESHOLD = 5
export const getStockStatus     = (qty) => qty === 0 ? 'out_of_stock' : qty <= LOW_STOCK_THRESHOLD ? 'low_stock' : 'in_stock'
export const getStockBadgeColor = (qty) => ({ out_of_stock:'bg-red-100 text-red-800', low_stock:'bg-yellow-100 text-yellow-800', in_stock:'bg-green-100 text-green-800' })[getStockStatus(qty)]
export const getStockLabel      = (qty) => qty === 0 ? 'Out of Stock' : qty <= LOW_STOCK_THRESHOLD ? `Low Stock (${qty} left)` : `In Stock (${qty})`
