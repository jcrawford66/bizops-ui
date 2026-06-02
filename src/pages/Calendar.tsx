import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Clock, User, Link2 } from 'lucide-react'
import Card, { CardHeader, CardBody } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import type { CalendarEvent } from '../types'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const events: CalendarEvent[] = [
  { id: '1', title: 'Michael Torres — Service', start: '2025-06-10T09:00', end: '2025-06-10T10:30', type: 'appointment', customer: 'Michael Torres', color: 'bg-blue-500' },
  { id: '2', title: 'Team Standup', start: '2025-06-10T10:00', end: '2025-06-10T10:30', type: 'meeting', color: 'bg-sky-500' },
  { id: '3', title: 'Acme Corp — Quarterly Review', start: '2025-06-11T14:00', end: '2025-06-11T15:00', type: 'meeting', customer: 'Acme Corporation', color: 'bg-emerald-500' },
  { id: '4', title: 'Blue Ridge Roofing — Install', start: '2025-06-12T08:00', end: '2025-06-12T12:00', type: 'appointment', customer: 'Blue Ridge Roofing', color: 'bg-blue-500' },
  { id: '5', title: 'Riverdale Bakery — Onboarding', start: '2025-06-13T11:00', end: '2025-06-13T12:00', type: 'appointment', customer: 'Riverdale Bakery', color: 'bg-blue-500' },
  { id: '6', title: 'Invoice Follow-ups', start: '2025-06-13T15:00', end: '2025-06-13T16:00', type: 'task', color: 'bg-amber-500' },
  { id: '7', title: 'Sandra Wei — Re-engagement Call', start: '2025-06-16T10:30', end: '2025-06-16T11:00', type: 'appointment', customer: 'Sandra Wei', color: 'bg-orange-400' },
  { id: '8', title: 'Staff Training Session', start: '2025-06-17T09:00', end: '2025-06-17T11:00', type: 'meeting', color: 'bg-sky-500' },
]

const TYPE_VARIANT: Record<string, 'info' | 'purple' | 'warning' | 'default'> = {
  appointment: 'info', meeting: 'info', task: 'warning', reminder: 'default',
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function Calendar() {
  const today = new Date(2025, 5, 10) // June 10, 2025
  const [current, setCurrent] = useState({ year: 2025, month: 5 })
  const [addOpen, setAddOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [form, setForm] = useState({ title: '', date: '', time: '', type: 'appointment', customer: '', notes: '' })
  const [syncOpen, setSyncOpen] = useState(false)
  const [syncForm, setSyncForm] = useState({ platform: 'Google Calendar', apiKey: '', calendarId: '' })

  const days = getDaysInMonth(current.year, current.month)
  const firstDay = getFirstDayOfMonth(current.year, current.month)
  const monthName = new Date(current.year, current.month, 1).toLocaleString('default', { month: 'long', year: 'numeric' })

  const prev = () => setCurrent(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 })
  const next = () => setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 })

  const eventsForDay = (day: number) => {
    const dateStr = `${current.year}-${String(current.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.start.startsWith(dateStr))
  }

  const upcomingEvents = events
    .filter(e => new Date(e.start) >= today)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Connect your booking or calendar app for real-time sync</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Link2 size={14} />} onClick={() => setSyncOpen(true)}>Connect Calendar</Button>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>Add Event</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">{monthName}</h3>
              <div className="flex items-center gap-1">
                <button onClick={prev} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"><ChevronLeft size={16} /></button>
                <button onClick={next} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"><ChevronRight size={16} /></button>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-3">
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: days }).map((_, i) => {
                const day = i + 1
                const dayEvents = eventsForDay(day)
                const isToday = day === today.getDate() && current.month === today.getMonth() && current.year === today.getFullYear()
                return (
                  <div key={day} className={`min-h-[72px] p-1 rounded-lg border transition-colors ${isToday ? 'border-brand-500 bg-sky-500/10' : 'border-transparent hover:bg-slate-700/40'}`}>
                    <span className={`text-xs font-medium block mb-1 w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-sky-500/100 text-white' : 'text-slate-500'}`}>
                      {day}
                    </span>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map(ev => (
                        <div key={ev.id} onClick={() => setSelectedEvent(ev)} className={`text-[10px] text-white px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${ev.color}`}>
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] text-slate-400 pl-1">+{dayEvents.length - 2} more</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>

        {/* Upcoming */}
        <Card>
          <CardHeader><h3 className="font-semibold text-white text-sm">Upcoming Events</h3></CardHeader>
          <div className="divide-y divide-slate-700/60">
            {upcomingEvents.map(ev => (
              <div key={ev.id} onClick={() => setSelectedEvent(ev)} className="px-5 py-3 hover:bg-slate-700/40 cursor-pointer transition-colors">
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${ev.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{ev.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock size={10} />
                        {new Date(ev.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(ev.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                    {ev.customer && <span className="flex items-center gap-1 text-xs text-slate-400 mt-0.5"><User size={10} />{ev.customer}</span>}
                  </div>
                  <Badge variant={TYPE_VARIANT[ev.type]}>{ev.type}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Event detail modal */}
      <Modal open={selectedEvent !== null} onClose={() => setSelectedEvent(null)} title="Event Details">
        {selectedEvent && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${selectedEvent.color}`} />
              <h3 className="font-semibold text-white">{selectedEvent.title}</h3>
              <Badge variant={TYPE_VARIANT[selectedEvent.type]}>{selectedEvent.type}</Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock size={15} />
                {new Date(selectedEvent.start).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {new Date(selectedEvent.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} – {new Date(selectedEvent.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </div>
              {selectedEvent.customer && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <User size={15} /> {selectedEvent.customer}
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1">Edit Event</Button>
              <Button variant="danger" className="flex-1">Cancel Event</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add event modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Event">
        <div className="p-6 space-y-4">
          {[{ label: 'Title', key: 'title' }, { label: 'Customer (optional)', key: 'customer' }, { label: 'Date', key: 'date', type: 'date' }, { label: 'Time', key: 'time', type: 'time' }].map(({ label, key, type = 'text' }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
              <input type={type} value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/40">
              {['appointment', 'meeting', 'task', 'reminder'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => setAddOpen(false)}>Save Event</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Connect Calendar Modal */}
      <Modal open={syncOpen} onClose={() => setSyncOpen(false)} title="Connect Calendar / Booking Platform">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Platform</label>
            <select value={syncForm.platform} onChange={e => setSyncForm(f => ({ ...f, platform: e.target.value }))} className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/40">
              {['Google Calendar','Outlook / Microsoft 365','Acuity Scheduling','Calendly','Mindbody','Jobber','ServiceTitan','Other'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">API Key / OAuth Token</label>
            <input type="password" value={syncForm.apiKey} onChange={e => setSyncForm(f => ({ ...f, apiKey: e.target.value }))} placeholder="Paste your token or API key" className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Calendar / Account ID</label>
            <input type="text" value={syncForm.calendarId} onChange={e => setSyncForm(f => ({ ...f, calendarId: e.target.value }))} placeholder="e.g. primary or your@email.com" className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
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
