import { useState } from 'react'
import { CheckCircle2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import Card, { CardHeader, CardBody } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

type Integration = {
  id: string
  name: string
  category: string
  description: string
  connected: boolean
  lastSync?: string
  color: string
  initials: string
}

const integrations: Integration[] = [
  { id: '1', name: 'QuickBooks', category: 'Accounting', description: 'Sync invoices, expenses, and financials', connected: true, lastSync: '2025-06-10 9:02 AM', color: 'bg-green-100 text-green-700', initials: 'QB' },
  { id: '2', name: 'Square', category: 'POS / Payments', description: 'Pull sales, inventory, and customer data', connected: true, lastSync: '2025-06-10 8:55 AM', color: 'bg-slate-100 text-slate-700', initials: 'SQ' },
  { id: '3', name: 'Stripe', category: 'POS / Payments', description: 'Payment processing and subscription data', connected: false, color: 'bg-purple-100 text-purple-700', initials: 'ST' },
  { id: '4', name: 'HubSpot', category: 'CRM', description: 'Customer contacts, deals, and pipeline sync', connected: false, color: 'bg-orange-100 text-orange-700', initials: 'HS' },
  { id: '5', name: 'Salesforce', category: 'CRM', description: 'Enterprise CRM and customer data', connected: false, color: 'bg-blue-100 text-blue-700', initials: 'SF' },
  { id: '6', name: 'Jobber', category: 'Field Service', description: 'Job scheduling, quotes, and work orders', connected: true, lastSync: '2025-06-10 9:00 AM', color: 'bg-yellow-100 text-yellow-700', initials: 'JB' },
  { id: '7', name: 'ServiceTitan', category: 'Field Service', description: 'Service management and dispatch', connected: false, color: 'bg-red-100 text-red-700', initials: 'ST' },
  { id: '8', name: 'Lightspeed', category: 'POS / Retail', description: 'Retail POS and inventory management', connected: false, color: 'bg-indigo-100 text-indigo-700', initials: 'LS' },
  { id: '9', name: 'Mindbody', category: 'Booking', description: 'Appointment booking and client management', connected: false, color: 'bg-teal-100 text-teal-700', initials: 'MB' },
  { id: '10', name: 'Acuity Scheduling', category: 'Booking', description: 'Online scheduling and appointments', connected: false, color: 'bg-pink-100 text-pink-700', initials: 'AC' },
  { id: '11', name: 'Gusto', category: 'HR / Payroll', description: 'Payroll, benefits, and employee data', connected: false, color: 'bg-lime-100 text-lime-700', initials: 'GU' },
  { id: '12', name: 'Shopify', category: 'E-Commerce', description: 'Online store orders and inventory', connected: false, color: 'bg-emerald-100 text-emerald-700', initials: 'SH' },
]

const CATEGORIES = ['All', ...Array.from(new Set(integrations.map(i => i.category)))]

export default function Integrations() {
  const [selected, setSelected] = useState<Integration | null>(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [form, setForm] = useState({ apiKey: '', webhookUrl: '', accountId: '' })
  const [customOpen, setCustomOpen] = useState(false)

  const filtered = integrations.filter(i => activeCategory === 'All' || i.category === activeCategory)
  const connected = integrations.filter(i => i.connected)

  const handleConnect = (i: Integration) => { setSelected(i); setForm({ apiKey: '', webhookUrl: '', accountId: '' }) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Connect your business software to sync data in real time</p>
        <Button size="sm" icon={<Plus size={14} />} onClick={() => setCustomOpen(true)}>Custom Webhook</Button>
      </div>

      {/* Connected summary */}
      {connected.length > 0 && (
        <Card>
          <CardHeader><h3 className="font-semibold text-slate-900 text-sm">Connected ({connected.length})</h3></CardHeader>
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {connected.map(i => (
              <div key={i.id} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${i.color}`}>{i.initials}</div>
                  <div>
                    <p className="font-medium text-sm text-slate-900">{i.name}</p>
                    {i.lastSync && <p className="text-xs text-slate-500">Synced {i.lastSync}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-slate-400 hover:text-slate-600 transition-colors"><RefreshCw size={13} /></button>
                  <button className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeCategory === cat ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Integration grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(i => (
          <Card key={i.id} hover onClick={() => !i.connected && handleConnect(i)}>
            <CardBody className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${i.color}`}>{i.initials}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900 text-sm">{i.name}</p>
                  {i.connected
                    ? <Badge variant="success"><CheckCircle2 size={10} className="inline mr-1" />Live</Badge>
                    : <Badge variant="default">Connect</Badge>
                  }
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{i.category}</p>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{i.description}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Connect modal */}
      <Modal open={selected !== null} onClose={() => setSelected(null)} title={`Connect ${selected?.name}`}>
        {selected && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${selected.color}`}>{selected.initials}</div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{selected.name}</p>
                <p className="text-xs text-slate-500">{selected.description}</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">API Key</label>
              <input type="password" value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} placeholder="Paste your API key" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Webhook URL (optional)</label>
              <input type="text" value={form.webhookUrl} onChange={e => setForm(f => ({ ...f, webhookUrl: e.target.value }))} placeholder="https://your-app.com/webhook" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Account / Org ID</label>
              <input type="text" value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))} placeholder="Your account identifier" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" />
            </div>
            <p className="text-xs text-slate-400">Your credentials are encrypted at rest and never exposed to the client.</p>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => setSelected(null)}>Connect {selected.name}</Button>
              <Button variant="secondary" className="flex-1" onClick={() => setSelected(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Custom webhook modal */}
      <Modal open={customOpen} onClose={() => setCustomOpen(false)} title="Custom Webhook / API">
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">Don't see your software? Add a custom integration using webhooks or REST APIs.</p>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Integration Name</label>
            <input type="text" placeholder="e.g. My Custom CRM" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Inbound Webhook URL</label>
            <input type="text" placeholder="https://bizops.app/webhooks/custom/..." readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500" />
            <p className="text-xs text-slate-400 mt-1">POST JSON to this URL from your software to push data in.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Outbound Endpoint (optional)</label>
            <input type="text" placeholder="https://yourapp.com/api/data" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Auth Header (optional)</label>
            <input type="password" placeholder="Bearer token or API key" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" />
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => setCustomOpen(false)}>Save Integration</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setCustomOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
