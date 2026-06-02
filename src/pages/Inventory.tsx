import { useState, useEffect, useRef } from 'react'
import { Package, AlertTriangle, Plus, Upload, RefreshCw, Pencil, Save, X, CheckCircle2, Zap, Webhook, Download, FileText } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import type { InventoryItem } from '../types'

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Widget Pro',            sku: 'WP-001', category: 'Parts & Components', quantity: 3,  reorderPoint: 20, cost: 42,  price: 89,  supplier: 'Acme Parts Co.',  lastUpdated: '2025-06-08' },
  { id: '2', name: 'Office Supplies Bundle', sku: 'OS-012', category: 'Office Supplies',    quantity: 8,  reorderPoint: 25, cost: 15,  price: 0,   supplier: 'Office Pro',      lastUpdated: '2025-06-06' },
  { id: '3', name: 'Service Kit Standard',   sku: 'SK-004', category: 'Service Kits',       quantity: 44, reorderPoint: 10, cost: 28,  price: 120, supplier: 'Internal',        lastUpdated: '2025-06-05' },
  { id: '4', name: 'Hardware Bundle A',      sku: 'HB-009', category: 'Hardware',           quantity: 17, reorderPoint: 15, cost: 195, price: 349, supplier: 'TechSource',      lastUpdated: '2025-06-04' },
  { id: '5', name: 'Cleaning Supplies',      sku: 'CS-003', category: 'Maintenance',        quantity: 2,  reorderPoint: 12, cost: 8,   price: 0,   supplier: 'CleanCo',         lastUpdated: '2025-06-03' },
  { id: '6', name: 'Premium Service Kit',    sku: 'SK-007', category: 'Service Kits',       quantity: 31, reorderPoint: 8,  cost: 65,  price: 220, supplier: 'Internal',        lastUpdated: '2025-06-02' },
  { id: '7', name: 'Safety Equipment Set',   sku: 'SE-002', category: 'Safety & PPE',       quantity: 12, reorderPoint: 5,  cost: 110, price: 0,   supplier: 'SafetyFirst Inc.',lastUpdated: '2025-06-01' },
  { id: '8', name: 'Promotional Materials',  sku: 'PM-015', category: 'Marketing Materials',quantity: 0,  reorderPoint: 50, cost: 2,   price: 0,   supplier: 'PrintHouse',      lastUpdated: '2025-05-28' },
]

// Full list of meaningful item categories — industry-agnostic
const PRESET_CATEGORIES = [
  'Parts & Components',
  'Hardware',
  'Service Kits',
  'Tools & Equipment',
  'Safety & PPE',
  'Office Supplies',
  'Cleaning & Maintenance',
  'Maintenance',
  'Raw Materials',
  'Finished Goods',
  'Packaging',
  'Marketing Materials',
  'Uniforms & Apparel',
  'Technology & Electronics',
  'Consumables',
  'Chemicals & Fluids',
  'Furniture & Fixtures',
  'Other',
]

type InvForm = {
  name: string; sku: string; category: string; customCategory: string
  quantity: string; reorderPoint: string; cost: string; price: string; supplier: string
}
const blankInvForm = (i?: InventoryItem): InvForm => ({
  name: i?.name ?? '', sku: i?.sku ?? '',
  category: i?.category ?? 'Parts & Components',
  customCategory: '',
  quantity: i?.quantity.toString() ?? '', reorderPoint: i?.reorderPoint.toString() ?? '',
  cost: i?.cost.toString() ?? '', price: i?.price.toString() ?? '', supplier: i?.supplier ?? '',
})

function stockStatus(item: InventoryItem): { label: string; variant: 'error' | 'warning' | 'success' } {
  if (item.quantity === 0)              return { label: 'Out of Stock', variant: 'error' }
  if (item.quantity <= item.reorderPoint) return { label: 'Low Stock',   variant: 'warning' }
  return { label: 'In Stock', variant: 'success' }
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

/** The expected CSV column headers (case-insensitive, flexible aliases) */
const HEADER_MAP: Record<string, keyof CsvRow> = {
  name: 'name', 'item name': 'name', 'product name': 'name', item: 'name',
  sku: 'sku', 'sku / part #': 'sku', 'part #': 'sku', 'part number': 'sku',
  category: 'category', type: 'category', 'item type': 'category',
  quantity: 'quantity', qty: 'quantity', 'qty on hand': 'quantity', stock: 'quantity',
  'reorder point': 'reorderPoint', 'reorder at': 'reorderPoint', 'min qty': 'reorderPoint', reorder: 'reorderPoint',
  'unit cost': 'cost', cost: 'cost', 'cost price': 'cost', 'purchase price': 'cost',
  'sale price': 'price', price: 'price', 'selling price': 'price', 'retail price': 'price',
  supplier: 'supplier', vendor: 'supplier', 'supplier / vendor': 'supplier',
}

type CsvRow = {
  name: string; sku: string; category: string; quantity: string
  reorderPoint: string; cost: string; price: string; supplier: string
}

type ParsedRow = CsvRow & { _row: number; _errors: string[] }

/** Parse a raw CSV string into rows, handling quoted fields and blank lines */
function parseCsv(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  return lines.map(line => {
    const fields: string[] = []
    let cur = '', inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { inQuote = !inQuote; continue }
      if (ch === ',' && !inQuote) { fields.push(cur.trim()); cur = ''; continue }
      cur += ch
    }
    fields.push(cur.trim())
    return fields
  })
}

function mapCsvRows(rows: string[][]): { parsed: ParsedRow[]; unknownHeaders: string[] } {
  if (rows.length < 2) return { parsed: [], unknownHeaders: [] }

  const rawHeaders = rows[0].map(h => h.toLowerCase().replace(/[_-]/g, ' ').trim())
  const colMap: (keyof CsvRow | null)[] = rawHeaders.map(h => HEADER_MAP[h] ?? null)
  const unknownHeaders = rawHeaders.filter((_, i) => !colMap[i])

  const parsed: ParsedRow[] = rows.slice(1).map((row, idx) => {
    const entry: CsvRow = { name: '', sku: '', category: '', quantity: '', reorderPoint: '', cost: '', price: '', supplier: '' }
    colMap.forEach((key, i) => { if (key && row[i] !== undefined) entry[key] = row[i] })
    const errors: string[] = []
    if (!entry.name.trim()) errors.push('Name is required')
    if (entry.quantity && isNaN(Number(entry.quantity))) errors.push('Quantity must be a number')
    if (entry.cost && isNaN(Number(entry.cost))) errors.push('Cost must be a number')
    if (entry.price && isNaN(Number(entry.price))) errors.push('Price must be a number')
    return { ...entry, _row: idx + 2, _errors: errors }
  }).filter(r => r.name.trim() || r.sku.trim())

  return { parsed, unknownHeaders }
}

function downloadTemplate() {
  const header = 'Name,SKU,Category,Quantity,Reorder Point,Unit Cost,Sale Price,Supplier'
  const example = 'Widget Pro,WP-001,Parts & Components,50,10,42.00,89.99,Acme Parts Co.'
  const blob = new Blob([header + '\n' + example], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'bizops_inventory_template.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_INVENTORY)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<InvForm>(blankInvForm())
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState<InvForm>(blankInvForm())
  const [search, setSearch] = useState('')

  // ── CSV import state ──────────────────────────────────────────────────────
  const csvInputRef = useRef<HTMLInputElement>(null)
  const [csvOpen, setCsvOpen]             = useState(false)
  const [csvRows, setCsvRows]             = useState<ParsedRow[]>([])
  const [csvFileName, setCsvFileName]     = useState('')
  const [csvUnknown, setCsvUnknown]       = useState<string[]>([])
  const [csvImported, setCsvImported]     = useState(false)
  const [csvSelected, setCsvSelected]     = useState<Set<number>>(new Set())

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFileName(file.name)
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const rows = parseCsv(text)
      const { parsed, unknownHeaders } = mapCsvRows(rows)
      setCsvRows(parsed)
      setCsvUnknown(unknownHeaders)
      setCsvSelected(new Set(parsed.map((_, i) => i).filter(i => parsed[i]._errors.length === 0)))
      setCsvImported(false)
      setCsvOpen(true)
    }
    reader.readAsText(file)
    // reset so same file can be re-uploaded
    e.target.value = ''
  }

  const handleCsvImport = () => {
    const toImport = csvRows.filter((_, i) => csvSelected.has(i))
    const newItems: InventoryItem[] = toImport.map(r => ({
      id: `csv-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name:         r.name.trim(),
      sku:          r.sku.trim() || `SKU-${Date.now()}`,
      category:     r.category.trim() || 'Other',
      quantity:     Math.max(0, Number(r.quantity) || 0),
      reorderPoint: Math.max(0, Number(r.reorderPoint) || 0),
      cost:         Math.max(0, Number(r.cost) || 0),
      price:        Math.max(0, Number(r.price) || 0),
      supplier:     r.supplier.trim() || undefined,
      lastUpdated:  new Date().toISOString().slice(0, 10),
    }))
    setItems(prev => [...prev, ...newItems])
    setCsvImported(true)
    pushToPos('CSV import', `${newItems.length} items`)
  }

  const toggleCsvRow = (i: number) => setCsvSelected(prev => {
    const next = new Set(prev)
    next.has(i) ? next.delete(i) : next.add(i)
    return next
  })

  // ── POS sync state ────────────────────────────────────────────────────────
  const [syncOpen, setSyncOpen]       = useState(false)
  const [syncForm, setSyncForm]       = useState({ platform: 'Square', customPlatform: '', apiKey: '', locationId: '', webhookSecret: '' })
  const [posConnection, setPosConnection] = useState<{ platform: string; lastSync: string } | null>(null)
  const [isSyncing, setIsSyncing]     = useState(false)
  const [syncToast, setSyncToast]     = useState<string | null>(null)
  const [syncLogs, setSyncLogs]       = useState<{ id: string; action: string; time: Date; ok: boolean }[]>([])
  const [connectSuccess, setConnectSuccess] = useState(false)

  const isOtherPOS = syncForm.platform === 'Other'
  const resolvedPlatform = isOtherPOS ? syncForm.customPlatform.trim() : syncForm.platform

  useEffect(() => {
    if (!syncToast) return
    const t = setTimeout(() => setSyncToast(null), 3500)
    return () => clearTimeout(t)
  }, [syncToast])

  const pushToPos = (action: string, item?: string) => {
    if (!posConnection) return
    setIsSyncing(true)
    const platform = posConnection.platform
    setTimeout(() => {
      const ok = Math.random() > 0.06
      setSyncLogs(prev => [{ id: Date.now().toString(), action: item ? `${action}: ${item}` : action, time: new Date(), ok }, ...prev.slice(0, 14)])
      setPosConnection(c => c ? { ...c, lastSync: new Date().toLocaleTimeString() } : c)
      setSyncToast(ok ? `✓ ${platform}: ${action} synced` : `⚠ ${platform} sync failed — will retry`)
      setIsSyncing(false)
    }, 700)
  }

  const handleConnect = () => {
    if (!syncForm.apiKey.trim() || (isOtherPOS && !syncForm.customPlatform.trim())) return
    setConnectSuccess(true)
    setTimeout(() => {
      setPosConnection({ platform: resolvedPlatform, lastSync: new Date().toLocaleTimeString() })
      setConnectSuccess(false)
      setSyncOpen(false)
      setSyncToast(`Connected to ${resolvedPlatform} — inventory synced`)
      setSyncForm(f => ({ ...f, apiKey: '', locationId: '', webhookSecret: '', customPlatform: '' }))
    }, 1400)
  }

  const handleManualSync = () => {
    if (!posConnection) return
    setIsSyncing(true)
    setTimeout(() => {
      setPosConnection(c => c ? { ...c, lastSync: new Date().toLocaleTimeString() } : c)
      setIsSyncing(false)
      setSyncToast(`Synced ${items.length} items from ${posConnection.platform}`)
    }, 1200)
  }

  const lowStock  = items.filter(i => i.quantity > 0 && i.quantity <= i.reorderPoint)
  const outOfStock = items.filter(i => i.quantity === 0)
  const totalValue = items.reduce((s, i) => s + i.quantity * i.cost, 0)
  const filtered   = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.sku.toLowerCase().includes(search.toLowerCase())
  )

  const startEdit = (i: InventoryItem) => { setEditingId(i.id); setEditForm(blankInvForm(i)) }
  const saveEdit  = (id: string) => {
    setItems(prev => prev.map(i => i.id !== id ? i : {
      ...i,
      name: editForm.name || i.name,
      sku: editForm.sku || i.sku,
      category: editForm.category === 'Other' && editForm.customCategory.trim()
        ? editForm.customCategory.trim()
        : editForm.category,
      quantity:     Number(editForm.quantity)     || i.quantity,
      reorderPoint: Number(editForm.reorderPoint) || i.reorderPoint,
      cost:  Number(editForm.cost)  || i.cost,
      price: Number(editForm.price) || i.price,
      supplier: editForm.supplier || i.supplier,
      lastUpdated: new Date().toISOString().slice(0, 10),
    }))
    setEditingId(null)
    const updated = items.find(i => i.id === id)
    if (updated) pushToPos('Item updated', editForm.name || updated.name)
  }

  const handleAdd = () => {
    if (!form.name.trim()) return
    const resolvedCategory = form.category === 'Other' && form.customCategory.trim()
      ? form.customCategory.trim()
      : form.category
    setItems(prev => [...prev, {
      id: Date.now().toString(),
      name: form.name, sku: form.sku,
      category: resolvedCategory,
      quantity: Number(form.quantity) || 0,
      reorderPoint: Number(form.reorderPoint) || 0,
      cost:  Number(form.cost)  || 0,
      price: Number(form.price) || 0,
      supplier: form.supplier,
      lastUpdated: new Date().toISOString().slice(0, 10),
    }])
    setAddOpen(false)
    setForm(blankInvForm())
    pushToPos('Item added', form.name)
  }

  const handleDelete = (id: string) => {
    const item = items.find(i => i.id === id)
    setItems(prev => prev.filter(i => i.id !== id))
    if (item) pushToPos('Item removed', item.name)
  }

  // All categories in use + preset list (deduplicated)
  const allCategories = Array.from(new Set([
    ...PRESET_CATEGORIES,
    ...items.map(i => i.category),
  ])).filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Sync toast */}
      {syncToast && (
        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${syncToast.startsWith('✓') ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : syncToast.startsWith('⚠') ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300' : 'bg-sky-500/10 border border-sky-500/30 text-sky-300'}`}>
          <Zap size={14} className="flex-shrink-0" />{syncToast}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {posConnection ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-400">
                {posConnection.platform}
                <span className="text-slate-600 ml-1.5">· Last sync {posConnection.lastSync}</span>
              </span>
              <button onClick={handleManualSync} disabled={isSyncing} className="text-slate-500 hover:text-sky-400 transition-colors disabled:opacity-40 ml-1" title="Sync now">
                <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Connect your POS or inventory software, or enter manually</p>
          )}
        </div>
        <div className="flex gap-2">
          <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvFile} />
          <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={() => csvInputRef.current?.click()}>Import CSV</Button>
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => setSyncOpen(true)}>
            {posConnection ? 'Manage POS' : 'Sync POS'}
          </Button>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>Add Item</Button>
        </div>
      </div>

      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">
              {outOfStock.length > 0 && `${outOfStock.length} out of stock`}
              {outOfStock.length > 0 && lowStock.length > 0 && ' · '}
              {lowStock.length > 0 && `${lowStock.length} below reorder point`}
            </p>
            <p className="text-xs text-amber-400/80 mt-0.5">
              {[...outOfStock, ...lowStock].map(i => i.name).join(' · ')}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total SKUs"          value={items.length.toString()}          icon={Package} />
        <StatCard title="Low Stock"           value={`${lowStock.length} items`}       icon={AlertTriangle} iconColor="text-amber-400" iconBg="bg-amber-500/15" alert={lowStock.length > 0} />
        <StatCard title="Out of Stock"        value={outOfStock.length.toString()}     icon={AlertTriangle} iconColor="text-red-400"   iconBg="bg-red-500/15"   alert={outOfStock.length > 0} />
        <StatCard title="Inventory Value"     value={`$${totalValue.toLocaleString()}`} icon={Package} iconColor="text-emerald-400" iconBg="bg-emerald-500/15" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold text-white text-sm">Inventory Register</h3>
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500 w-56"
            />
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                {['Item', 'SKU', 'Category', 'Qty', 'Reorder At', 'Unit Cost', 'Sale Price', 'Status', 'Last Updated', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const status  = stockStatus(item)
                const editing = editingId === item.id
                const isLow   = item.quantity > 0 && item.quantity <= item.reorderPoint
                const isOut   = item.quantity === 0

                return (
                  <tr
                    key={item.id}
                    className="border-b border-slate-700/40 hover:bg-slate-700/25 transition-colors"
                  >
                    {/* Item name */}
                    <td className="px-4 py-3">
                      {editing
                        ? <input value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))} className="w-36 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-400" />
                        : <span className="font-semibold text-slate-100 text-sm">{item.name}</span>
                      }
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-3">
                      {editing
                        ? <input value={editForm.sku} onChange={e => setEditForm(f => ({...f, sku: e.target.value}))} className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-400" />
                        : <span className="text-slate-400 font-mono text-xs tracking-wide">{item.sku}</span>
                      }
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      {editing ? (
                        <div className="space-y-1">
                          <select value={editForm.category} onChange={e => setEditForm(f => ({...f, category: e.target.value, customCategory: ''}))} className="bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-400 w-40">
                            {allCategories.map(c => <option key={c}>{c}</option>)}
                          </select>
                          {editForm.category === 'Other' && (
                            <input value={editForm.customCategory} onChange={e => setEditForm(f => ({...f, customCategory: e.target.value}))} placeholder="Type category name…" className="w-40 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-400" />
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-sm">{item.category}</span>
                      )}
                    </td>

                    {/* Qty */}
                    <td className="px-4 py-3">
                      {editing
                        ? <input type="number" value={editForm.quantity} onChange={e => setEditForm(f => ({...f, quantity: e.target.value}))} className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-400" />
                        : <span className={`font-bold text-base ${isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-white'}`}>
                            {item.quantity}
                          </span>
                      }
                    </td>

                    {/* Reorder At */}
                    <td className="px-4 py-3">
                      {editing
                        ? <input type="number" value={editForm.reorderPoint} onChange={e => setEditForm(f => ({...f, reorderPoint: e.target.value}))} className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-400" />
                        : <span className="text-slate-400 text-sm">{item.reorderPoint}</span>
                      }
                    </td>

                    {/* Cost */}
                    <td className="px-4 py-3">
                      {editing
                        ? <input type="number" value={editForm.cost} onChange={e => setEditForm(f => ({...f, cost: e.target.value}))} className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-400" />
                        : <span className="text-slate-300 text-sm">${item.cost.toLocaleString()}</span>
                      }
                    </td>

                    {/* Sale Price */}
                    <td className="px-4 py-3">
                      {editing
                        ? <input type="number" value={editForm.price} onChange={e => setEditForm(f => ({...f, price: e.target.value}))} className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-400" />
                        : <span className="text-slate-300 text-sm">{item.price > 0 ? `$${item.price.toLocaleString()}` : '—'}</span>
                      }
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>

                    {/* Last Updated */}
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{item.lastUpdated}</td>

                    {/* Actions */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {editing ? (
                          <>
                            <button onClick={() => saveEdit(item.id)} className="text-sky-400 hover:text-sky-300 p-1 transition-colors" title="Save"><Save size={14} /></button>
                            <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-300 p-1 transition-colors" title="Cancel"><X size={14} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(item)} className="text-slate-500 hover:text-sky-400 p-1 transition-colors" title="Edit"><Pencil size={13} /></button>
                            <button onClick={() => handleDelete(item.id)} className="text-slate-600 hover:text-red-400 p-1 transition-colors" title="Delete"><X size={13} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Add Item Modal ─────────────────────────────────────────────── */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Inventory Item">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {([
              { label: 'Item Name',       key: 'name',         type: 'text'   },
              { label: 'SKU / Part #',    key: 'sku',          type: 'text'   },
              { label: 'Quantity on Hand',key: 'quantity',     type: 'number' },
              { label: 'Reorder Point',   key: 'reorderPoint', type: 'number' },
              { label: 'Unit Cost ($)',   key: 'cost',         type: 'number' },
              { label: 'Sale Price ($)',  key: 'price',        type: 'number' },
              { label: 'Supplier / Vendor',key: 'supplier',    type: 'text'   },
            ] as { label: string; key: keyof InvForm; type: string }[]).map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500"
                />
              </div>
            ))}

            {/* Category dropdown — full list of meaningful options */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Category / Item Type</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value, customCategory: '' }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
              >
                {PRESET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Custom category field — appears only when "Other" is selected */}
          {form.category === 'Other' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Custom Category Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.customCategory}
                onChange={e => setForm(f => ({ ...f, customCategory: e.target.value }))}
                placeholder="e.g. Lubricants, Adhesives, Retail Merchandise…"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">This will be saved as a new category and appear in future dropdowns.</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button className="flex-1" onClick={handleAdd}>Add Item</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* ── Sync log ──────────────────────────────────────────────────── */}
      {syncLogs.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">POS Sync Log</h3>
            <span className="text-xs text-slate-600">{posConnection?.platform}</span>
          </div>
          <div className="divide-y divide-slate-700/50 max-h-40 overflow-y-auto scrollbar-thin">
            {syncLogs.map(log => (
              <div key={log.id} className="flex items-center gap-3 px-4 py-2.5">
                {log.ok
                  ? <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />
                  : <AlertTriangle size={12} className="text-amber-400 flex-shrink-0" />}
                <span className="text-xs text-slate-300 flex-1 truncate">{log.action}</span>
                <span className="text-[10px] text-slate-600 flex-shrink-0">{log.time.toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CSV Import Modal ───────────────────────────────────────────── */}
      <Modal open={csvOpen} onClose={() => { setCsvOpen(false); setCsvImported(false) }} title="Import Inventory from CSV" size="xl">
        <div className="p-6 space-y-4">
          {csvImported ? (
            /* Success screen */
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
              <p className="text-white font-semibold">
                {csvSelected.size} item{csvSelected.size !== 1 ? 's' : ''} imported successfully
              </p>
              <p className="text-sm text-slate-400 text-center">
                Your inventory has been updated. Items are now visible in the register.
              </p>
              <Button onClick={() => { setCsvOpen(false); setCsvImported(false) }}>Close</Button>
            </div>
          ) : (
            <>
              {/* File info + download template */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <FileText size={16} className="text-slate-500" />
                  <span className="font-medium">{csvFileName}</span>
                  <span className="text-slate-500">· {csvRows.length} row{csvRows.length !== 1 ? 's' : ''} found</span>
                </div>
                <button onClick={downloadTemplate}
                  className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors">
                  <Download size={13} /> Download template
                </button>
              </div>

              {/* Unknown columns warning */}
              {csvUnknown.length > 0 && (
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                  <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-300">
                    <span className="font-semibold">Unrecognised columns ignored: </span>
                    {csvUnknown.join(', ')}
                    <span className="text-amber-500 ml-1">— check the column names match the template.</span>
                  </div>
                </div>
              )}

              {csvRows.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">No valid rows found in this file.</p>
                  <p className="text-xs text-slate-600 mt-1">Make sure the CSV has a header row and at least a Name column.</p>
                </div>
              ) : (
                <>
                  {/* Select all / deselect */}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{csvSelected.size} of {csvRows.length} rows selected for import</span>
                    <div className="flex gap-3">
                      <button onClick={() => setCsvSelected(new Set(csvRows.map((_, i) => i).filter(i => csvRows[i]._errors.length === 0)))}
                        className="hover:text-sky-400 transition-colors">Select valid</button>
                      <button onClick={() => setCsvSelected(new Set())}
                        className="hover:text-slate-300 transition-colors">Deselect all</button>
                    </div>
                  </div>

                  {/* Preview table */}
                  <div className="overflow-auto max-h-72 rounded-xl border border-slate-700 scrollbar-thin">
                    <table className="w-full text-xs min-w-[700px]">
                      <thead className="sticky top-0 bg-slate-900">
                        <tr className="border-b border-slate-700">
                          <th className="w-8 px-3 py-2.5" />
                          {['Name','SKU','Category','Qty','Reorder','Cost','Price','Supplier'].map(h => (
                            <th key={h} className="text-left px-3 py-2.5 text-slate-500 font-medium uppercase tracking-wide">{h}</th>
                          ))}
                          <th className="px-3 py-2.5 text-slate-500 font-medium uppercase tracking-wide">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.map((row, i) => {
                          const hasError = row._errors.length > 0
                          const selected = csvSelected.has(i)
                          return (
                            <tr
                              key={i}
                              onClick={() => !hasError && toggleCsvRow(i)}
                              className={`border-b border-slate-700/50 transition-colors ${hasError ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${selected && !hasError ? 'bg-sky-500/5' : 'hover:bg-slate-700/30'}`}
                            >
                              <td className="px-3 py-2 text-center">
                                <input type="checkbox" checked={selected && !hasError} disabled={hasError}
                                  onChange={() => toggleCsvRow(i)} className="accent-sky-500" onClick={e => e.stopPropagation()} />
                              </td>
                              <td className="px-3 py-2 font-medium text-slate-200 max-w-[140px] truncate">{row.name || <span className="text-red-400">—</span>}</td>
                              <td className="px-3 py-2 text-slate-400 font-mono">{row.sku || <span className="text-slate-600">auto</span>}</td>
                              <td className="px-3 py-2 text-slate-400">{row.category || <span className="text-slate-600">Other</span>}</td>
                              <td className="px-3 py-2 text-slate-300">{row.quantity || '0'}</td>
                              <td className="px-3 py-2 text-slate-400">{row.reorderPoint || '0'}</td>
                              <td className="px-3 py-2 text-slate-400">{row.cost ? `$${row.cost}` : '—'}</td>
                              <td className="px-3 py-2 text-slate-400">{row.price ? `$${row.price}` : '—'}</td>
                              <td className="px-3 py-2 text-slate-500 max-w-[100px] truncate">{row.supplier || '—'}</td>
                              <td className="px-3 py-2">
                                {hasError
                                  ? <span className="text-red-400 flex items-center gap-1"><AlertTriangle size={11} />{row._errors[0]}</span>
                                  : <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={11} />Ready</span>
                                }
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <Button
                      className="flex-1"
                      onClick={handleCsvImport}
                      disabled={csvSelected.size === 0}
                      icon={<Upload size={14} />}
                    >
                      Import {csvSelected.size} Item{csvSelected.size !== 1 ? 's' : ''}
                    </Button>
                    <Button variant="secondary" onClick={() => csvInputRef.current?.click()} icon={<FileText size={14} />}>
                      Choose Different File
                    </Button>
                    <Button variant="secondary" onClick={() => setCsvOpen(false)}>Cancel</Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* ── Sync POS Modal ─────────────────────────────────────────────── */}
      <Modal open={syncOpen} onClose={() => { setSyncOpen(false); setConnectSuccess(false) }} title="Connect POS / Inventory Platform" size="md">
        <div className="p-6 space-y-4">
          {connectSuccess ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
              <p className="text-white font-semibold">Connected to {resolvedPlatform}!</p>
              <p className="text-sm text-slate-400 text-center">
                Inventory will sync automatically. Any add, edit, or removal will push to {resolvedPlatform} in real time.
              </p>
            </div>
          ) : (
            <>
              {/* Current connection banner */}
              {posConnection && (
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                  <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-300">Connected: {posConnection.platform}</p>
                    <p className="text-xs text-slate-500">Last synced {posConnection.lastSync}</p>
                  </div>
                  <button onClick={() => { setPosConnection(null); setSyncToast(`Disconnected from ${posConnection.platform}`) }}
                    className="text-slate-500 hover:text-red-400 text-xs transition-colors flex-shrink-0">
                    Disconnect
                  </button>
                </div>
              )}

              {/* Platform selector */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Platform</label>
                <select
                  value={syncForm.platform}
                  onChange={e => setSyncForm(f => ({ ...f, platform: e.target.value, customPlatform: '' }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                >
                  {['Square','Shopify','Lightspeed','Clover','Toast','Vend','QuickBooks','WooCommerce','BigCommerce','Cin7','Fishbowl','TradeGecko','Other'].map(p => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Custom platform name — shown only when "Other" is selected */}
              {isOtherPOS && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Platform Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={syncForm.customPlatform}
                    onChange={e => setSyncForm(f => ({ ...f, customPlatform: e.target.value }))}
                    placeholder="e.g. Revel Systems, NCR, my custom ERP…"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">This name will be saved and shown in your connection status.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">API Key / Access Token <span className="text-red-400">*</span></label>
                <input
                  type="password"
                  value={syncForm.apiKey}
                  onChange={e => setSyncForm(f => ({ ...f, apiKey: e.target.value }))}
                  placeholder="Paste your API key or access token"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Location / Store ID</label>
                <input
                  type="text"
                  value={syncForm.locationId}
                  onChange={e => setSyncForm(f => ({ ...f, locationId: e.target.value }))}
                  placeholder="Your location, store, or account ID"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Webhook Signing Secret (optional)</label>
                <input
                  type="text"
                  value={syncForm.webhookSecret}
                  onChange={e => setSyncForm(f => ({ ...f, webhookSecret: e.target.value }))}
                  placeholder="Used to verify inbound stock-update events"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500"
                />
              </div>

              {/* Inbound webhook URL */}
              <div className="bg-slate-700/30 border border-slate-700 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Webhook size={13} className="text-slate-500" />
                  <p className="text-xs font-medium text-slate-400">Inbound webhook URL</p>
                </div>
                <p className="text-xs font-mono text-sky-400 break-all">https://bizops.app/api/webhooks/inventory/YOUR_ID</p>
                <p className="text-[10px] text-slate-600 mt-1">
                  Paste this URL into your POS platform so stock changes, new products, and quantity updates push here automatically.
                </p>
              </div>

              {isOtherPOS && !syncForm.customPlatform.trim() && (
                <p className="text-xs text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle size={12} /> Enter a platform name to continue.
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <Button
                  className="flex-1"
                  onClick={handleConnect}
                  disabled={!syncForm.apiKey.trim() || (isOtherPOS && !syncForm.customPlatform.trim())}
                >
                  {posConnection ? `Switch to ${resolvedPlatform}` : 'Connect & Sync'}
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setSyncOpen(false)}>Cancel</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
