import { useState } from 'react'
import { Receipt, AlertTriangle, Plus, Filter } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../components/ui/StatCard'
import Card, { CardHeader, CardBody } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import type { ExpenseItem } from '../types'

const expenses: ExpenseItem[] = [
  { id: '1', vendor: 'Office Pro Supplies', category: 'Supplies', amount: 2400, date: '2025-06-01', status: 'paid', invoiceNo: 'INV-1039' },
  { id: '2', vendor: 'Metro Payroll Services', category: 'Payroll', amount: 48200, date: '2025-06-01', status: 'paid', invoiceNo: 'PAY-0601' },
  { id: '3', vendor: 'Acme Parts Co.', category: 'COGS', amount: 8900, date: '2025-06-03', status: 'overdue', invoiceNo: 'INV-1042', estimatedMarginImpact: -4.2 },
  { id: '4', vendor: 'CloudStack Inc.', category: 'Software', amount: 1200, date: '2025-06-05', status: 'pending', invoiceNo: 'INV-1043' },
  { id: '5', vendor: 'City Utilities', category: 'Utilities', amount: 890, date: '2025-06-06', status: 'paid', invoiceNo: 'UTIL-0606' },
  { id: '6', vendor: 'Prime Advertising', category: 'Marketing', amount: 5500, date: '2025-06-08', status: 'pending', invoiceNo: 'MKT-0608', estimatedMarginImpact: -1.1 },
  { id: '7', vendor: 'BuildRight Contractors', category: 'Facilities', amount: 11000, date: '2025-06-10', status: 'pending', invoiceNo: 'INV-1045' },
]

const categoryTotals = [
  { name: 'Payroll', amount: 48200 },
  { name: 'COGS', amount: 22400 },
  { name: 'Facilities', amount: 11000 },
  { name: 'Marketing', amount: 5500 },
  { name: 'Supplies', amount: 2400 },
  { name: 'Software', amount: 1200 },
  { name: 'Utilities', amount: 890 },
]

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'error'> = {
  paid: 'success', pending: 'warning', overdue: 'error',
}

export default function Expenses() {
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ vendor: '', category: '', amount: '', date: '', invoiceNo: '', notes: '' })

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const overdue = expenses.filter(e => e.status === 'overdue')
  const marginAlerts = expenses.filter(e => e.estimatedMarginImpact && e.estimatedMarginImpact < -2)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Track invoices, estimates, and their margin impact</p>
        <Button size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>Add Expense</Button>
      </div>

      {/* Margin alerts */}
      {marginAlerts.length > 0 && (
        <div className="space-y-2">
          {marginAlerts.map(e => (
            <div key={e.id} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-800">
                <span className="font-semibold">Margin Alert —</span> {e.vendor} ({e.invoiceNo}) reduces gross margin by ~{Math.abs(e.estimatedMarginImpact!)}%
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Expenses (MTD)" value={`$${totalExpenses.toLocaleString()}`} icon={Receipt} />
        <StatCard title="Overdue" value={`${overdue.length} items`} icon={AlertTriangle} iconColor="text-red-500" iconBg="bg-red-50" alert={overdue.length > 0} />
        <StatCard title="Pending" value={`$${expenses.filter(e=>e.status==='pending').reduce((s,e)=>s+e.amount,0).toLocaleString()}`} icon={Receipt} iconColor="text-amber-500" iconBg="bg-amber-50" />
        <StatCard title="Largest Expense" value="$48,200" icon={Receipt} iconColor="text-purple-500" iconBg="bg-purple-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm">Expense Register</h3>
              <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700">
                <Filter size={13} /> Filter
              </button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Vendor</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Margin Impact</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{e.vendor}</p>
                      <p className="text-xs text-slate-400">{e.invoiceNo} · {e.date}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{e.category}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">${e.amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-center"><Badge variant={STATUS_BADGE[e.status]}>{e.status}</Badge></td>
                    <td className="px-5 py-3 text-center">
                      {e.estimatedMarginImpact ? (
                        <span className={`text-xs font-medium ${e.estimatedMarginImpact < -2 ? 'text-red-600' : 'text-amber-600'}`}>
                          {e.estimatedMarginImpact}%
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader><h3 className="font-semibold text-slate-900 text-sm">By Category</h3></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryTotals} layout="vertical" barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip formatter={(v: unknown) => [`$${(v as number).toLocaleString()}`, '']} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="amount" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Add Expense Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Expense / Invoice">
        <div className="p-6 space-y-4">
          {[
            { label: 'Vendor Name', key: 'vendor', type: 'text' },
            { label: 'Invoice #', key: 'invoiceNo', type: 'text' },
            { label: 'Amount ($)', key: 'amount', type: 'number' },
            { label: 'Date', key: 'date', type: 'date' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20">
              {['Payroll','COGS','Facilities','Marketing','Supplies','Software','Utilities','Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={() => setAddOpen(false)}>Save Expense</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
