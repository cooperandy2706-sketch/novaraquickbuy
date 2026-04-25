const REQUIRED = ['name', 'price', 'stock_quantity', 'category', 'sku']
 
export const validateImportRows = (rows) => {
  const valid = [], errors = [], seenSkus = new Set()
  rows.forEach((row, i) => {
    const rowNum = i + 2
    const rowErrors = []
    for (const f of REQUIRED) {
      if (row[f] === undefined || row[f] === '')
        rowErrors.push({ row: rowNum, field: f, message: `"${f}" is required` })
    }
    if (row.price && (isNaN(Number(row.price)) || Number(row.price) <= 0))
      rowErrors.push({ row: rowNum, field: 'price', message: 'Must be a positive number' })
    if (row.stock_quantity !== undefined && !Number.isInteger(Number(row.stock_quantity)))
      rowErrors.push({ row: rowNum, field: 'stock_quantity', message: 'Must be a whole number' })
    if (row.sku && seenSkus.has(String(row.sku)))
      rowErrors.push({ row: rowNum, field: 'sku', message: `Duplicate SKU: "${row.sku}"` })
    else if (row.sku) seenSkus.add(String(row.sku))
    if (rowErrors.length) errors.push(...rowErrors)
    else valid.push({
      name: String(row.name), description: row.description ? String(row.description) : '',
      price: Number(row.price),
      stock_quantity: Number(row.stock_quantity),
      category: String(row.category),
      sku: String(row.sku)
    })
  })
  return { valid, errors }
}
