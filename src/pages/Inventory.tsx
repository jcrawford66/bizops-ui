import { useState } from 'react'
import { Package, AlertTriangle, Plus, Upload, RefreshCw, Pencil, Save, X } from 'lucide-react'
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

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_INVENTORY)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<InvForm>(blankInvForm())
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState<InvForm>(blankInvForm())
  const [search, setSearch] = useState('')
  const [syncOpen, setSyncOpen] = useState(false)
  const [syncForm, setSyncForm] = useState({ platform: 'Square', apiKey: '', locationId: '' })

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
  }

  const handleDelete = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

  // All categories in use + preset list (deduplicated)
  const allCategories = Array.from(new Set([
    ...PRESET_CATEGORIES,
    ...items.map(i => i.category),
  ])).filter(Boolean)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500">Connect your POS or inventory software, or enter manually</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Upload size={14} />}>Import CSV</Button>
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => setSyncOpen(true)}>Sync POS</Button>
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

      {/* ── Sync POS Modal ─────────────────────────────────────────────── */}
      <Modal open={syncOpen} onClose={() => setSyncOpen(false)} title="Sync POS / Inventory Platform">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Platform</label>
            <select value={syncForm.platform} onChange={e => setSyncForm(f => ({ ...f, platform: e.target.value }))} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40">
              {['Square','Shopify','Lightspeed','Clover','Toast','Vend','QuickBooks','Other'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">API Key / Access Token</label>
            <input type="password" value={syncForm.apiKey} onChange={e => setSyncForm(f => ({ ...f, apiKey: e.target.value }))} placeholder="Paste your API key" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Location / Store ID</label>
            <input type="text" value={syncForm.locationId} onChange={e => setSyncForm(f => ({ ...f, locationId: e.target.value }))} placeholder="Your location or store ID" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={() => setSyncOpen(false)}>Connect & Sync</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setSyncOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
