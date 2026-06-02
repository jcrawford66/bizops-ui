import { Users2, Clock, CheckCircle, DollarSign } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import StatCard from '../components/ui/StatCard'
import Card, { CardHeader, CardBody } from '../components/ui/Card'
import type { Employee } from '../types'

const employees: Employee[] = [
  { id: '1', name: 'Sarah Johnson', role: 'Senior Technician', efficiency: 94, tasksCompleted: 47, hoursLogged: 168, revenue: 32400 },
  { id: '2', name: 'Marcus Torres', role: 'Account Manager', efficiency: 88, tasksCompleted: 62, hoursLogged: 172, revenue: 28100 },
  { id: '3', name: 'Priya Kapoor', role: 'Operations Lead', efficiency: 85, tasksCompleted: 38, hoursLogged: 160, revenue: 21800 },
  { id: '4', name: 'Tom Whitfield', role: 'Technician', efficiency: 79, tasksCompleted: 34, hoursLogged: 155, revenue: 18600 },
  { id: '5', name: 'Lisa Martinez', role: 'Customer Success', efficiency: 72, tasksCompleted: 55, hoursLogged: 148, revenue: 14200 },
  { id: '6', name: 'Derek Okafor', role: 'Apprentice Tech', efficiency: 64, tasksCompleted: 22, hoursLogged: 140, revenue: 8900 },
]

const radarData = [
  { metric: 'Efficiency', Sarah: 94, Marcus: 88 },
  { metric: 'Tasks', Sarah: 90, Marcus: 95 },
  { metric: 'Revenue', Sarah: 98, Marcus: 85 },
  { metric: 'Punctuality', Sarah: 92, Marcus: 80 },
  { metric: 'Satisfaction', Sarah: 88, Marcus: 90 },
]

function EfficiencyBar({ value }: { value: number }) {
  const color = value >= 85 ? 'bg-emerald-500' : value >= 70 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-700 w-8 text-right">{value}%</span>
    </div>
  )
}

export default function Employees() {
  const avgEfficiency = Math.round(employees.reduce((s, e) => s + e.efficiency, 0) / employees.length)
  const totalRevenue = employees.reduce((s, e) => s + e.revenue, 0)
  const totalHours = employees.reduce((s, e) => s + e.hoursLogged, 0)

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">Connect your scheduling or HR platform to pull live metrics</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Avg Efficiency" value={`${avgEfficiency}%`} change={2.1} icon={CheckCircle} iconColor="text-emerald-500" iconBg="bg-emerald-50" />
        <StatCard title="Team Members" value={`${employees.length}`} icon={Users2} />
        <StatCard title="Total Hours (MTD)" value={totalHours.toString()} icon={Clock} iconColor="text-blue-500" iconBg="bg-blue-50" />
        <StatCard title="Revenue Attributed" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} iconColor="text-purple-500" iconBg="bg-purple-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee table */}
        <Card className="lg:col-span-2">
          <CardHeader><h3 className="font-semibold text-slate-900 text-sm">Team Performance</h3></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Employee</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-40">Efficiency</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Tasks</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Hours</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{emp.name}</p>
                          <p className="text-xs text-slate-400">{emp.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 w-40"><EfficiencyBar value={emp.efficiency} /></td>
                    <td className="px-5 py-3 text-right text-slate-700">{emp.tasksCompleted}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{emp.hoursLogged}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">${emp.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Radar */}
        <Card>
          <CardHeader><h3 className="font-semibold text-slate-900 text-sm">Top 2 Comparison</h3></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Radar name="Sarah J." dataKey="Sarah" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                <Radar name="Marcus T." dataKey="Marcus" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-600"><span className="w-3 h-0.5 bg-brand-500 inline-block" /> Sarah J.</div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600"><span className="w-3 h-0.5 bg-emerald-500 inline-block" /> Marcus T.</div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Revenue per employee bar */}
      <Card>
        <CardHeader><h3 className="font-semibold text-slate-900 text-sm">Revenue Attributed per Employee (MTD)</h3></CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={employees.map(e => ({ name: e.name.split(' ')[0], revenue: e.revenue }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: unknown) => [`$${(v as number).toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  )
}
