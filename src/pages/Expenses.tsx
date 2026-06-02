import { useState } from 'react'
import { Receipt, AlertTriangle, Plus, Filter, Pencil, Save, X, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../components/ui/StatCard'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import type { ExpenseItem } from '../types'

const INITIAL_EXPENSES: ExpenseItem[] = [
  { id: '1', vendor: 'Office Pro Supplies',   category: 'Supplies',  amount: 2400,  date: '2025-06-01', status: 'paid',    invoiceNo: 'INV-1039' },
  { id: '2', vendor: 'Metro Payroll Services', category: 'Payroll',   amount: 48200, date: '2025-06-01', status: 'paid',    invoiceNo: 'PAY-0601' },
  { id: '3', vendor: 'Acme Parts Co.',         category: 'COGS',      amount: 8900,  date: '2025-06-03', status: 'overdue', invoiceNo: 'INV-1042', estimatedMarginImpact: -4.2 },
  { id: '4', vendor: 'CloudStack Inc.',        category: 'Software',  amount: 1200,  date: '2025-06-05', status: 'pending', invoiceNo: 'INV-1043' },
  { id: '5', vendor: 'City Utilities',         category: 'Utilities', amount: 890,   date: '2025-06-06', status: 'paid',    invoiceNo: 'UTIL-0606' },
  { id: '6', vendor: 'Prime Advertising',      category: 'Marketing', amount: 5500,  date: '2025-06-08', status: 'pending', invoiceNo: 'MKT-0608', estimatedMarginImpact: -1.1 },
  { id: '7', vendor: 'BuildRight Contractors', category: 'Facilities',amount: 11000, date: '2025-06-10', status: 'pending', invoiceNo: 'INV-1045' },
]

const CATEGORIES = ['Payroll','COGS','Facilities','Marketing','Supplies','Software','Utilities','Other']
const STATUS_BADGE: Record<string, 'success' | 'warning' | 'error'> = { paid: 'success', pending: 'warning', overdue: 'error' }

type EditForm = { vendor: string; category: string; amount: string; date: string; invoiceNo: string; status: string; estimatedMarginImpact: string }

function blankForm(e?: ExpenseItem): EditForm {
  return {
    vendor: e?.vendor ?? '',
    category: e?.category ?? 'Supplies',
    amount: e?.amount.toString() ?? '',
    date: e?.date ?? '',
    invoiceNo: e?.invoiceNo ?? '',
    status: e?.status ?? 'pending',
    estimatedMarginImpact: e?.estimatedMarginImpact?.toString() ?? '',
  }
}

function categoryTotals(expenses: ExpenseItem[]) {
  const map: Record<string, number> = {}
  expenses.forEach(e => { map[e.category] = (map[e.category] ?? 0) + e.amount })
  return Object.entries(map).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount)
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>(blankForm())
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<EditForm>(blankForm())
  const [syncOpen, setSyncOpen] = useState(false)
  const [syncForm, setSyncForm] = useState({ platform: 'QuickBooks', apiKey: '', companyId: '' })

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const overdue = expenses.filter(e => e.status === 'overdue')
  const pending = expenses.filter(e => e.status === 'pending')
  const marginAlerts = expenses.filter(e => e.estimatedMarginImpact && e.estimatedMarginImpact < -2)

  const startEdit = (e: ExpenseItem) => { setEditingId(e.id); setEditForm(blankForm(e)) }

  const saveEdit = (id: string) => {
    setExpenses(prev => prev.map(e => e.id !== id ? e : {
      ...e,
      vendor: editForm.vendor || e.vendor,
      category: editForm.category,
      amount: Number(editForm.amount) || e.amount,
      date: editForm.date || e.date,
      invoiceNo: editForm.invoiceNo || e.invoiceNo,
      status: editForm.status as ExpenseItem['status'],
      estimatedMarginImpact: editForm.estimatedMarginImpact ? Number(editForm.estimatedMarginImpact) : e.estimatedMarginImpact,
    }))
    setEditingId(null)
  }

  const handleAdd = () => {
    if (!addForm.vendor.trim() || !addForm.amount) return
    setExpenses(prev => [...prev, {
      id: Date.now().toString(),
      vendor: addForm.vendor,
      category: addForm.category,
      amount: Number(addForm.amount),
      date: addForm.date || new Date().toISOString().slice(0, 10),
      status: addForm.status as ExpenseItem['status'],
      invoiceNo: addForm.invoiceNo || undefined,
      estimatedMarginImpact: addForm.estimatedMarginImpact ? Number(addForm.estimatedMarginImpact) : undefined,
    }])
    setAddOpen(false)
    setAddForm(blankForm())
  }

  const handleDelete = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500">Track invoices, estimates, and their margin impact</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => setSyncOpen(true)}>Sync Accounting</Button>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>Add Expense</Button>
        </div>
      </div>

      {marginAlerts.map(e => (
        <div key={e.id} className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-300">
            <span className="font-semibold">Margin Alert —</span> {e.vendor} ({e.invoiceNo}) reduces gross margin by ~{Math.abs(e.estimatedMarginImpact!)}%
          </p>
        </div>
      ))}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Expenses (MTD)" value={`$${totalExpenses.toLocaleString()}`} icon={Receipt} />
        <StatCard title="Overdue" value={`${overdue.length} items`} icon={AlertTriangle} iconColor="text-red-500" iconBg="bg-red-500/15" alert={overdue.length > 0} />
        <StatCard title="Pending" value={`$${pending.reduce((s, e) => s + e.amount, 0).toLocaleString()}`} icon={Receipt} iconColor="text-amber-500" iconBg="bg-amber-500/15" />
        <StatCard title="Largest Expense" value={`$${Math.max(...expenses.map(e => e.amount)).toLocaleString()}`} icon={Receipt} iconColor="text-purple-500" iconBg="bg-purple-500/15" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">Expense Register</h3>
              <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300"><Filter size={13} /> Filter</button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Vendor</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Margin</th>
                  <th className="px-3 py-3 w-16" />
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => {
                  const editing = editingId === e.id
                  return (
                    <tr key={e.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        {editing ? (
                          <div className="space-y-1">
                            <input value={editForm.vendor} onChange={ev => setEditForm(f => ({ ...f, vendor: ev.target.value }))} className="w-full border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400" />
                            <input value={editForm.invoiceNo} onChange={ev => setEditForm(f => ({ ...f, invoiceNo: ev.target.value }))} className="w-full border border-slate-700 rounded px-2 py-1 text-xs text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-400" placeholder="Invoice #" />
                            <input type="date" value={editForm.date} onChange={ev => setEditForm(f => ({ ...f, date: ev.target.value }))} className="w-full border border-slate-700 rounded px-2 py-1 text-xs text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-400" />
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-white">{e.vendor}</p>
                            <p className="text-xs text-slate-400">{e.invoiceNo} · {e.date}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <select value={editForm.category} onChange={ev => setEditForm(f => ({ ...f, category: ev.target.value }))} className="border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400">
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                          </select>
                        ) : (
                          <span className="text-slate-400">{e.category}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editing ? (
                          <input type="number" value={editForm.amount} onChange={ev => setEditForm(f => ({ ...f, amount: ev.target.value }))} className="w-24 border border-slate-700 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-brand-400" />
                        ) : (
                          <span className="font-semibold text-white">${e.amount.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {editing ? (
                          <select value={editForm.status} onChange={ev => setEditForm(f => ({ ...f, status: ev.target.value }))} className="border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400">
                            {['paid','pending','overdue'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        ) : (
                          <Badge variant={STATUS_BADGE[e.status]}>{e.status}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {editing ? (
                          <input type="number" step="0.1" value={editForm.estimatedMarginImpact} onChange={ev => setEditForm(f => ({ ...f, estimatedMarginImpact: ev.target.value }))} className="w-16 border border-slate-700 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-brand-400" placeholder="e.g. -2.5" />
                        ) : e.estimatedMarginImpact ? (
                          <span className={`text-xs font-medium ${e.estimatedMarginImpact < -2 ? 'text-red-600' : 'text-amber-600'}`}>{e.estimatedMarginImpact}%</span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {editing ? (
                            <>
                              <button onClick={() => saveEdit(e.id)} className="text-teal-600 hover:text-teal-700 p-1 rounded" title="Save"><Save size={14} /></button>
                              <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-400 p-1 rounded" title="Cancel"><X size={14} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(e)} className="text-slate-400 hover:text-teal-600 p-1 rounded" title="Edit"><Pencil size={13} /></button>
                              <button onClick={() => handleDelete(e.id)} className="text-slate-300 hover:text-red-400 p-1 rounded" title="Delete"><X size={13} /></button>
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

        <Card>
          <CardHeader><h3 className="font-semibold text-white text-sm">By Category</h3></CardHeader>
          <div className="px-5 pb-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryTotals(expenses)} layout="vertical" barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a4a" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip formatter={(v: unknown) => [`$${(v as number).toLocaleString()}`, '']} contentStyle={{ borderRadius: '8px', border: '1px solid #1e3a4a', background: '#1e293b', color: '#e2e8f0', fontSize: 12 }} />
                <Bar dataKey="amount" fill="#14b8a6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Add Expense Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Expense / Invoice">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Vendor Name', key: 'vendor' }, { label: 'Invoice #', key: 'invoiceNo' },
              { label: 'Amount ($)', key: 'amount' }, { label: 'Date', key: 'date', type: 'date' },
            ].map(({ label, key, type = 'text' }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
                <input type={type} value={addForm[key as keyof EditForm]} onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
              <select value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
              <select value={addForm.status} onChange={e => setAddForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40">
                {['pending','paid','overdue'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Estimated Margin Impact % (e.g. -3.5)</label>
            <input type="number" step="0.1" value={addForm.estimatedMarginImpact} onChange={e => setAddForm(f => ({ ...f, estimatedMarginImpact: e.target.value }))} placeholder="-2.5" className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={handleAdd}>Save Expense</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Sync Accounting Modal */}
      <Modal open={syncOpen} onClose={() => setSyncOpen(false)} title="Sync Accounting Platform">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Platform</label>
            <select value={syncForm.platform} onChange={e => setSyncForm(f => ({ ...f, platform: e.target.value }))} className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40">
              {['QuickBooks','FreshBooks','Xero','Wave','Sage','Zoho Books','Other'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">API Key / Access Token</label>
            <input type="password" value={syncForm.apiKey} onChange={e => setSyncForm(f => ({ ...f, apiKey: e.target.value }))} placeholder="Paste your token" className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Company / Realm ID</label>
            <input type="text" value={syncForm.companyId} onChange={e => setSyncForm(f => ({ ...f, companyId: e.target.value }))} placeholder="Your company identifier" className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500" />
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
