'use client'
// FILE: src/components/vendor/import/ImportUploader.jsx

import { useState, useRef, useCallback } from 'react'
import {
  Upload, FileText, Table2, Braces,
  ClipboardPaste, Loader2, AlertCircle, X,
} from 'lucide-react'
import { cn } from '@/utils/cn'

const FORMAT_TABS = [
  { value: 'csv',   label: 'CSV',    icon: FileText,       accept: '.csv,text/csv' },
  { value: 'xlsx',  label: 'Excel',  icon: Table2,         accept: '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { value: 'json',  label: 'JSON',   icon: Braces,         accept: '.json,application/json' },
  { value: 'paste', label: 'Paste',  icon: ClipboardPaste, accept: null },
]

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines   = text.trim().split(/\r?\n/)
  if (lines.length < 2) return { headers: [], rows: [], error: 'File must have a header row and at least one data row' }

  const parseRow = (line) => {
    const cells = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') { inQ = !inQ; continue }
      if (c === ',' && !inQ) { cells.push(cur.trim()); cur = ''; continue }
      cur += c
    }
    cells.push(cur.trim())
    return cells
  }

  const headers = parseRow(lines[0])
  const rows    = lines.slice(1)
    .filter(l => l.trim())
    .map(l => {
      const cells = parseRow(l)
      return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']))
    })

  return { headers, rows }
}

// ── JSON parser ───────────────────────────────────────────────────────────────
function parseJSON(text) {
  try {
    const parsed = JSON.parse(text)
    const arr    = Array.isArray(parsed) ? parsed : parsed.products ?? parsed.data ?? []
    if (!arr.length) return { headers: [], rows: [], error: 'JSON must be an array of objects' }
    const headers = Object.keys(arr[0])
    return { headers, rows: arr }
  } catch {
    return { headers: [], rows: [], error: 'Invalid JSON — must be an array of product objects' }
  }
}

// ── Tab-separated paste parser ────────────────────────────────────────────────
function parsePaste(text) {
  const lines   = text.trim().split(/\r?\n/)
  if (lines.length < 2) return { headers: [], rows: [], error: 'Paste must have a header row and data rows' }
  const sep     = lines[0].includes('\t') ? '\t' : ','
  const headers = lines[0].split(sep).map(h => h.trim())
  const rows    = lines.slice(1).filter(l => l.trim()).map(l => {
    const cells = l.split(sep)
    return Object.fromEntries(headers.map((h, i) => [h, cells[i]?.trim() ?? '']))
  })
  return { headers, rows }
}

export default function ImportUploader({ onParsed, loading }) {
  const [format,    setFormat]    = useState('csv')
  const [dragging,  setDragging]  = useState(false)
  const [parseErr,  setParseErr]  = useState(null)
  const [filename,  setFilename]  = useState(null)
  const [pasteText, setPasteText] = useState('')
  const inputRef = useRef(null)

  const handleParsed = useCallback((result, name) => {
    setParseErr(null)
    if (result.error) { setParseErr(result.error); return }
    if (!result.rows?.length) { setParseErr('No data rows found in file'); return }
    setFilename(name)
    onParsed(result)
  }, [onParsed])

  const readFile = useCallback(async (file) => {
    setParseErr(null)
    setFilename(null)

    if (format === 'csv') {
      const text = await file.text()
      handleParsed(parseCSV(text), file.name)
      return
    }

    if (format === 'json') {
      const text = await file.text()
      handleParsed(parseJSON(text), file.name)
      return
    }

    if (format === 'xlsx') {
      // Dynamically import SheetJS
      try {
        const XLSX = await import('xlsx')
        const buf  = await file.arrayBuffer()
        const wb   = XLSX.read(buf, { type: 'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const raw  = XLSX.utils.sheet_to_json(ws, { defval: '' })
        if (!raw.length) { setParseErr('No data found in Excel file'); return }
        const headers = Object.keys(raw[0])
        handleParsed({ headers, rows: raw }, file.name)
      } catch {
        setParseErr('Could not read Excel file. Make sure it is a valid .xlsx file.')
      }
      return
    }
  }, [format, handleParsed])

  const handleFileInput = (e) => {
    if (e.target.files?.[0]) readFile(e.target.files[0])
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.[0]) readFile(e.dataTransfer.files[0])
  }

  const handlePaste = () => {
    if (!pasteText.trim()) { setParseErr('Paste some data first'); return }
    handleParsed(parsePaste(pasteText), 'pasted-data')
  }

  const currentFormat = FORMAT_TABS.find(f => f.value === format)

  return (
    <div className="space-y-5">

      {/* Format tabs */}
      <div className="flex items-center bg-surface-2 border border-border rounded-xl p-1 gap-1 shadow-sm w-fit">
        {FORMAT_TABS.map(f => {
          const Icon = f.icon
          return (
            <button
              key={f.value}
              onClick={() => { setFormat(f.value); setParseErr(null); setFilename(null) }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all',
                format === f.value
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-muted hover:text-primary hover:bg-surface-3',
              )}
            >
              <Icon size={13} /> {f.label}
            </button>
          )
        })}
      </div>

      {/* File drop zone */}
      {format !== 'paste' ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !loading && inputRef.current?.click()}
          className={cn(
            'relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer',
            dragging  ? 'border-brand bg-brand/10 scale-[1.01]'
                      : filename ? 'border-emerald-500 bg-emerald-500/10'
                      : parseErr ? 'border-danger/40 bg-danger/10'
                      : 'border-border bg-surface-2 hover:border-brand-300 hover:bg-brand/5',
            loading && 'pointer-events-none opacity-70',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={currentFormat?.accept}
            onChange={handleFileInput}
            className="hidden"
          />

          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={36} className="text-brand animate-spin" />
              <p className="text-sm font-bold text-primary">Processing your file…</p>
            </div>
          ) : filename ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <currentFormat.icon size={26} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">{filename}</p>
                <p className="text-xs text-emerald-600 mt-0.5">File loaded — review below</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setFilename(null); onParsed(null) }}
                className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-danger transition-colors"
              >
                <X size={12} /> Clear file
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center transition-all border shadow-sm',
                dragging ? 'bg-brand text-white border-brand scale-110' : 'bg-surface-3 text-muted border-border',
              )}>
                <Upload size={26} />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-800">
                  {dragging ? `Drop your ${currentFormat?.label} file here` : `Drag & drop your ${currentFormat?.label} file`}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  or <span className="text-brand font-semibold underline">click to browse</span>
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Paste zone */
        <div className="space-y-3">
          <textarea
            rows={8}
            placeholder={`Paste your spreadsheet data here.\n\nMake sure the first row is a header row.\nTab-separated (copied from Google Sheets / Excel) or comma-separated both work.\n\nExample:\nname\tprice\tstock_quantity\tsku\nCotton T-Shirt\t29.99\t50\tSHIRT-M`}
            value={pasteText}
            onChange={e => { setPasteText(e.target.value); setParseErr(null) }}
            className="w-full rounded-2xl border border-border hover:border-brand/40 bg-surface-2 px-5 py-4 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all font-mono resize-none color-scheme-dark"
          />
          <button
            onClick={handlePaste}
            disabled={!pasteText.trim() || loading}
            className="flex items-center gap-2 px-5 py-3 bg-brand text-white font-bold rounded-xl text-sm shadow-brand hover:bg-brand-700 disabled:opacity-50 transition-all"
          >
            <ClipboardPaste size={15} /> Parse Data
          </button>
        </div>
      )}

      {/* Error */}
      {parseErr && (
        <div className="flex items-start gap-2.5 bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 shadow-sm">
          <AlertCircle size={15} className="text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-danger font-bold">{parseErr}</p>
        </div>
      )}
    </div>
  )
}