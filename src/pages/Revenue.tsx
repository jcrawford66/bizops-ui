import { useState } from 'react'
import {
  DollarSign, TrendingUp, Percent, RefreshCw, CheckCircle2,
  AlertTriangle, Plus, Pencil, Save, X, Zap, Clock, Webhook,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts'
import StatCard from '../components/ui/StatCard'
import Card, { CardHeader, CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { useBusinessData, type LiveTicket, type RevenueDriver } from '../context/BusinessDataContext'
import { formatDistanceToNow } from 'date-fns'

const STANDARD_PLATFORMS = ['Square','Stripe','Shopify','QuickBooks','PayPal','Clover','Toast','ServiceTitan','Jobber','Other']

const byCategory = [
  { name: 'Services',      value: 89000, color: '#0ea5e9' },
  { name: 'Products',      value: 36500, color: '#22c55e' },
  { name: 'Subscriptions', value: 12000, color: '#f59e0b' },
  { name: 'Consulting',    value: 5000,  color: '#ec4899' },
]

const STATUS_COLORS: Record<LiveTicket['status'], string> = {
  open:             'bg-blue-500/20 text-blue-300 border-blue-500/30',
  in_progress:      'bg-amber-500/20 text-amber-300 border-amber-500/30',
  pending_approval: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  completed:        'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
}
const STATUS_LABELS: Record<LiveTicket['status'], string> = {
  open: 'Open', in_progress: 'In Progress', pending_approval: 'Pending Approval', completed: 'Completed',
}

export default function Revenue() {
  const {
    revenueHistory, metrics, connectedPlatforms, addConnectedPlatform, removeConnectedPlatform,
    tickets, addTicket, updateTicket, deleteTicket, ticketTotals,
    drivers, addDriver, updateDriver, deleteDriver,
    simulateIncomingTicket, lastWebhookEvent,
  } = useBusinessData()

  // Chart data — current month uses live expense total
  const chartData = revenueHistory.map(r => ({
    month: r.month,
    revenue: r.revenue,
    cost: r.isCurrentMonth ? metrics.totalExpenses : Math.round(r.revenue * 0.57),
  }))

  // ── Sync modal ─────────────────────────────────────────────────────────────
  const [syncOpen, setSyncOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState('Square')
  const [customPlatform, setCustomPlatform] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [locationId, setLocationId] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const isOther = selectedPlatform === 'Other'
  const resolvedName = isOther ? customPlatform.trim() : selectedPlatform

  const handleConnect = () => {
    if (!apiKey.trim() || (isOther && !customPlatform.trim())) return
    addConnectedPlatform({ name: resolvedName, type: 'revenue', webhookUrl: webhookSecret || undefined })
    setSaveSuccess(true)
    setTimeout(() => {
      setSaveSuccess(false); setSyncOpen(false)
      setApiKey(''); setLocationId(''); setWebhookSecret(''); setCustomPlatform(''); setSelectedPlatform('Square')
    }, 1600)
  }

  // ── Add ticket modal ────────────────────────────────────────────────────────
  const [ticketOpen, setTicketOpen] = useState(false)
  const [tForm, setTForm] = useState({
    customer: '', technician: '', status: 'open' as LiveTicket['status'],
    desc: '', qty: '1', unitCost: '', unitPrice: '', notes: '',
  })

  const handleAddTicket = () => {
    if (!tForm.customer.trim() || !tForm.desc.trim()) return
    addTicket({
      ticketNo: `TK-${Date.now().toString().slice(-4)}`,
      customer: tForm.customer,
      technician: tForm.technician || undefined,
      status: tForm.status,
      source: 'manual',
      notes: tForm.notes || undefined,
      lineItems: [{
        description: tForm.desc,
        qty: Number(tForm.qty) || 1,
        unitCost: Number(tForm.unitCost) || 0,
        unitPrice: Number(tForm.unitPrice) || 0,
      }],
    })
    setTicketOpen(false)
    setTForm({ customer: '', technician: '', status: 'open', desc: '', qty: '1', unitCost: '', unitPrice: '', notes: '' })
  }

  // ── Revenue driver editing ──────────────────────────────────────────────────
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null)
  const [driverForm, setDriverForm] = useState({ name: '', revenue: '', cost: '', change: '' })
  const [addDriverOpen, setAddDriverOpen] = useState(false)
  const [addDriverForm, setAddDriverForm] = useState({ name: '', revenue: '', cost: '', change: '' })

  const startDriverEdit = (d: RevenueDriver) => {
    setEditingDriverId(d.id)
    setDriverForm({ name: d.name, revenue: d.revenue.toString(), cost: d.cost.toString(), change: d.change.toString() })
  }
  const saveDriver = (id: string) => {
    updateDriver(id, { name: driverForm.name, revenue: Number(driverForm.revenue), cost: Number(driverForm.cost), change: Number(driverForm.change) })
    setEditingDriverId(null)
  }
  const handleAddDriver = () => {
    if (!addDriverForm.name.trim()) return
    addDriver({ name: addDriverForm.name, revenue: Number(addDriverForm.revenue) || 0, cost: Number(addDriverForm.cost) || 0, change: Number(addDriverForm.change) || 0 })
    setAddDriverOpen(false)
    setAddDriverForm({ name: '', revenue: '', cost: '', change: '' })
  }

  const openTickets = tickets.filter(t => t.status !== 'completed')
  const lowMarginTickets = openTickets.filter(t => ticketTotals(t).margin < metrics.minRequiredMarginPct)

  const inboundWebhookUrl = `https://bizops.app/api/webhooks/revenue/${connectedPlatforms[0]?.id ?? 'YOUR_ID'}`

  return (
    <div className="space-y-6">
      {/* Webhook event toast */}
      {lastWebhookEvent && (
        <div className="flex items-center gap-3 bg-brand-500/15 border border-brand-500/30 rounded-xl p-3 animate-pulse">
          <Zap size={15} className="text-brand-400 flex-shrink-0" />
          <p className="text-sm text-brand-300">{lastWebhookEvent}</p>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500">Live revenue, ticket margin tracking, and expense-linked profitability</p>
        <div className="flex items-center gap-2 flex-wrap">
          {connectedPlatforms.filter(p => p.type === 'revenue').map(p => (
            <div key={p.id} className="flex items-center gap-1.5 bg-brand-500/10 border border-brand-500/30 rounded-full px-3 py-1 text-xs text-brand-400">
              <CheckCircle2 size={11} /> {p.name}
              <button onClick={() => removeConnectedPlatform(p.id)} className="hover:text-red-400 ml-1">✕</button>
            </div>
          ))}
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => setSyncOpen(true)}>Connect Platform</Button>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Revenue (MTD)" value={`$${metrics.revenue.toLocaleString()}`} change={8.3} changeLabel="vs last mo" icon={DollarSign} />
        <StatCard title="Gross Profit" value={`$${metrics.grossProfit.toLocaleString()}`} change={6.1} icon={TrendingUp} iconColor="text-emerald-400" iconBg="bg-emerald-500/15" />
        <StatCard title="Gross Margin" value={`${metrics.grossMarginPct.toFixed(1)}%`} icon={Percent} iconColor={metrics.grossMarginPct < 30 ? 'text-red-400' : 'text-brand-400'} iconBg={metrics.grossMarginPct < 30 ? 'bg-red-500/15' : 'bg-brand-500/15'} alert={metrics.grossMarginPct < 30} />
        <StatCard title="Net Margin" value={`${metrics.netMarginPct.toFixed(1)}%`} icon={Percent} iconColor={metrics.netMarginPct < 10 ? 'text-red-400' : 'text-blue-400'} iconBg={metrics.netMarginPct < 10 ? 'bg-red-500/15' : 'bg-blue-500/15'} />
        {/* ── MIN REQUIRED MARGIN — live calc ── */}
        <div className={`bg-slate-800 rounded-xl border shadow-sm p-5 ${metrics.grossMarginPct < metrics.minRequiredMarginPct ? 'border-red-500/40 ring-1 ring-red-500/20' : 'border-slate-700'}`}>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide leading-tight">Min. Required Margin</p>
          <p className="text-2xl font-bold text-white mt-1">{metrics.minRequiredMarginPct.toFixed(1)}%</p>
          <p className={`text-xs mt-1.5 font-medium ${metrics.grossMarginPct >= metrics.minRequiredMarginPct ? 'text-emerald-400' : 'text-red-400'}`}>
            {metrics.grossMarginPct >= metrics.minRequiredMarginPct
              ? `✓ ${(metrics.grossMarginPct - metrics.minRequiredMarginPct).toFixed(1)}% above breakeven`
              : `⚠ ${(metrics.minRequiredMarginPct - metrics.grossMarginPct).toFixed(1)}% below breakeven`}
          </p>
          <p className="text-[10px] text-slate-600 mt-0.5">Expenses ÷ Revenue · updates live</p>
        </div>
      </div>

      {/* Net profit equation */}
      <div className="bg-slate-700/30 border border-slate-700 rounded-xl p-4 flex flex-wrap items-center gap-5 text-sm">
        {[
          { label: 'Revenue', value: `$${metrics.revenue.toLocaleString()}`, color: 'text-white' },
          { label: '−', value: '', color: 'text-slate-600', divider: true },
          { label: 'Total Expenses', value: `$${metrics.totalExpenses.toLocaleString()}`, color: 'text-slate-300' },
          { label: '=', value: '', color: 'text-slate-600', divider: true },
          { label: 'Net Profit', value: `${metrics.netProfit >= 0 ? '+' : ''}$${metrics.netProfit.toLocaleString()}`, color: metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400' },
        ].map((item, i) => item.divider
          ? <span key={i} className="text-slate-600 text-2xl font-light">{item.label}</span>
          : <div key={i}><p className="text-xs text-slate-500 uppercase tracking-wide">{item.label}</p><p className={`text-lg font-bold ${item.color}`}>{item.value}</p></div>
        )}
        <span className="ml-auto text-xs text-slate-500 italic">← live · changes as you edit expenses</span>
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="font-semibold text-white text-sm">Revenue vs Total Costs</h3>
            <p className="text-xs text-slate-500 mt-0.5">Current month cost = live expense total</p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
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
                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} fill="url(#revG)" name="Revenue" />
                <Area type="monotone" dataKey="cost" stroke="#f43f5e" strokeWidth={2} fill="url(#costG)" name="Total Costs" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h3 className="font-semibold text-white text-sm">Revenue by Category</h3></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={byCategory} cx="50%" cy="50%" innerRadius={42} outerRadius={65} dataKey="value" paddingAngle={3}>
                  {byCategory.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip formatter={(v: unknown) => [`$${(v as number).toLocaleString()}`, '']} contentStyle={{ borderRadius: '8px', border: '1px solid #1e3a4a', background: '#1e293b', color: '#e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-1">
              {byCategory.map(c => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                    <span className="text-slate-400">{c.name}</span>
                  </div>
                  <span className="font-medium text-white">${(c.value/1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ── Live Tickets ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500" />
                </span>
                Live Tickets
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Open tickets from your shop software · Min. margin threshold: <span className={`font-semibold ${lowMarginTickets.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{metrics.minRequiredMarginPct.toFixed(1)}%</span>
              </p>
            </div>
            <div className="flex gap-2">
              {connectedPlatforms.length === 0 && (
                <Button variant="ghost" size="sm" icon={<Zap size={13} />} onClick={simulateIncomingTicket}>
                  Simulate Incoming
                </Button>
              )}
              <Button size="sm" icon={<Plus size={14} />} onClick={() => setTicketOpen(true)}>Add Ticket</Button>
            </div>
          </div>
        </CardHeader>

        {lowMarginTickets.length > 0 && (
          <div className="mx-5 mb-3 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
            <AlertTriangle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">
              <span className="font-semibold">{lowMarginTickets.length} ticket{lowMarginTickets.length > 1 ? 's' : ''} below required margin</span>
              {' '}— {lowMarginTickets.map(t => t.ticketNo).join(', ')} · Raise pricing or cut costs to stay profitable.
            </p>
          </div>
        )}

        {openTickets.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-slate-500">No open tickets</p>
            <p className="text-xs text-slate-600 mt-1">Connect your shop software or add a ticket manually</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {['Ticket', 'Customer', 'Technician', 'Line Items', 'Revenue', 'Cost', 'Margin', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {openTickets.map(ticket => {
                  const tot = ticketTotals(ticket)
                  const belowMin = tot.margin < metrics.minRequiredMarginPct
                  return (
                    <tr key={ticket.id} className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${belowMin ? 'bg-red-500/5' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-brand-400">{ticket.ticketNo}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock size={9} />
                          {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                        </p>
                        {ticket.source === 'webhook' && <span className="text-[9px] bg-brand-500/15 text-brand-400 px-1.5 py-0.5 rounded-full">webhook</span>}
                        {ticket.source === 'simulated' && <span className="text-[9px] bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded-full">simulated</span>}
                      </td>
                      <td className="px-4 py-3 font-medium text-white text-xs">{ticket.customer}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{ticket.technician ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-[180px]">
                        {ticket.lineItems.map((l, i) => (
                          <p key={i} className="truncate">{l.qty}× {l.description}</p>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-white font-semibold text-xs">${tot.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">${tot.cost.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${belowMin ? 'text-red-400' : 'text-emerald-400'}`}>
                          {tot.margin.toFixed(1)}%
                        </span>
                        {belowMin && <AlertTriangle size={11} className="inline text-red-400 ml-1" />}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={ticket.status}
                          onChange={e => updateTicket(ticket.id, { status: e.target.value as LiveTicket['status'] })}
                          className={`text-[10px] font-medium px-2 py-1 rounded-full border bg-transparent cursor-pointer focus:outline-none ${STATUS_COLORS[ticket.status]}`}
                        >
                          {(['open','in_progress','pending_approval','completed'] as const).map(s => (
                            <option key={s} value={s} className="bg-slate-800 text-slate-200">{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <button onClick={() => deleteTicket(ticket.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1"><X size={13} /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-700 bg-slate-700/20">
                  <td colSpan={4} className="px-4 py-2 text-xs text-slate-400 font-medium">Open ticket totals</td>
                  <td className="px-4 py-2 text-white font-bold text-xs">${openTickets.reduce((s, t) => s + ticketTotals(t).revenue, 0).toLocaleString()}</td>
                  <td className="px-4 py-2 text-slate-400 font-medium text-xs">${openTickets.reduce((s, t) => s + ticketTotals(t).cost, 0).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    {openTickets.length > 0 && (() => {
                      const totRev = openTickets.reduce((s, t) => s + ticketTotals(t).revenue, 0)
                      const totCost = openTickets.reduce((s, t) => s + ticketTotals(t).cost, 0)
                      const avg = totRev > 0 ? ((totRev - totCost) / totRev) * 100 : 0
                      return <span className={`text-xs font-bold ${avg >= metrics.minRequiredMarginPct ? 'text-emerald-400' : 'text-red-400'}`}>{avg.toFixed(1)}% avg</span>
                    })()}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Webhook info box */}
        <div className="mx-5 mb-5 mt-3 flex items-start gap-3 bg-slate-700/30 border border-slate-700 rounded-xl p-3">
          <Webhook size={15} className="text-slate-500 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400">Inbound Webhook URL — configure this in your shop software</p>
            <p className="text-xs font-mono text-brand-400 mt-1 truncate">{inboundWebhookUrl}</p>
            <p className="text-[10px] text-slate-600 mt-1">POST a JSON ticket payload to this URL and it will appear here in real time. <button className="underline hover:text-brand-400 transition-colors" onClick={() => setSyncOpen(true)}>Connect a platform →</button></p>
          </div>
        </div>
      </Card>

      {/* ── Revenue Drivers (live, editable) ────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white text-sm">Revenue Drivers</h3>
              <p className="text-xs text-slate-500 mt-0.5">Add, edit, or remove — connects to your ticket and sales data</p>
            </div>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setAddDriverOpen(true)}>Add Driver</Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Product / Service</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Revenue</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Cost</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Margin</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">vs Last Mo.</th>
                <th className="px-3 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {drivers.map(d => {
                const margin = d.revenue > 0 ? ((d.revenue - d.cost) / d.revenue) * 100 : 0
                const editing = editingDriverId === d.id
                return (
                  <tr key={d.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3">
                      {editing
                        ? <input value={driverForm.name} onChange={e => setDriverForm(f => ({...f, name: e.target.value}))} className="w-48 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-400" />
                        : <span className="font-medium text-white">{d.name}</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {editing
                        ? <input type="number" value={driverForm.revenue} onChange={e => setDriverForm(f => ({...f, revenue: e.target.value}))} className="w-24 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-right text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-400" />
                        : <span className="text-slate-300">${d.revenue.toLocaleString()}</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {editing
                        ? <input type="number" value={driverForm.cost} onChange={e => setDriverForm(f => ({...f, cost: e.target.value}))} className="w-24 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-right text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-400" />
                        : <span className="text-slate-500">${d.cost.toLocaleString()}</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Badge variant={margin >= 50 ? 'success' : margin >= 30 ? 'info' : 'warning'}>{margin.toFixed(1)}%</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {editing
                        ? <input type="number" value={driverForm.change} onChange={e => setDriverForm(f => ({...f, change: e.target.value}))} className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-right text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-400" />
                        : <span className={`text-xs font-medium ${d.change > 0 ? 'text-emerald-400' : d.change < 0 ? 'text-red-400' : 'text-slate-500'}`}>{d.change > 0 ? '+' : ''}{d.change}%</span>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {editing ? (
                          <><button onClick={() => saveDriver(d.id)} className="text-brand-400 hover:text-brand-300 p-1"><Save size={14} /></button><button onClick={() => setEditingDriverId(null)} className="text-slate-500 hover:text-slate-300 p-1"><X size={14} /></button></>
                        ) : (
                          <><button onClick={() => startDriverEdit(d)} className="text-slate-500 hover:text-brand-400 p-1"><Pencil size={13} /></button><button onClick={() => deleteDriver(d.id)} className="text-slate-600 hover:text-red-400 p-1"><X size={13} /></button></>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-700 bg-slate-700/20">
                <td className="px-5 py-2 text-xs text-slate-400 font-medium">Totals</td>
                <td className="px-5 py-2 text-right text-white font-bold text-xs">${drivers.reduce((s,d)=>s+d.revenue,0).toLocaleString()}</td>
                <td className="px-5 py-2 text-right text-slate-400 font-medium text-xs">${drivers.reduce((s,d)=>s+d.cost,0).toLocaleString()}</td>
                <td className="px-5 py-2 text-right">
                  {(() => { const r=drivers.reduce((s,d)=>s+d.revenue,0); const c=drivers.reduce((s,d)=>s+d.cost,0); const m=r>0?((r-c)/r)*100:0; return <Badge variant={m>=40?'success':m>=25?'info':'warning'}>{m.toFixed(1)}%</Badge> })()}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* ── Sync / Connect Platform Modal ─────────────────────────────── */}
      <Modal open={syncOpen} onClose={() => { setSyncOpen(false); setSaveSuccess(false) }} title="Connect Revenue Platform" size="md">
        <div className="p-6 space-y-4">
          {saveSuccess ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-14 h-14 bg-brand-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 size={28} className="text-brand-400" />
              </div>
              <p className="text-white font-semibold">Platform connected!</p>
              <p className="text-sm text-slate-400 text-center">
                <span className="text-brand-400 font-medium">{resolvedName}</span> is now saved. Tickets sent to the webhook URL will appear in the Live Tickets feed.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Platform</label>
                <select value={selectedPlatform} onChange={e => { setSelectedPlatform(e.target.value); setCustomPlatform('') }} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400/40">
                  {STANDARD_PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              {isOther && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Platform Name <span className="text-red-400">*</span></label>
                  <input type="text" value={customPlatform} onChange={e => setCustomPlatform(e.target.value)} placeholder="e.g. Lightspeed, Vend, my custom POS…" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-400/40" />
                  <p className="text-[11px] text-slate-500 mt-1">This name will be saved and shown in your connected integrations list.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">API Key / Secret <span className="text-red-400">*</span></label>
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Paste your API key" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400/40" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Location / Account ID</label>
                <input type="text" value={locationId} onChange={e => setLocationId(e.target.value)} placeholder="Your location or account ID" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400/40" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Outbound Webhook Secret (optional)</label>
                <input type="text" value={webhookSecret} onChange={e => setWebhookSecret(e.target.value)} placeholder="Webhook signing secret for verification" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-400/40" />
              </div>

              <div className="bg-slate-700/40 rounded-xl p-3 space-y-1">
                <p className="text-xs font-medium text-slate-400">Your inbound webhook URL:</p>
                <p className="text-xs font-mono text-brand-400 break-all">{inboundWebhookUrl}</p>
                <p className="text-[10px] text-slate-500">Configure this URL in your shop software so new tickets POST here automatically.</p>
              </div>

              {connectedPlatforms.filter(p=>p.type==='revenue').length > 0 && (
                <div className="bg-slate-700/30 rounded-xl p-3">
                  <p className="text-xs font-medium text-slate-400 mb-2">Connected:</p>
                  <div className="flex flex-wrap gap-2">
                    {connectedPlatforms.filter(p=>p.type==='revenue').map(p => (
                      <span key={p.id} className="flex items-center gap-1.5 bg-brand-500/15 border border-brand-500/30 rounded-full px-2.5 py-1 text-xs text-brand-400">
                        <CheckCircle2 size={10}/> {p.name}
                        <button onClick={() => removeConnectedPlatform(p.id)} className="hover:text-red-400 ml-1">✕</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button className="flex-1" onClick={handleConnect} disabled={!apiKey.trim() || (isOther && !customPlatform.trim())}>
                  Connect & Save
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setSyncOpen(false)}>Cancel</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ── Add Ticket Modal ────────────────────────────────────────────── */}
      <Modal open={ticketOpen} onClose={() => setTicketOpen(false)} title="Add Ticket / Estimate">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[{label:'Customer',key:'customer'},{label:'Technician (optional)',key:'technician'}].map(({label,key})=>(
              <div key={key}>
                <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
                <input type="text" value={tForm[key as keyof typeof tForm] as string} onChange={e=>setTForm(f=>({...f,[key]:e.target.value}))} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400/40" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Service / Item Description</label>
            <input type="text" value={tForm.desc} onChange={e=>setTForm(f=>({...f,desc:e.target.value}))} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400/40" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[{label:'Qty',key:'qty'},{label:'Unit Cost ($)',key:'unitCost'},{label:'Unit Price ($)',key:'unitPrice'}].map(({label,key})=>(
              <div key={key}>
                <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
                <input type="number" value={tForm[key as keyof typeof tForm] as string} onChange={e=>setTForm(f=>({...f,[key]:e.target.value}))} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400/40" />
              </div>
            ))}
          </div>
          {tForm.unitPrice && tForm.unitCost && (
            <div className="bg-slate-700/30 rounded-xl p-3 text-xs text-slate-400">
              Estimated margin: <span className={`font-bold ${(((Number(tForm.unitPrice)-Number(tForm.unitCost))/Number(tForm.unitPrice))*100) < metrics.minRequiredMarginPct ? 'text-red-400' : 'text-emerald-400'}`}>
                {(((Number(tForm.unitPrice)-Number(tForm.unitCost))/Number(tForm.unitPrice))*100).toFixed(1)}%
              </span>
              {' '}· Required: <span className="text-white">{metrics.minRequiredMarginPct.toFixed(1)}%</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
            <select value={tForm.status} onChange={e=>setTForm(f=>({...f,status:e.target.value as LiveTicket['status']}))} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400/40">
              {(['open','in_progress','pending_approval'] as const).map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <Button className="flex-1" onClick={handleAddTicket}>Add Ticket</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setTicketOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Driver Modal ────────────────────────────────────────────── */}
      <Modal open={addDriverOpen} onClose={() => setAddDriverOpen(false)} title="Add Revenue Driver">
        <div className="p-6 space-y-4">
          {[{label:'Product / Service Name',key:'name'},{label:'Revenue ($)',key:'revenue'},{label:'Cost ($)',key:'cost'},{label:'Change vs Last Month (%)',key:'change'}].map(({label,key})=>(
            <div key={key}>
              <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
              <input type={key==='name'?'text':'number'} value={addDriverForm[key as keyof typeof addDriverForm]} onChange={e=>setAddDriverForm(f=>({...f,[key]:e.target.value}))} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400/40" />
            </div>
          ))}
          <div className="flex gap-3 pt-1">
            <Button className="flex-1" onClick={handleAddDriver}>Add Driver</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setAddDriverOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
