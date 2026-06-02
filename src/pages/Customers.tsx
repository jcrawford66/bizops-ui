import { useState } from 'react'
import { Users, UserPlus, AlertCircle, Search, RefreshCw } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import type { Customer } from '../types'

const customers: Customer[] = [
  { id: '1', name: 'Acme Corporation', email: 'billing@acmecorp.com', phone: '(555) 210-4400', lastVisit: '2025-06-05', totalSpend: 128400, visits: 47, status: 'active', tags: ['enterprise', 'priority'] },
  { id: '2', name: 'Michael Torres', email: 'mtorres@email.com', phone: '(555) 382-9921', lastVisit: '2025-06-03', totalSpend: 4280, visits: 12, status: 'active', tags: ['retail'] },
  { id: '3', name: 'Riverdale Bakery', email: 'hello@riverdalebakery.com', phone: '(555) 501-7743', lastVisit: '2025-06-01', totalSpend: 850, visits: 2, status: 'new', tags: ['new', 'local'] },
  { id: '4', name: 'Sandra Wei', email: 'sandra.wei@gmail.com', phone: '(555) 774-0012', lastVisit: '2025-02-14', totalSpend: 2100, visits: 8, status: 'inactive', tags: ['at-risk'] },
  { id: '5', name: 'Blue Ridge Roofing', email: 'ops@blueridgeroofing.com', phone: '(555) 630-8844', lastVisit: '2025-05-28', totalSpend: 18700, visits: 23, status: 'active', tags: ['contractor', 'priority'] },
  { id: '6', name: 'Jamie Okafor', email: 'jamie.o@email.com', phone: '(555) 290-5518', lastVisit: '2025-05-20', totalSpend: 640, visits: 3, status: 'active', tags: ['retail'] },
  { id: '7', name: 'TechStart LLC', email: 'ops@techstart.io', phone: '(555) 188-3300', lastVisit: '2025-01-10', totalSpend: 9200, visits: 15, status: 'inactive', tags: ['at-risk', 'tech'] },
]

const STATUS_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'default'> = {
  active: 'success', new: 'info', inactive: 'warning',
}

export default function Customers() {
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [selected, setSelected] = useState<Customer | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [syncOpen, setSyncOpen] = useState(false)
  const [syncForm, setSyncForm] = useState({ platform: 'HubSpot', apiKey: '', portalId: '' })

  const active = customers.filter(c => c.status === 'active').length
  const atRisk = customers.filter(c => c.tags.includes('at-risk')).length
  const newThisMonth = customers.filter(c => c.status === 'new').length

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Connect your CRM or booking software for live customer data</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => setSyncOpen(true)}>Sync CRM</Button>
          <Button size="sm" icon={<UserPlus size={14} />} onClick={() => setAddOpen(true)}>Add Customer</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Customers" value={customers.length.toString()} change={5.1} icon={Users} />
        <StatCard title="Active" value={active.toString()} icon={Users} iconColor="text-emerald-500" iconBg="bg-emerald-500/15" />
        <StatCard title="New This Month" value={newThisMonth.toString()} icon={UserPlus} iconColor="text-blue-500" iconBg="bg-blue-500/15" />
        <StatCard title="At Risk" value={atRisk.toString()} icon={AlertCircle} iconColor="text-amber-500" iconBg="bg-amber-500/15" alert={atRisk > 0} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold text-white text-sm">Customer Directory</h3>
            <div className="flex items-center gap-2 border border-slate-700 rounded-lg px-3 py-1.5 bg-slate-800 w-60">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="text-sm bg-transparent outline-none text-slate-300 placeholder-slate-400 flex-1"
              />
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/60">
                {['Customer', 'Contact', 'Last Visit', 'Total Spend', 'Visits', 'Status', 'Tags'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => setSelected(c)} className="border-b border-slate-700/50 hover:bg-slate-700/40 transition-colors cursor-pointer">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {c.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                      </div>
                      <span className="font-medium text-white">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">
                    <p>{c.email}</p>
                    {c.phone && <p className="mt-0.5">{c.phone}</p>}
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{c.lastVisit ?? '—'}</td>
                  <td className="px-5 py-3 font-semibold text-white">${c.totalSpend.toLocaleString()}</td>
                  <td className="px-5 py-3 text-slate-400">{c.visits}</td>
                  <td className="px-5 py-3"><Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge></td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {c.tags.map(t => <Badge key={t} variant={t === 'at-risk' ? 'warning' : t === 'priority' ? 'purple' : 'default'}>{t}</Badge>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Customer detail modal */}
      <Modal open={selected !== null} onClose={() => setSelected(null)} title="Customer Profile" size="lg">
        {selected && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xl font-bold">
                {selected.name.split(' ').map(n => n[0]).join('').slice(0,2)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selected.name}</h3>
                <p className="text-sm text-slate-500">{selected.email} · {selected.phone}</p>
                <div className="flex gap-1 mt-1">
                  {selected.tags.map(t => <Badge key={t} variant="default">{t}</Badge>)}
                </div>
              </div>
              <div className="ml-auto text-right">
                <Badge variant={STATUS_VARIANT[selected.status]}>{selected.status}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Spend', value: `$${selected.totalSpend.toLocaleString()}` },
                { label: 'Total Visits', value: selected.visits.toString() },
                { label: 'Last Visit', value: selected.lastVisit ?? 'Unknown' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs text-slate-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button className="flex-1">Schedule Appointment</Button>
              <Button variant="secondary" className="flex-1">Send Message</Button>
              <Button variant="secondary" className="flex-1">View History</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add customer modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Customer">
        <div className="p-6 space-y-4">
          {[{ label: 'Full Name / Business', key: 'name' }, { label: 'Email', key: 'email' }, { label: 'Phone', key: 'phone' }].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
              <input type="text" value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40 resize-none" />
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => setAddOpen(false)}>Add Customer</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Sync CRM Modal */}
      <Modal open={syncOpen} onClose={() => setSyncOpen(false)} title="Sync CRM / Booking Platform">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Platform</label>
            <select value={syncForm.platform} onChange={e => setSyncForm(f => ({ ...f, platform: e.target.value }))} className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40">
              {['HubSpot','Salesforce','Mindbody','Acuity Scheduling','Jobber','ServiceTitan','Zoho CRM','Other'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">API Key / Access Token</label>
            <input type="password" value={syncForm.apiKey} onChange={e => setSyncForm(f => ({ ...f, apiKey: e.target.value }))} placeholder="Paste your API key" className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Portal / Account ID</label>
            <input type="text" value={syncForm.portalId} onChange={e => setSyncForm(f => ({ ...f, portalId: e.target.value }))} placeholder="Your portal or account ID" className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500" />
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
