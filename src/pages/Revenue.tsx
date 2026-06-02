import { useState } from 'react'
import { DollarSign, TrendingUp, Percent, RefreshCw, CheckCircle2 } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts'
import StatCard from '../components/ui/StatCard'
import Card, { CardHeader, CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { useBusinessData } from '../context/BusinessDataContext'

const STANDARD_PLATFORMS = ['Square','Stripe','Shopify','QuickBooks','PayPal','Clover','Toast','Other']

const byCategory = [
  { name: 'Services',      value: 89000, color: '#14b8a6' },
  { name: 'Products',      value: 36500, color: '#22c55e' },
  { name: 'Subscriptions', value: 12000, color: '#f59e0b' },
  { name: 'Consulting',    value: 5000,  color: '#ec4899' },
]

const topProducts = [
  { name: 'Premium Service Package', revenue: 38400, margin: 58, change: 12 },
  { name: 'Enterprise Consulting',   revenue: 24000, margin: 71, change: 8  },
  { name: 'Widget Pro (x47)',         revenue: 18800, margin: 34, change: -3 },
  { name: 'Monthly Retainer — Acme', revenue: 12000, margin: 80, change: 0  },
  { name: 'Hardware Bundle',          revenue: 9300,  margin: 18, change: -7 },
]

export default function Revenue() {
  const { revenueHistory, metrics, connectedPlatforms, addConnectedPlatform, removeConnectedPlatform } = useBusinessData()

  // Build chart data: each month's revenue minus that month's proportional COGS
  const chartData = revenueHistory.map(r => ({
    month: r.month,
    revenue: r.revenue,
    // For past months use historical cost ratio; for current use live expenses
    cost: r.isCurrentMonth ? metrics.totalExpenses : Math.round(r.revenue * 0.57),
    margin: r.isCurrentMonth
      ? metrics.grossMarginPct
      : parseFloat(((r.revenue - r.revenue * 0.57) / r.revenue * 100).toFixed(1)),
  }))

  // Sync modal state
  const [syncOpen, setSyncOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState('Square')
  const [customPlatform, setCustomPlatform] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [locationId, setLocationId] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const isOther = selectedPlatform === 'Other'
  const resolvedPlatformName = isOther ? customPlatform.trim() : selectedPlatform

  const handleConnect = () => {
    if (!apiKey.trim()) return
    if (isOther && !customPlatform.trim()) return
    addConnectedPlatform({
      name: resolvedPlatformName,
      type: 'revenue',
    })
    setSaveSuccess(true)
    setTimeout(() => {
      setSaveSuccess(false)
      setSyncOpen(false)
      setApiKey('')
      setLocationId('')
      setCustomPlatform('')
      setSelectedPlatform('Square')
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500">Revenue and margin metrics — live-linked to your Expenses data</p>
        <div className="flex items-center gap-3">
          {connectedPlatforms.length > 0 && (
            <div className="flex items-center gap-2">
              {connectedPlatforms.map(p => (
                <div key={p.id} className="flex items-center gap-1.5 bg-brand-500/10 border border-brand-500/30 rounded-full px-3 py-1 text-xs text-brand-400">
                  <CheckCircle2 size={11} />
                  {p.name}
                  <button onClick={() => removeConnectedPlatform(p.id)} className="text-brand-600 hover:text-red-400 ml-1 transition-colors">✕</button>
                </div>
              ))}
            </div>
          )}
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => setSyncOpen(true)}>Sync Data</Button>
        </div>
      </div>

      {/* Live KPIs — all derived from shared context */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Revenue (MTD)"
          value={`$${metrics.revenue.toLocaleString()}`}
          change={8.3}
          changeLabel="vs last month"
          icon={DollarSign}
        />
        <StatCard
          title="Gross Profit"
          value={`$${metrics.grossProfit.toLocaleString()}`}
          change={6.1}
          changeLabel="vs last month"
          icon={TrendingUp}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/15"
        />
        <StatCard
          title="Gross Margin (Live)"
          value={`${metrics.grossMarginPct.toFixed(1)}%`}
          icon={Percent}
          iconColor={metrics.grossMarginPct < 30 ? 'text-red-400' : 'text-brand-400'}
          iconBg={metrics.grossMarginPct < 30 ? 'bg-red-500/15' : 'bg-brand-500/15'}
          alert={metrics.grossMarginPct < 30}
        />
        <StatCard
          title="Net Margin (Live)"
          value={`${metrics.netMarginPct.toFixed(1)}%`}
          icon={Percent}
          iconColor={metrics.netMarginPct < 10 ? 'text-red-400' : 'text-blue-400'}
          iconBg={metrics.netMarginPct < 10 ? 'bg-red-500/15' : 'bg-blue-500/15'}
        />
      </div>

      {/* Expense impact callout */}
      <div className="bg-slate-700/30 border border-slate-700 rounded-xl p-4 flex flex-wrap items-center gap-6 text-sm">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Revenue</p>
          <p className="text-white font-bold text-lg">${metrics.revenue.toLocaleString()}</p>
        </div>
        <div className="text-slate-600 text-xl font-light">−</div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Total Expenses</p>
          <p className="text-slate-300 font-bold text-lg">${metrics.totalExpenses.toLocaleString()}</p>
        </div>
        <div className="text-slate-600 text-xl font-light">=</div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Net Profit</p>
          <p className={`font-bold text-lg ${metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {metrics.netProfit >= 0 ? '+' : ''}${metrics.netProfit.toLocaleString()}
          </p>
        </div>
        <div className="ml-auto text-xs text-slate-500">
          ← Updates in real time as you edit expenses
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Cost trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="font-semibold text-white text-sm">Revenue & Cost Trend</h3>
            <p className="text-xs text-slate-500 mt-0.5">Current month cost reflects live expense data</p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="costG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a4a" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: unknown) => [`$${(v as number).toLocaleString()}`, '']} contentStyle={{ borderRadius: '8px', border: '1px solid #1e3a4a', background: '#1e293b', color: '#e2e8f0', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <Area type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={2} fill="url(#revG)" name="Revenue" />
                <Area type="monotone" dataKey="cost" stroke="#f43f5e" strokeWidth={2} fill="url(#costG)" name="Total Costs" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Revenue by category */}
        <Card>
          <CardHeader><h3 className="font-semibold text-white text-sm">Revenue by Category</h3></CardHeader>
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

      {/* Top revenue drivers */}
      <Card>
        <CardHeader><h3 className="font-semibold text-white text-sm">Top Revenue Drivers</h3></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
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
                    <Badge variant={p.margin >= 50 ? 'success' : p.margin >= 30 ? 'info' : 'warning'}>{p.margin}%</Badge>
                  </td>
                  <td className={`px-5 py-3 text-right font-medium text-xs ${p.change > 0 ? 'text-emerald-400' : p.change < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                    {p.change > 0 ? '+' : ''}{p.change}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Sync Data Modal — with "Other" custom platform field + save to platform list */}
      <Modal open={syncOpen} onClose={() => { setSyncOpen(false); setSaveSuccess(false) }} title="Sync Revenue Data">
        <div className="p-6 space-y-4">
          {saveSuccess ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-14 h-14 bg-brand-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 size={28} className="text-brand-400" />
              </div>
              <p className="text-white font-semibold">Platform saved!</p>
              <p className="text-sm text-slate-400 text-center">
                <span className="text-brand-400 font-medium">{resolvedPlatformName}</span> has been added to your connected platforms.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Platform</label>
                <select
                  value={selectedPlatform}
                  onChange={e => { setSelectedPlatform(e.target.value); setCustomPlatform('') }}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                >
                  {STANDARD_PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              {/* Custom platform name — shown only when "Other" is selected */}
              {isOther && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Platform Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={customPlatform}
                    onChange={e => setCustomPlatform(e.target.value)}
                    placeholder="e.g. Lightspeed, Vend, Toast, My Custom POS…"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                  />
                  <p className="text-xs text-slate-500 mt-1">Enter the name of your platform — it will be saved and shown in your connected integrations.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">API Key / Secret Key <span className="text-red-400">*</span></label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Paste your API key"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Location / Account ID</label>
                <input
                  type="text"
                  value={locationId}
                  onChange={e => setLocationId(e.target.value)}
                  placeholder="Your location or account ID"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                />
              </div>

              {/* Already connected list */}
              {connectedPlatforms.filter(p => p.type === 'revenue').length > 0 && (
                <div className="bg-slate-700/40 rounded-xl p-3">
                  <p className="text-xs font-medium text-slate-400 mb-2">Already connected:</p>
                  <div className="flex flex-wrap gap-2">
                    {connectedPlatforms.filter(p => p.type === 'revenue').map(p => (
                      <span key={p.id} className="flex items-center gap-1.5 bg-brand-500/15 border border-brand-500/30 rounded-full px-2.5 py-1 text-xs text-brand-400">
                        <CheckCircle2 size={10} /> {p.name}
                        <button onClick={() => removeConnectedPlatform(p.id)} className="hover:text-red-400 ml-1 transition-colors">✕</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(!apiKey.trim() || (isOther && !customPlatform.trim())) && (
                <p className="text-xs text-slate-500">
                  {isOther && !customPlatform.trim() ? 'Enter a platform name and ' : ''}
                  {!apiKey.trim() ? 'API key is required.' : ''}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1"
                  onClick={handleConnect}
                  disabled={!apiKey.trim() || (isOther && !customPlatform.trim())}
                >
                  Connect & Save Platform
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
