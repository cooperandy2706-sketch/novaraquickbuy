import * as XLSX from 'xlsx'
import Papa from 'papaparse'
 
export const parseImportFile = (file) =>
  new Promise((resolve) => {
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext === 'csv') {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: (r) => resolve({ rows: r.data, error: null }),
        error:    (e) => resolve({ rows: [],     error: e.message }),
      })
      return
    }
    if (['xlsx','xls'].includes(ext)) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const wb   = XLSX.read(e.target.result, { type: 'binary' })
          const ws   = wb.Sheets[wb.SheetNames[0]]
          resolve({ rows: XLSX.utils.sheet_to_json(ws), error: null })
        } catch (err) { resolve({ rows: [], error: err.message }) }
      }
      reader.readAsBinaryString(file)
      return
    }
    resolve({ rows: [], error: 'Unsupported format. Use .xlsx or .csv' })
  })
