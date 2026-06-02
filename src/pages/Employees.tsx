import { useState } from 'react'
import { Users2, Clock, CheckCircle, DollarSign, Pencil, Save, X, Plus, RefreshCw } from 'lucide-react'
import {
  RadialBarChart, RadialBar, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import StatCard from '../components/ui/StatCard'
import Card, { CardHeader, CardBody } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import type { Employee } from '../types'

const INITIAL_EMPLOYEES: Employee[] = [
  { id: '1', name: 'Sarah Johnson',  role: 'Senior Technician', efficiency: 94, tasksCompleted: 47, hoursLogged: 168, revenue: 32400 },
  { id: '2', name: 'Marcus Torres',  role: 'Account Manager',   efficiency: 88, tasksCompleted: 62, hoursLogged: 172, revenue: 28100 },
  { id: '3', name: 'Priya Kapoor',   role: 'Operations Lead',   efficiency: 85, tasksCompleted: 38, hoursLogged: 160, revenue: 21800 },
  { id: '4', name: 'Tom Whitfield',  role: 'Technician',        efficiency: 79, tasksCompleted: 34, hoursLogged: 155, revenue: 18600 },
  { id: '5', name: 'Lisa Martinez',  role: 'Customer Success',  efficiency: 72, tasksCompleted: 55, hoursLogged: 148, revenue: 14200 },
  { id: '6', name: 'Derek Okafor',   role: 'Apprentice Tech',   efficiency: 64, tasksCompleted: 22, hoursLogged: 140, revenue: 8900 },
]

const EFFICIENCY_COLORS = ['#14b8a6','#f59e0b','#6366f1','#ec4899','#22c55e','#f97316']

function EfficiencyBar({ value }: { value: number }) {
  const color = value >= 85 ? 'bg-teal-400' : value >= 70 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-300 w-8 text-right">{value}%</span>
    </div>
  )
}

type EditForm = { name: string; role: string; efficiency: string; tasksCompleted: string; hoursLogged: string; revenue: string }
const blankForm = (): EditForm => ({ name: '', role: '', efficiency: '', tasksCompleted: '', hoursLogged: '', revenue: '' })

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>(blankForm())
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<EditForm>(blankForm())
  const [syncOpen, setSyncOpen] = useState(false)
  const [syncForm, setSyncForm] = useState({ platform: 'Gusto', customPlatform: '', apiKey: '', endpoint: '' })

  const avgEfficiency = Math.round(employees.reduce((s, e) => s + e.efficiency, 0) / employees.length)
  const totalRevenue = employees.reduce((s, e) => s + e.revenue, 0)
  const totalHours = employees.reduce((s, e) => s + e.hoursLogged, 0)

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id)
    setEditForm({
      name: emp.name, role: emp.role,
      efficiency: emp.efficiency.toString(),
      tasksCompleted: emp.tasksCompleted.toString(),
      hoursLogged: emp.hoursLogged.toString(),
      revenue: emp.revenue.toString(),
    })
  }

  const saveEdit = (id: string) => {
    setEmployees(prev => prev.map(e => e.id !== id ? e : {
      ...e,
      name: editForm.name,
      role: editForm.role,
      efficiency: Math.min(100, Math.max(0, Number(editForm.efficiency) || e.efficiency)),
      tasksCompleted: Number(editForm.tasksCompleted) || e.tasksCompleted,
      hoursLogged: Number(editForm.hoursLogged) || e.hoursLogged,
      revenue: Number(editForm.revenue) || e.revenue,
    }))
    setEditingId(null)
  }

  const handleAdd = () => {
    if (!addForm.name.trim()) return
    const newEmp: Employee = {
      id: Date.now().toString(),
      name: addForm.name,
      role: addForm.role || 'Staff',
      efficiency: Number(addForm.efficiency) || 75,
      tasksCompleted: Number(addForm.tasksCompleted) || 0,
      hoursLogged: Number(addForm.hoursLogged) || 0,
      revenue: Number(addForm.revenue) || 0,
    }
    setEmployees(prev => [...prev, newEmp])
    setAddOpen(false)
    setAddForm(blankForm())
  }

  const handleRemove = (id: string) => setEmployees(prev => prev.filter(e => e.id !== id))

  // Radial bar data — sorted best to worst so chart reads top-to-bottom
  const radialData = [...employees]
    .sort((a, b) => b.efficiency - a.efficiency)
    .map((e, i) => ({
      name: e.name.split(' ')[0],
      efficiency: e.efficiency,
      fill: EFFICIENCY_COLORS[i] ?? '#ccfbf1',
    }))

  const efficiencyBadge = (v: number) => v >= 85 ? 'success' : v >= 70 ? 'warning' : 'error'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500">Track team performance — connect your HR/scheduling software or enter manually</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => setSyncOpen(true)}>Sync HR Platform</Button>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>Add Employee</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Avg Efficiency" value={`${avgEfficiency}%`} change={2.1} icon={CheckCircle} iconColor="text-teal-600" iconBg="bg-teal-400/15" />
        <StatCard title="Team Members" value={`${employees.length}`} icon={Users2} />
        <StatCard title="Total Hours (MTD)" value={totalHours.toString()} icon={Clock} iconColor="text-blue-500" iconBg="bg-blue-500/15" />
        <StatCard title="Revenue Attributed" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} iconColor="text-sky-400" iconBg="bg-sky-500/15" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editable employee table */}
        <Card className="lg:col-span-2">
          <CardHeader><h3 className="font-semibold text-white text-sm">Team Performance</h3></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Employee</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-36">Efficiency</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Tasks</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Hours</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Revenue</th>
                  <th className="px-3 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => {
                  const editing = editingId === emp.id
                  return (
                    <tr key={emp.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3">
                        {editing ? (
                          <div className="space-y-1">
                            <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400" />
                            <input value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} className="w-full border border-slate-700 rounded px-2 py-1 text-xs text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-400" placeholder="Role" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {emp.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-medium text-white">{emp.name}</p>
                              <p className="text-xs text-slate-400">{emp.role}</p>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 w-36">
                        {editing ? (
                          <input type="number" min="0" max="100" value={editForm.efficiency} onChange={e => setEditForm(f => ({ ...f, efficiency: e.target.value }))} className="w-20 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400" />
                        ) : (
                          <EfficiencyBar value={emp.efficiency} />
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {editing ? <input type="number" value={editForm.tasksCompleted} onChange={e => setEditForm(f => ({ ...f, tasksCompleted: e.target.value }))} className="w-16 border border-slate-700 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-brand-400" /> : <span className="text-slate-300">{emp.tasksCompleted}</span>}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {editing ? <input type="number" value={editForm.hoursLogged} onChange={e => setEditForm(f => ({ ...f, hoursLogged: e.target.value }))} className="w-16 border border-slate-700 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-brand-400" /> : <span className="text-slate-300">{emp.hoursLogged}</span>}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {editing ? <input type="number" value={editForm.revenue} onChange={e => setEditForm(f => ({ ...f, revenue: e.target.value }))} className="w-24 border border-slate-700 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-brand-400" /> : <span className="font-semibold text-white">${emp.revenue.toLocaleString()}</span>}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {editing ? (
                            <>
                              <button onClick={() => saveEdit(emp.id)} className="text-teal-600 hover:text-teal-700 p-1 rounded transition-colors" title="Save"><Save size={14} /></button>
                              <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-400 p-1 rounded transition-colors" title="Cancel"><X size={14} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(emp)} className="text-slate-400 hover:text-teal-600 p-1 rounded transition-colors" title="Edit"><Pencil size={13} /></button>
                              <button onClick={() => handleRemove(emp.id)} className="text-slate-300 hover:text-red-400 p-1 rounded transition-colors" title="Remove"><X size={13} /></button>
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

        {/* Circular efficiency chart */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-white text-sm">Efficiency Scores</h3>
            <p className="text-xs text-slate-400 mt-0.5">Each ring = one team member</p>
          </CardHeader>
          <CardBody className="pb-2">
            <ResponsiveContainer width="100%" height={220}>
              <RadialBarChart
                cx="50%" cy="50%"
                innerRadius="20%"
                outerRadius="90%"
                data={radialData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  dataKey="efficiency"
                  cornerRadius={4}
                  background={{ fill: '#f1f5f9' }}
                  label={false}
                />
                <Tooltip
                  formatter={(v: unknown) => [`${v as number}%`, 'Efficiency']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #1e3a4a', background: '#1e293b', color: '#e2e8f0', fontSize: 12 }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="space-y-1.5 mt-1">
              {radialData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                    <span className="text-slate-400">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${d.efficiency}%`, background: d.fill }} />
                    </div>
                    <Badge variant={efficiencyBadge(d.efficiency)}>{d.efficiency}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Revenue attribution bar */}
      <Card>
        <CardHeader><h3 className="font-semibold text-white text-sm">Revenue Attributed per Team Member (MTD)</h3></CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={employees.map(e => ({ name: e.name.split(' ')[0], revenue: e.revenue }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a4a" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: unknown) => [`$${(v as number).toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: '8px', border: '1px solid #1e3a4a', background: '#1e293b', color: '#e2e8f0', fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Add Employee Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Team Member">
        <div className="p-6 space-y-4">
          {[
            { label: 'Full Name', key: 'name' }, { label: 'Role / Title', key: 'role' },
            { label: 'Efficiency % (0–100)', key: 'efficiency' }, { label: 'Tasks Completed', key: 'tasksCompleted' },
            { label: 'Hours Logged', key: 'hoursLogged' }, { label: 'Revenue Attributed ($)', key: 'revenue' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
              <input
                type="text"
                value={addForm[key as keyof EditForm]}
                onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={handleAdd}>Add Member</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Sync HR Modal */}
      <Modal open={syncOpen} onClose={() => setSyncOpen(false)} title="Sync HR / Scheduling Platform">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Platform</label>
            <select
              value={syncForm.platform}
              onChange={e => setSyncForm(f => ({ ...f, platform: e.target.value, customPlatform: '' }))}
              className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
            >
              {['Gusto','BambooHR','ADP','Rippling','When I Work','Deputy','Homebase','Paychex','Sage HR','HiBob','Workday','Other'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          {syncForm.platform === 'Other' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Platform Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={syncForm.customPlatform}
                onChange={e => setSyncForm(f => ({ ...f, customPlatform: e.target.value }))}
                placeholder="e.g. Zenefits, Paylocity, my custom HRIS…"
                className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">This name will be saved and shown in your connection status.</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">API Key</label>
            <input type="password" value={syncForm.apiKey} onChange={e => setSyncForm(f => ({ ...f, apiKey: e.target.value }))} placeholder="Paste your API key" className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">API Endpoint (if applicable)</label>
            <input type="text" value={syncForm.endpoint} onChange={e => setSyncForm(f => ({ ...f, endpoint: e.target.value }))} placeholder="https://api.yourplatform.com" className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1"
              disabled={syncForm.platform === 'Other' && !syncForm.customPlatform.trim()}
              onClick={() => setSyncOpen(false)}
            >
              Connect & Sync
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setSyncOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
