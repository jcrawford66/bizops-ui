import { useState, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, Clock, User, Link2,
  Pencil, Trash2, CheckCircle2, RefreshCw, Zap, AlertTriangle,
} from 'lucide-react'
import Card, { CardHeader, CardBody } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import type { CalendarEvent } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────
type SyncStatus = { platform: string; lastSync: string; status: 'connected' | 'syncing' | 'error' }

type EventForm = {
  title: string; date: string; startTime: string; endTime: string
  type: CalendarEvent['type']; customer: string; employee: string; notes: string; color: string
}

const COLORS = [
  { label: 'Blue',    value: 'bg-blue-500',    dot: '#3b82f6' },
  { label: 'Teal',    value: 'bg-sky-500',     dot: '#0ea5e9' },
  { label: 'Green',   value: 'bg-emerald-500', dot: '#10b981' },
  { label: 'Amber',   value: 'bg-amber-500',   dot: '#f59e0b' },
  { label: 'Orange',  value: 'bg-orange-400',  dot: '#fb923c' },
  { label: 'Red',     value: 'bg-red-500',     dot: '#ef4444' },
  { label: 'Purple',  value: 'bg-violet-500',  dot: '#8b5cf6' },
]

const TYPE_VARIANT: Record<string, 'info' | 'warning' | 'default' | 'success'> = {
  appointment: 'info', meeting: 'info', task: 'warning', reminder: 'default',
}

const INITIAL_EVENTS: CalendarEvent[] = [
  { id: '1', title: 'Michael Torres — Service',        start: '2025-06-10T09:00', end: '2025-06-10T10:30', type: 'appointment', customer: 'Michael Torres',    color: 'bg-blue-500' },
  { id: '2', title: 'Team Standup',                    start: '2025-06-10T10:00', end: '2025-06-10T10:30', type: 'meeting',     color: 'bg-sky-500' },
  { id: '3', title: 'Acme Corp — Quarterly Review',    start: '2025-06-11T14:00', end: '2025-06-11T15:00', type: 'meeting',     customer: 'Acme Corporation',  color: 'bg-emerald-500' },
  { id: '4', title: 'Blue Ridge Roofing — Install',    start: '2025-06-12T08:00', end: '2025-06-12T12:00', type: 'appointment', customer: 'Blue Ridge Roofing',color: 'bg-blue-500' },
  { id: '5', title: 'Riverdale Bakery — Onboarding',   start: '2025-06-13T11:00', end: '2025-06-13T12:00', type: 'appointment', customer: 'Riverdale Bakery',  color: 'bg-blue-500' },
  { id: '6', title: 'Invoice Follow-ups',              start: '2025-06-13T15:00', end: '2025-06-13T16:00', type: 'task',        color: 'bg-amber-500' },
  { id: '7', title: 'Sandra Wei — Re-engagement Call', start: '2025-06-16T10:30', end: '2025-06-16T11:00', type: 'appointment', customer: 'Sandra Wei',        color: 'bg-orange-400' },
  { id: '8', title: 'Staff Training Session',          start: '2025-06-17T09:00', end: '2025-06-17T11:00', type: 'meeting',     color: 'bg-sky-500' },
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDay(y: number, m: number)    { return new Date(y, m, 1).getDay() }

function fmt(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleString('en-US', opts)
}

function blankForm(ev?: CalendarEvent): EventForm {
  if (ev) {
    const d = ev.start.slice(0, 10)
    const st = ev.start.slice(11, 16)
    const et = ev.end.slice(11, 16)
    return { title: ev.title, date: d, startTime: st, endTime: et, type: ev.type, customer: ev.customer ?? '', employee: ev.employee ?? '', notes: ev.notes ?? '', color: ev.color ?? 'bg-blue-500' }
  }
  return { title: '', date: '', startTime: '', endTime: '', type: 'appointment', customer: '', employee: '', notes: '', color: 'bg-blue-500' }
}

function formToEvent(f: EventForm, id: string): CalendarEvent {
  return {
    id,
    title: f.title,
    start: `${f.date}T${f.startTime || '09:00'}`,
    end:   `${f.date}T${f.endTime   || '10:00'}`,
    type: f.type,
    customer: f.customer || undefined,
    employee: f.employee || undefined,
    notes:    f.notes    || undefined,
    color: f.color,
  }
}

// ─── Sync log entry ───────────────────────────────────────────────────────────
type SyncLog = { id: string; action: string; time: Date; platform: string; ok: boolean }

export default function Calendar() {
  const today = new Date(2025, 5, 10)
  const [current, setCurrent]       = useState({ year: 2025, month: 5 })
  const [calEvents, setCalEvents]   = useState<CalendarEvent[]>(INITIAL_EVENTS)

  // ── Selected event detail ─────────────────────────────────────────────────
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [editOpen, setEditOpen]           = useState(false)
  const [editForm, setEditForm]           = useState<EventForm>(blankForm())

  // ── Add event ─────────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<EventForm>(blankForm())

  // ── Sync / connection ─────────────────────────────────────────────────────
  const [syncOpen, setSyncOpen]     = useState(false)
  const [syncForm, setSyncForm]     = useState({ platform: 'Google Calendar', apiKey: '', calendarId: '', webhookSecret: '' })
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [isSyncing, setIsSyncing]   = useState(false)
  const [syncLogs, setSyncLogs]     = useState<SyncLog[]>([])
  const [syncToast, setSyncToast]   = useState<string | null>(null)

  // Auto-clear toast
  useEffect(() => {
    if (!syncToast) return
    const t = setTimeout(() => setSyncToast(null), 3500)
    return () => clearTimeout(t)
  }, [syncToast])

  // ── Push an action to the connected platform (simulated) ─────────────────
  const pushToplatform = (action: string, eventTitle: string) => {
    if (!syncStatus) return
    setIsSyncing(true)
    const platform = syncStatus.platform
    setTimeout(() => {
      const ok = Math.random() > 0.05   // 95% success rate simulation
      setSyncLogs(prev => [{
        id: Date.now().toString(),
        action: `${action}: "${eventTitle}"`,
        time: new Date(),
        platform,
        ok,
      }, ...prev.slice(0, 19)])
      setSyncStatus(s => s ? { ...s, lastSync: new Date().toLocaleTimeString() } : s)
      setSyncToast(ok
        ? `✓ "${eventTitle}" synced to ${platform}`
        : `⚠ Sync to ${platform} failed — will retry`)
      setIsSyncing(false)
    }, 700)
  }

  // ── Add event ─────────────────────────────────────────────────────────────
  const handleAddEvent = () => {
    if (!addForm.title.trim() || !addForm.date) return
    const ev = formToEvent(addForm, Date.now().toString())
    setCalEvents(prev => [...prev, ev])
    setAddOpen(false)
    setAddForm(blankForm())
    pushToplatform('Created', ev.title)
  }

  // ── Open edit modal ───────────────────────────────────────────────────────
  const openEdit = (ev: CalendarEvent) => {
    setEditForm(blankForm(ev))
    setEditOpen(true)
    setSelectedEvent(null)
  }

  // ── Save edit ─────────────────────────────────────────────────────────────
  const handleSaveEdit = () => {
    if (!selectedEvent && !editForm.title) return
    const id = selectedEvent?.id ?? ''
    const updated = formToEvent(editForm, id)
    setCalEvents(prev => prev.map(e => e.id === id ? updated : e))
    setEditOpen(false)
    setSelectedEvent(null)
    pushToplatform('Updated', updated.title)
  }

  // Keep selectedEvent in sync with edits
  const handleEditFromDetail = () => {
    if (!selectedEvent) return
    setEditForm(blankForm(selectedEvent))
    setSelectedEvent(null)
    setEditOpen(true)
  }

  // ── Cancel / delete event ─────────────────────────────────────────────────
  const handleCancelEvent = () => {
    if (!selectedEvent) return
    const title = selectedEvent.title
    setCalEvents(prev => prev.filter(e => e.id !== selectedEvent.id))
    setSelectedEvent(null)
    setCancelConfirm(false)
    pushToplatform('Cancelled', title)
  }

  // ── Connect calendar ──────────────────────────────────────────────────────
  const handleConnect = () => {
    if (!syncForm.apiKey.trim()) return
    setSyncStatus({ platform: syncForm.platform, lastSync: new Date().toLocaleTimeString(), status: 'connected' })
    setSyncOpen(false)
    setSyncToast(`Connected to ${syncForm.platform} — calendar synced`)
  }

  // ── Manual sync ──────────────────────────────────────────────────────────
  const handleManualSync = () => {
    if (!syncStatus) return
    setIsSyncing(true)
    setSyncStatus(s => s ? { ...s, status: 'syncing' } : s)
    setTimeout(() => {
      setSyncStatus(s => s ? { ...s, status: 'connected', lastSync: new Date().toLocaleTimeString() } : s)
      setIsSyncing(false)
      setSyncToast(`Synced with ${syncStatus.platform}`)
    }, 1200)
  }

  // ── Calendar grid helpers ─────────────────────────────────────────────────
  const days      = getDaysInMonth(current.year, current.month)
  const firstDay  = getFirstDay(current.year, current.month)
  const monthName = new Date(current.year, current.month, 1).toLocaleString('default', { month: 'long', year: 'numeric' })

  const prev = () => setCurrent(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 })
  const next = () => setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 })

  const eventsForDay = (day: number) => {
    const ds = `${current.year}-${String(current.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return calEvents.filter(e => e.start.startsWith(ds))
  }

  const upcomingEvents = calEvents
    .filter(e => new Date(e.start) >= today)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 8)

  return (
    <div className="space-y-6">
      {/* Sync toast */}
      {syncToast && (
        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${syncToast.startsWith('✓') ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : syncToast.startsWith('⚠') ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300' : 'bg-sky-500/10 border border-sky-500/30 text-sky-300'}`}>
          <Zap size={14} className="flex-shrink-0" />
          {syncToast}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {syncStatus ? (
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${syncStatus.status === 'connected' ? 'bg-emerald-400' : syncStatus.status === 'syncing' ? 'bg-amber-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-xs text-slate-400">
                {syncStatus.platform}
                <span className="text-slate-600 ml-1.5">· Last sync {syncStatus.lastSync}</span>
              </span>
              <button onClick={handleManualSync} disabled={isSyncing} className="text-slate-500 hover:text-sky-400 transition-colors disabled:opacity-40 ml-1">
                <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Connect your booking or calendar app for real-time two-way sync</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Link2 size={14} />} onClick={() => setSyncOpen(true)}>
            {syncStatus ? 'Manage Connection' : 'Connect Calendar'}
          </Button>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>Add Event</Button>
        </div>
      </div>

      {/* Main grid + upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
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
              {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: days }).map((_, i) => {
                const day      = i + 1
                const dayEvs   = eventsForDay(day)
                const isToday  = day === today.getDate() && current.month === today.getMonth() && current.year === today.getFullYear()
                return (
                  <div key={day} className={`min-h-[72px] p-1 rounded-lg border transition-colors ${isToday ? 'border-sky-500/50 bg-sky-500/10' : 'border-transparent hover:bg-slate-700/30'}`}>
                    <span className={`text-xs font-medium block mb-1 w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-sky-500 text-white' : 'text-slate-500'}`}>
                      {day}
                    </span>
                    <div className="space-y-0.5">
                      {dayEvs.slice(0, 2).map(ev => (
                        <div key={ev.id} onClick={() => setSelectedEvent(ev)}
                          className={`text-[10px] text-white px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity ${ev.color}`}>
                          {ev.title}
                        </div>
                      ))}
                      {dayEvs.length > 2 && <div className="text-[10px] text-slate-400 pl-1">+{dayEvs.length - 2} more</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>

        {/* Upcoming + sync log */}
        <div className="space-y-4">
          <Card>
            <CardHeader><h3 className="font-semibold text-white text-sm">Upcoming Events</h3></CardHeader>
            <div className="divide-y divide-slate-700/50">
              {upcomingEvents.length === 0 && <p className="px-5 py-4 text-sm text-slate-500">No upcoming events</p>}
              {upcomingEvents.map(ev => (
                <div key={ev.id} onClick={() => setSelectedEvent(ev)}
                  className="px-5 py-3 hover:bg-slate-700/40 cursor-pointer transition-colors group">
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${ev.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{ev.title}</p>
                      <span className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <Clock size={10} />
                        {fmt(ev.start, { month: 'short', day: 'numeric' })} · {fmt(ev.start, { hour: 'numeric', minute: '2-digit' })}
                      </span>
                      {ev.customer && <span className="flex items-center gap-1 text-xs text-slate-500 mt-0.5"><User size={10} />{ev.customer}</span>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={e => { e.stopPropagation(); openEdit(ev) }} className="text-slate-500 hover:text-sky-400 p-1 transition-colors"><Pencil size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Sync log */}
          {syncLogs.length > 0 && (
            <Card>
              <CardHeader><h3 className="font-semibold text-white text-sm">Sync Log</h3></CardHeader>
              <div className="divide-y divide-slate-700/50 max-h-48 overflow-y-auto scrollbar-thin">
                {syncLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 px-4 py-2.5">
                    {log.ok
                      ? <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      : <AlertTriangle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    }
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-300 truncate">{log.action}</p>
                      <p className="text-[10px] text-slate-600">{log.platform} · {log.time.toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ── Event Detail Modal ── */}
      <Modal open={selectedEvent !== null && !cancelConfirm} onClose={() => setSelectedEvent(null)} title="Event Details">
        {selectedEvent && (
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${selectedEvent.color}`} />
              <h3 className="font-semibold text-white text-base flex-1">{selectedEvent.title}</h3>
              <Badge variant={TYPE_VARIANT[selectedEvent.type]}>{selectedEvent.type}</Badge>
            </div>

            {/* Details */}
            <div className="bg-slate-700/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2.5 text-sm text-slate-300">
                <Clock size={15} className="text-slate-500 flex-shrink-0" />
                <div>
                  <p>{fmt(selectedEvent.start, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {fmt(selectedEvent.start, { hour: 'numeric', minute: '2-digit' })} – {fmt(selectedEvent.end, { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              {selectedEvent.customer && (
                <div className="flex items-center gap-2.5 text-sm text-slate-300">
                  <User size={15} className="text-slate-500 flex-shrink-0" />
                  {selectedEvent.customer}
                </div>
              )}
              {selectedEvent.employee && (
                <div className="flex items-center gap-2.5 text-sm text-slate-300">
                  <User size={15} className="text-slate-500 flex-shrink-0" />
                  <span className="text-slate-500 text-xs">Assigned:</span> {selectedEvent.employee}
                </div>
              )}
              {selectedEvent.notes && (
                <p className="text-sm text-slate-400 border-t border-slate-700 pt-3">{selectedEvent.notes}</p>
              )}
            </div>

            {/* Sync status for this event */}
            {syncStatus && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-700/20 rounded-lg px-3 py-2">
                <CheckCircle2 size={12} className="text-emerald-400" />
                Synced with <span className="text-slate-300">{syncStatus.platform}</span>
                <span className="ml-auto">{syncStatus.lastSync}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button className="flex-1" icon={<Pencil size={14} />} onClick={handleEditFromDetail}>
                Edit Event
              </Button>
              <Button variant="danger" className="flex-1" icon={<Trash2 size={14} />}
                onClick={() => { setCancelConfirm(true) }}>
                Cancel Event
              </Button>
            </div>

            {syncStatus && (
              <p className="text-[11px] text-slate-600 text-center">
                Changes will be pushed to {syncStatus.platform} automatically
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* ── Cancel Confirmation Modal ── */}
      <Modal open={cancelConfirm} onClose={() => { setCancelConfirm(false) }} title="Cancel Event" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to cancel <span className="font-semibold text-white">"{selectedEvent?.title}"</span>?
            {syncStatus && <span className="text-slate-500"> It will also be removed from <span className="text-slate-300">{syncStatus.platform}</span>.</span>}
          </p>
          <div className="flex gap-3">
            <Button variant="danger" className="flex-1" onClick={handleCancelEvent}>Yes, Cancel Event</Button>
            <Button variant="secondary" className="flex-1" onClick={() => { setCancelConfirm(false); }}>Keep It</Button>
          </div>
        </div>
      </Modal>

      {/* ── Edit Event Modal ── */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Event" size="lg">
        <div className="p-6 space-y-4">
          <EventFormFields form={editForm} onChange={setEditForm} />
          {syncStatus && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-700/20 rounded-lg px-3 py-2">
              <RefreshCw size={11} />
              Saving will push the update to <span className="text-slate-300">{syncStatus.platform}</span>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <Button className="flex-1" onClick={handleSaveEdit}>Save Changes</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setEditOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Event Modal ── */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Event" size="lg">
        <div className="p-6 space-y-4">
          <EventFormFields form={addForm} onChange={setAddForm} />
          {syncStatus && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-700/20 rounded-lg px-3 py-2">
              <RefreshCw size={11} />
              This event will also be created in <span className="text-slate-300">{syncStatus.platform}</span>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <Button className="flex-1" onClick={handleAddEvent}>Add Event</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* ── Connect Calendar Modal ── */}
      <Modal open={syncOpen} onClose={() => setSyncOpen(false)} title="Connect Calendar / Booking Platform" size="md">
        <div className="p-6 space-y-4">
          {syncStatus && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-300">Connected to {syncStatus.platform}</p>
                <p className="text-xs text-slate-500 mt-0.5">Last synced {syncStatus.lastSync} · Events sync both ways automatically</p>
              </div>
              <button onClick={() => setSyncStatus(null)} className="ml-auto text-slate-500 hover:text-red-400 text-xs transition-colors">Disconnect</button>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Platform</label>
            <select value={syncForm.platform} onChange={e => setSyncForm(f => ({ ...f, platform: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40">
              {['Google Calendar','Outlook / Microsoft 365','Acuity Scheduling','Calendly','Mindbody','Jobber','ServiceTitan','Square Appointments','Other'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">API Key / OAuth Token <span className="text-red-400">*</span></label>
            <input type="password" value={syncForm.apiKey} onChange={e => setSyncForm(f => ({ ...f, apiKey: e.target.value }))}
              placeholder="Paste your token or API key"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Calendar / Account ID</label>
            <input type="text" value={syncForm.calendarId} onChange={e => setSyncForm(f => ({ ...f, calendarId: e.target.value }))}
              placeholder="e.g. primary or your@email.com"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Webhook Secret (for inbound events)</label>
            <input type="text" value={syncForm.webhookSecret} onChange={e => setSyncForm(f => ({ ...f, webhookSecret: e.target.value }))}
              placeholder="Optional — used to verify events pushed from your platform"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
          </div>
          <div className="bg-slate-700/30 rounded-xl p-3">
            <p className="text-xs font-medium text-slate-400 mb-1">Your inbound webhook URL:</p>
            <p className="text-xs font-mono text-sky-400 break-all">https://bizops.app/api/webhooks/calendar/YOUR_ID</p>
            <p className="text-[10px] text-slate-600 mt-1">Configure this in your platform so new bookings/events POST here automatically.</p>
          </div>
          <div className="flex gap-3 pt-1">
            <Button className="flex-1" onClick={handleConnect} disabled={!syncForm.apiKey.trim()}>
              {syncStatus ? 'Update Connection' : 'Connect & Sync'}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setSyncOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Shared event form fields ─────────────────────────────────────────────────
function EventFormFields({ form, onChange }: { form: EventForm; onChange: (f: EventForm) => void }) {
  const set = (k: keyof EventForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    onChange({ ...form, [k]: e.target.value })

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Title <span className="text-red-400">*</span></label>
        <input type="text" value={form.title} onChange={set('title')}
          placeholder="e.g. John Smith — Full Service"
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <label className="block text-xs font-medium text-slate-400 mb-1">Date <span className="text-red-400">*</span></label>
          <input type="date" value={form.date} onChange={set('date')}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Start Time</label>
          <input type="time" value={form.startTime} onChange={set('startTime')}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">End Time</label>
          <input type="time" value={form.endTime} onChange={set('endTime')}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
          <select value={form.type} onChange={set('type')}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40">
            {['appointment','meeting','task','reminder'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Color</label>
          <div className="flex items-center gap-2 mt-1">
            {COLORS.map(c => (
              <button key={c.value} type="button"
                onClick={() => onChange({ ...form, color: c.value })}
                style={{ background: c.dot }}
                className={`w-6 h-6 rounded-full transition-transform ${form.color === c.value ? 'scale-125 ring-2 ring-white/50' : 'hover:scale-110'}`}
                title={c.label}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Customer (optional)</label>
          <input type="text" value={form.customer} onChange={set('customer')} placeholder="Customer name"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Assign To (optional)</label>
          <input type="text" value={form.employee} onChange={set('employee')} placeholder="Team member"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
        <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Optional details, instructions…"
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500 resize-none" />
      </div>
    </div>
  )
}
