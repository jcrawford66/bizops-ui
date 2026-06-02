import { useBusinessData } from '../context/BusinessDataContext'
import { DollarSign, TrendingUp, Users, Package, AlertTriangle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import StatCard from '../components/ui/StatCard'
import Card, { CardHeader, CardBody } from '../components/ui/Card'
import { useApp } from '../context/AppContext'

const revenueData = [
  { month: 'Jan', revenue: 98000, expenses: 62000 },
  { month: 'Feb', revenue: 112000, expenses: 68000 },
  { month: 'Mar', revenue: 108000, expenses: 65000 },
  { month: 'Apr', revenue: 125000, expenses: 71000 },
  { month: 'May', revenue: 131000, expenses: 74000 },
  { month: 'Jun', revenue: 142500, expenses: 78000 },
]

const teamData = [
  { name: 'Sarah J.', efficiency: 94 },
  { name: 'Marcus T.', efficiency: 88 },
  { name: 'Priya K.', efficiency: 85 },
  { name: 'Tom W.', efficiency: 79 },
  { name: 'Lisa M.', efficiency: 72 },
]

const recentActivity = [
  { id: 1, text: 'New appointment: Michael Torres — June 10, 9 AM', time: '2m ago', type: 'info' },
  { id: 2, text: 'Invoice #1042 marked overdue — $3,400', time: '18m ago', type: 'warning' },
  { id: 3, text: 'Widget Pro inventory below reorder point (3 units)', time: '1h ago', type: 'error' },
  { id: 4, text: 'Monthly revenue target reached — 103%', time: '2h ago', type: 'success' },
  { id: 5, text: 'New customer: Riverdale Bakery onboarded', time: '3h ago', type: 'info' },
]

const TYPE_DOT: Record<string, string> = {
  info: 'bg-blue-400', warning: 'bg-amber-400', error: 'bg-red-400', success: 'bg-emerald-400',
}

export default function Dashboard() {
  const { alerts } = useApp()
  const { metrics } = useBusinessData()
  const unread = alerts.filter(a => !a.read)

  return (
    <div className="space-y-6">
      {/* Alert banner */}
      {unread.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            <span className="font-semibold">{unread.length} alert{unread.length > 1 ? 's' : ''} need your attention</span>
            {' '}— {unread[0].message}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Revenue (MTD)" value={`$${metrics.revenue.toLocaleString()}`} change={8.3} changeLabel="vs last month" icon={DollarSign} />
        <StatCard title="Gross Margin" value={`${metrics.grossMarginPct.toFixed(1)}%`} change={-1.2} changeLabel="vs last month" icon={TrendingUp} iconColor="text-emerald-500" iconBg="bg-emerald-500/15" />
        <StatCard title="Active Customers" value="342" change={5.1} changeLabel="vs last month" icon={Users} iconColor="text-blue-500" iconBg="bg-blue-500/15" />
        <StatCard title="Inventory Alerts" value="14 items" icon={Package} iconColor="text-amber-500" iconBg="bg-amber-500/15" alert />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white text-sm">Revenue vs Expenses</h3>
                <p className="text-xs text-slate-500 mt-0.5">Last 6 months</p>
              </div>
              <Link to="/revenue" className="text-xs text-sky-400 hover:underline flex items-center gap-1">
                View full report <ArrowRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a4a" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: unknown) => [`$${(v as number).toLocaleString()}`, '']} contentStyle={{ borderRadius: '8px', border: '1px solid #1e3a4a', background: '#1e293b', color: '#e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
                <Area type="monotone" dataKey="expenses" stroke="#f59e0b" strokeWidth={2} fill="url(#expGrad)" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Team efficiency */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">Team Efficiency</h3>
              <Link to="/employees" className="text-xs text-sky-400 hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={teamData} layout="vertical" barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a4a" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={55} />
                <Tooltip formatter={(v: unknown) => [`${v as number}%`, 'Efficiency']} contentStyle={{ borderRadius: '8px', border: '1px solid #1e3a4a', background: '#1e293b', color: '#e2e8f0', fontSize: 12 }} />
                <Bar dataKey="efficiency" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-white text-sm">Recent Activity</h3>
          </CardHeader>
          <CardBody className="p-0">
            {recentActivity.map((item, i) => (
              <div key={item.id} className={`flex items-start gap-3 px-5 py-3 ${i < recentActivity.length - 1 ? 'border-b border-slate-700/50' : ''}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${TYPE_DOT[item.type]}`} />
                <p className="text-sm text-slate-300 flex-1">{item.text}</p>
                <span className="text-xs text-slate-400 whitespace-nowrap">{item.time}</span>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Quick links */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-white text-sm">Quick Actions</h3>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-3">
            {[
              { label: 'Add Customer', path: '/customers', color: 'bg-blue-500/15 text-blue-300 hover:bg-blue-500/25' },
              { label: 'New Invoice', path: '/expenses', color: 'bg-teal-500/15 text-teal-300 hover:bg-teal-500/25' },
              { label: 'Log Inventory', path: '/inventory', color: 'bg-amber-50 text-amber-400 hover:bg-amber-100' },
              { label: 'Schedule Post', path: '/social', color: 'bg-pink-500/15 text-pink-300 hover:bg-pink-500/25' },
              { label: 'View Calendar', path: '/calendar', color: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25' },
              { label: 'Integrations', path: '/integrations', color: 'bg-slate-700 text-slate-300 hover:bg-slate-200' },
            ].map(({ label, path, color }) => (
              <Link
                key={label}
                to={path}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${color}`}
              >
                {label} <ArrowRight size={14} />
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
