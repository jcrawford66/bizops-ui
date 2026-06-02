import { useState } from 'react'
import { DollarSign, TrendingUp, Percent, RefreshCw } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts'
import StatCard from '../components/ui/StatCard'
import Card, { CardHeader, CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'

const monthly = [
  { month: 'Jan', revenue: 98000, cost: 57000, margin: 41.8 },
  { month: 'Feb', revenue: 112000, cost: 64000, margin: 42.9 },
  { month: 'Mar', revenue: 108000, cost: 62000, margin: 42.6 },
  { month: 'Apr', revenue: 125000, cost: 71000, margin: 43.2 },
  { month: 'May', revenue: 131000, cost: 74000, margin: 43.5 },
  { month: 'Jun', revenue: 142500, cost: 82000, margin: 42.5 },
]

const byCategory = [
  { name: 'Services', value: 89000, color: '#6366f1' },
  { name: 'Products', value: 36500, color: '#22c55e' },
  { name: 'Subscriptions', value: 12000, color: '#f59e0b' },
  { name: 'Consulting', value: 5000, color: '#ec4899' },
]

const topProducts = [
  { name: 'Premium Service Package', revenue: 38400, margin: 58, change: 12 },
  { name: 'Enterprise Consulting', revenue: 24000, margin: 71, change: 8 },
  { name: 'Widget Pro (x47)', revenue: 18800, margin: 34, change: -3 },
  { name: 'Monthly Retainer — Acme', revenue: 12000, margin: 80, change: 0 },
  { name: 'Hardware Bundle', revenue: 9300, margin: 18, change: -7 },
]

export default function Revenue() {
  const [syncOpen, setSyncOpen] = useState(false)
  const [syncForm, setSyncForm] = useState({ platform: 'Square', apiKey: '', locationId: '' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Real-time revenue tracking and margin analysis</p>
        <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => setSyncOpen(true)}>Sync Data</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Revenue (MTD)" value="$142,500" change={8.3} changeLabel="vs last month" icon={DollarSign} />
        <StatCard title="Gross Profit" value="$60,500" change={6.1} changeLabel="vs last month" icon={TrendingUp} iconColor="text-emerald-500" iconBg="bg-emerald-500/15" />
        <StatCard title="Gross Margin" value="42.5%" change={-1.0} changeLabel="vs last month" icon={Percent} iconColor="text-purple-500" iconBg="bg-purple-500/15" />
        <StatCard title="YTD Revenue" value="$716,500" change={14.2} changeLabel="vs last year" icon={DollarSign} iconColor="text-blue-500" iconBg="bg-blue-500/15" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue + margin trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="font-semibold text-white text-sm">Revenue & Margin Trend</h3>
            <p className="text-xs text-slate-500 mt-0.5">Monthly overview — last 6 months</p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="costG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a4a" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: unknown) => [`$${(v as number).toLocaleString()}`, '']} contentStyle={{ borderRadius: '8px', border: '1px solid #1e3a4a', background: '#1e293b', color: '#e2e8f0', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revG)" name="Revenue" />
                <Area type="monotone" dataKey="cost" stroke="#f43f5e" strokeWidth={2} fill="url(#costG)" name="Cost of Goods" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Revenue by category pie */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-white text-sm">Revenue by Category</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={byCategory} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {byCategory.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip formatter={(v: unknown) => [`$${(v as number).toLocaleString()}`, '']} contentStyle={{ borderRadius: '8px', border: '1px solid #1e3a4a', background: '#1e293b', color: '#e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {byCategory.map(c => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                    <span className="text-slate-400">{c.name}</span>
                  </div>
                  <span className="font-medium text-white">${(c.value / 1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Top products */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-white text-sm">Top Revenue Drivers</h3>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/60">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Product / Service</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Revenue</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Margin</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">vs Last Month</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/40 transition-colors">
                  <td className="px-5 py-3 font-medium text-white">{p.name}</td>
                  <td className="px-5 py-3 text-right text-slate-300">${p.revenue.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right">
                    <Badge variant={p.margin >= 50 ? 'success' : p.margin >= 30 ? 'info' : 'warning'}>
                      {p.margin}%
                    </Badge>
                  </td>
                  <td className={`px-5 py-3 text-right font-medium text-xs ${p.change > 0 ? 'text-emerald-600' : p.change < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                    {p.change > 0 ? '+' : ''}{p.change}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={syncOpen} onClose={() => setSyncOpen(false)} title="Sync Revenue Data">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Platform</label>
            <select value={syncForm.platform} onChange={e => setSyncForm(f => ({ ...f, platform: e.target.value }))} className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40">
              {['Square','Stripe','Shopify','QuickBooks','PayPal','Clover','Toast','Other'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">API Key / Secret Key</label>
            <input type="password" value={syncForm.apiKey} onChange={e => setSyncForm(f => ({ ...f, apiKey: e.target.value }))} placeholder="Paste your API key" className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Location / Account ID</label>
            <input type="text" value={syncForm.locationId} onChange={e => setSyncForm(f => ({ ...f, locationId: e.target.value }))} placeholder="Your location or account ID" className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500" />
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
