import { useState } from 'react'
import { Package, AlertTriangle, Plus, Upload, RefreshCw } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import type { InventoryItem } from '../types'

const inventory: InventoryItem[] = [
  { id: '1', name: 'Widget Pro', sku: 'WP-001', category: 'Products', quantity: 3, reorderPoint: 20, cost: 42, price: 89, supplier: 'Acme Parts Co.', lastUpdated: '2025-06-08' },
  { id: '2', name: 'Office Supplies Bundle', sku: 'OS-012', category: 'Supplies', quantity: 8, reorderPoint: 25, cost: 15, price: 0, supplier: 'Office Pro', lastUpdated: '2025-06-06' },
  { id: '3', name: 'Service Kit Standard', sku: 'SK-004', category: 'Services', quantity: 44, reorderPoint: 10, cost: 28, price: 120, supplier: 'Internal', lastUpdated: '2025-06-05' },
  { id: '4', name: 'Hardware Bundle A', sku: 'HB-009', category: 'Products', quantity: 17, reorderPoint: 15, cost: 195, price: 349, supplier: 'TechSource', lastUpdated: '2025-06-04' },
  { id: '5', name: 'Cleaning Supplies', sku: 'CS-003', category: 'Supplies', quantity: 2, reorderPoint: 12, cost: 8, price: 0, supplier: 'CleanCo', lastUpdated: '2025-06-03' },
  { id: '6', name: 'Premium Service Kit', sku: 'SK-007', category: 'Services', quantity: 31, reorderPoint: 8, cost: 65, price: 220, supplier: 'Internal', lastUpdated: '2025-06-02' },
  { id: '7', name: 'Safety Equipment Set', sku: 'SE-002', category: 'Equipment', quantity: 12, reorderPoint: 5, cost: 110, price: 0, supplier: 'SafetyFirst Inc.', lastUpdated: '2025-06-01' },
  { id: '8', name: 'Promotional Materials', sku: 'PM-015', category: 'Marketing', quantity: 0, reorderPoint: 50, cost: 2, price: 0, supplier: 'PrintHouse', lastUpdated: '2025-05-28' },
]

function stockStatus(item: InventoryItem): { label: string; variant: 'error' | 'warning' | 'success' } {
  if (item.quantity === 0) return { label: 'Out of Stock', variant: 'error' }
  if (item.quantity <= item.reorderPoint) return { label: 'Low Stock', variant: 'warning' }
  return { label: 'In Stock', variant: 'success' }
}

export default function Inventory() {
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: '', sku: '', category: '', quantity: '', reorderPoint: '', cost: '', price: '', supplier: '' })
  const [search, setSearch] = useState('')

  const lowStock = inventory.filter(i => i.quantity <= i.reorderPoint)
  const outOfStock = inventory.filter(i => i.quantity === 0)
  const totalValue = inventory.reduce((s, i) => s + i.quantity * i.cost, 0)
  const filtered = inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500">Connect your POS or inventory software, or enter manually</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Upload size={14} />}>Import CSV</Button>
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />}>Sync</Button>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>Add Item</Button>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{lowStock.length} item{lowStock.length > 1 ? 's' : ''} below reorder point</p>
            <p className="text-xs text-amber-700 mt-0.5">{lowStock.map(i => i.name).join(' · ')}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total SKUs" value={inventory.length.toString()} icon={Package} />
        <StatCard title="Low / Out of Stock" value={`${lowStock.length} items`} icon={AlertTriangle} iconColor="text-amber-500" iconBg="bg-amber-50" alert={lowStock.length > 0} />
        <StatCard title="Out of Stock" value={outOfStock.length.toString()} icon={AlertTriangle} iconColor="text-red-500" iconBg="bg-red-50" alert={outOfStock.length > 0} />
        <StatCard title="Inventory Value" value={`$${totalValue.toLocaleString()}`} icon={Package} iconColor="text-emerald-500" iconBg="bg-emerald-50" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold text-slate-900 text-sm">Inventory Register</h3>
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 w-56"
            />
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Item', 'SKU', 'Category', 'Qty', 'Reorder At', 'Cost', 'Price', 'Status', 'Last Updated'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const status = stockStatus(item)
                return (
                  <tr key={item.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${item.quantity === 0 ? 'bg-red-50/30' : item.quantity <= item.reorderPoint ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-5 py-3 font-medium text-slate-900">{item.name}</td>
                    <td className="px-5 py-3 text-slate-500 font-mono text-xs">{item.sku}</td>
                    <td className="px-5 py-3 text-slate-600">{item.category}</td>
                    <td className={`px-5 py-3 font-semibold ${item.quantity === 0 ? 'text-red-600' : item.quantity <= item.reorderPoint ? 'text-amber-600' : 'text-slate-900'}`}>{item.quantity}</td>
                    <td className="px-5 py-3 text-slate-500">{item.reorderPoint}</td>
                    <td className="px-5 py-3 text-slate-700">${item.cost}</td>
                    <td className="px-5 py-3 text-slate-700">{item.price > 0 ? `$${item.price}` : '—'}</td>
                    <td className="px-5 py-3"><Badge variant={status.variant}>{status.label}</Badge></td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{item.lastUpdated}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Inventory Item">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Item Name', key: 'name' }, { label: 'SKU', key: 'sku' },
              { label: 'Quantity', key: 'quantity' }, { label: 'Reorder Point', key: 'reorderPoint' },
              { label: 'Unit Cost ($)', key: 'cost' }, { label: 'Sale Price ($)', key: 'price' },
              { label: 'Supplier', key: 'supplier' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <input
                  type="text"
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                {['Products','Supplies','Services','Equipment','Marketing'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={() => setAddOpen(false)}>Add Item</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
