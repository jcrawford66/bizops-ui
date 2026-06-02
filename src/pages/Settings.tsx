import { useState, useCallback } from 'react'
import {
  Building2, Bell, Shield, Palette, Users2, Webhook,
  Save, CheckCircle2, Copy, Trash2, Plus, Eye, EyeOff,
  RefreshCw, Send, AlertTriangle,
} from 'lucide-react'
import Card, { CardHeader, CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { useApp } from '../context/AppContext'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'business' | 'notifications' | 'security' | 'appearance' | 'team' | 'webhooks'

const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: 'business',      label: 'Business Profile', icon: Building2 },
  { id: 'notifications', label: 'Notifications',    icon: Bell },
  { id: 'security',      label: 'Security',         icon: Shield },
  { id: 'appearance',    label: 'Appearance',       icon: Palette },
  { id: 'team',          label: 'Team & Access',    icon: Users2 },
  { id: 'webhooks',      label: 'Webhooks',         icon: Webhook },
]

type ApiKey = { id: string; name: string; key: string; created: string; lastUsed?: string }
type TeamMember = { id: string; name: string; email: string; role: string; avatar: string }
type WebhookEndpoint = {
  id: string; url: string; events: string[]; secret?: string
  status: 'active' | 'inactive'; lastTriggered?: string
}

const ALL_WEBHOOK_EVENTS = [
  'new_customer','customer_updated','invoice_paid','invoice_overdue',
  'low_stock','out_of_stock','margin_alert','revenue_goal_hit',
  'new_ticket','ticket_completed','employee_added',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function genKey() {
  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  return 'bz_live_' + Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

function genSecret() {
  const arr = new Uint8Array(20)
  crypto.getRandomValues(arr)
  return 'whsec_' + Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-accent' : 'bg-slate-600'}`}
      style={{ width: 44, height: 22 }}
    >
      <span
        className="absolute bg-white rounded-full shadow transition-transform"
        style={{ width: 18, height: 18, top: 2, left: 2, transform: checked ? 'translateX(22px)' : 'translateX(0)' }}
      />
    </button>
  )
}

function FieldRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-700/50 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0 ml-6">{children}</div>
    </div>
  )
}

function SaveBanner({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg px-4 py-2.5 text-sm text-emerald-400">
      <CheckCircle2 size={15} /> Saved successfully
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className={`p-1.5 rounded transition-colors ${copied ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`} title="Copy">
      {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Settings() {
  const { accentColor, setAccentColor, compactMode, setCompactMode } = useApp()
  const [tab, setTab] = useState<Tab>('business')

  // ── Business Profile ─────────────────────────────────────────────────────
  const [biz, setBiz] = useState({
    name: 'My Business', industry: 'General Services', email: 'owner@mybiz.com',
    phone: '(555) 000-1234', address: '123 Main St', city: 'Austin',
    state: 'TX', zip: '78701', revenueGoal: '150000',
  })
  const [bizSaved, setBizSaved] = useState(false)
  const saveBiz = () => { setBizSaved(true); setTimeout(() => setBizSaved(false), 3000) }

  // ── Notifications ────────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState({
    email: true, sms: false, push: true,
    marginAlerts: true, lowStock: true, newCustomer: true, invoiceOverdue: true, revenueGoal: true,
  })
  const [notifSaved, setNotifSaved] = useState(false)
  const saveNotifs = () => { setNotifSaved(true); setTimeout(() => setNotifSaved(false), 3000) }

  // ── Security — Password ──────────────────────────────────────────────────
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [pwdShow, setPwdShow] = useState({ current: false, next: false, confirm: false })
  const [pwdError, setPwdError] = useState('')
  const [pwdSaved, setPwdSaved] = useState(false)
  const [twoFA, setTwoFA] = useState(false)

  const savePassword = () => {
    if (!pwd.current) { setPwdError('Current password is required.'); return }
    if (pwd.next.length < 8) { setPwdError('New password must be at least 8 characters.'); return }
    if (pwd.next !== pwd.confirm) { setPwdError('Passwords do not match.'); return }
    setPwdError('')
    setPwd({ current: '', next: '', confirm: '' })
    setPwdSaved(true)
    setTimeout(() => setPwdSaved(false), 3000)
  }

  // ── Security — API Keys ──────────────────────────────────────────────────
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { id: 'k1', name: 'Production Key', key: 'bz_live_a3f9...c2e1', created: '2025-05-01', lastUsed: '2025-06-09' },
  ])
  const [newKeyOpen, setNewKeyOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedKey, setGeneratedKey] = useState<ApiKey | null>(null)

  const handleGenerateKey = () => {
    if (!newKeyName.trim()) return
    const key: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName.trim(),
      key: genKey(),
      created: new Date().toISOString().slice(0, 10),
    }
    setGeneratedKey(key)
    setApiKeys(prev => [...prev, { ...key, key: key.key.slice(0, 12) + '...' + key.key.slice(-4) }])
    setNewKeyName('')
  }

  const deleteKey = useCallback((id: string) => setApiKeys(prev => prev.filter(k => k.id !== id)), [])

  // ── Appearance (reads/writes from global AppContext) ─────────────────────
  const [appSaved, setAppSaved] = useState(false)
  const saveApp = () => { setAppSaved(true); setTimeout(() => setAppSaved(false), 3000) }

  // ── Team ─────────────────────────────────────────────────────────────────
  const [members, setMembers] = useState<TeamMember[]>([
    { id: 'm1', name: 'Justin Crawford', email: 'justin@mybiz.com', role: 'Owner',   avatar: 'JC' },
    { id: 'm2', name: 'Sarah Johnson',   email: 'sarah@mybiz.com',  role: 'Manager', avatar: 'SJ' },
    { id: 'm3', name: 'Marcus Torres',   email: 'marcus@mybiz.com', role: 'Staff',   avatar: 'MT' },
  ])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Staff' })
  const [inviteSent, setInviteSent] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState<TeamMember | null>(null)

  const handleInvite = () => {
    if (!inviteForm.email.trim()) return
    setInviteSent(true)
    setTimeout(() => {
      setMembers(prev => [...prev, {
        id: Date.now().toString(),
        name: inviteForm.name || inviteForm.email.split('@')[0],
        email: inviteForm.email,
        role: inviteForm.role,
        avatar: (inviteForm.name || inviteForm.email).slice(0, 2).toUpperCase(),
      }])
      setInviteSent(false)
      setInviteOpen(false)
      setInviteForm({ name: '', email: '', role: 'Staff' })
    }, 1200)
  }

  const updateRole = (id: string, role: string) => setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m))
  const removeMember = (id: string) => { setMembers(prev => prev.filter(m => m.id !== id)); setRemoveConfirm(null) }

  // ── Webhooks ─────────────────────────────────────────────────────────────
  const [hooks, setHooks] = useState<WebhookEndpoint[]>([
    { id: 'wh1', url: 'https://hooks.zapier.com/hooks/catch/abc123', events: ['new_customer','invoice_paid'], status: 'active', lastTriggered: '2025-06-09' },
    { id: 'wh2', url: 'https://api.myapp.com/bizops/events', events: ['low_stock','margin_alert'], status: 'active', lastTriggered: '2025-06-08' },
  ])
  const [hookFormOpen, setHookFormOpen] = useState(false)
  const [editingHook, setEditingHook] = useState<WebhookEndpoint | null>(null)
  const [hookForm, setHookForm] = useState({ url: '', secret: '', events: [] as string[] })
  const [testingHook, setTestingHook] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, 'ok' | 'fail'>>({})
  const [deleteHookConfirm, setDeleteHookConfirm] = useState<WebhookEndpoint | null>(null)

  const openAddHook = () => {
    setEditingHook(null)
    setHookForm({ url: '', secret: genSecret(), events: [] })
    setHookFormOpen(true)
  }
  const openEditHook = (wh: WebhookEndpoint) => {
    setEditingHook(wh)
    setHookForm({ url: wh.url, secret: wh.secret ?? '', events: wh.events })
    setHookFormOpen(true)
  }
  const saveHook = () => {
    if (!hookForm.url.trim() || hookForm.events.length === 0) return
    if (editingHook) {
      setHooks(prev => prev.map(h => h.id === editingHook.id ? { ...h, url: hookForm.url, secret: hookForm.secret, events: hookForm.events } : h))
    } else {
      setHooks(prev => [...prev, { id: Date.now().toString(), url: hookForm.url, secret: hookForm.secret, events: hookForm.events, status: 'active' }])
    }
    setHookFormOpen(false)
  }
  const toggleHookEvent = (ev: string) => setHookForm(f => ({ ...f, events: f.events.includes(ev) ? f.events.filter(e => e !== ev) : [...f.events, ev] }))
  const toggleHookStatus = (id: string) => setHooks(prev => prev.map(h => h.id === id ? { ...h, status: h.status === 'active' ? 'inactive' : 'active' } : h))
  const deleteHook = (id: string) => { setHooks(prev => prev.filter(h => h.id !== id)); setDeleteHookConfirm(null) }
  const testHook = (id: string) => {
    setTestingHook(id)
    setTimeout(() => {
      setTestResult(r => ({ ...r, [id]: Math.random() > 0.2 ? 'ok' : 'fail' }))
      setTestingHook(null)
    }, 1000)
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex gap-6">
        {/* Tab sidebar */}
        <div className="w-52 flex-shrink-0">
          <Card>
            <nav className="p-2 space-y-0.5">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${tab === id ? 'bg-sky-500/15 text-sky-400 font-medium' : 'text-slate-400 hover:bg-slate-700/40 hover:text-white'}`}>
                  <Icon size={16} /> {label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content pane */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* ── BUSINESS PROFILE ── */}
          {tab === 'business' && (
            <Card>
              <CardHeader><h3 className="font-semibold text-white text-sm">Business Profile</h3></CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Business Name', key: 'name' }, { label: 'Industry', key: 'industry' },
                    { label: 'Email',          key: 'email' }, { label: 'Phone',    key: 'phone' },
                    { label: 'Address',        key: 'address' }, { label: 'City',   key: 'city' },
                    { label: 'State',          key: 'state' }, { label: 'ZIP Code', key: 'zip' },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
                      <input type="text" value={biz[key as keyof typeof biz]} onChange={e => setBiz(b => ({ ...b, [key]: e.target.value }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Monthly Revenue Goal ($)</label>
                  <input type="number" value={biz.revenueGoal} onChange={e => setBiz(b => ({ ...b, revenueGoal: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
                </div>
                <div className="flex items-center gap-3">
                  <Button icon={<Save size={14} />} onClick={saveBiz}>Save Changes</Button>
                  <SaveBanner show={bizSaved} />
                </div>
              </CardBody>
            </Card>
          )}

          {/* ── NOTIFICATIONS ── */}
          {tab === 'notifications' && (
            <Card>
              <CardHeader><h3 className="font-semibold text-white text-sm">Notification Preferences</h3></CardHeader>
              <CardBody>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Channels</p>
                <FieldRow label="Email Notifications" description="Receive alerts via email"><Toggle checked={notifs.email} onChange={v => setNotifs(n => ({ ...n, email: v }))} /></FieldRow>
                <FieldRow label="SMS Notifications" description="Receive alerts via text message"><Toggle checked={notifs.sms} onChange={v => setNotifs(n => ({ ...n, sms: v }))} /></FieldRow>
                <FieldRow label="Push Notifications" description="Browser and desktop push alerts"><Toggle checked={notifs.push} onChange={v => setNotifs(n => ({ ...n, push: v }))} /></FieldRow>

                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-5 mb-1">Alert Types</p>
                <FieldRow label="Margin Alerts" description="When an expense reduces margin below threshold"><Toggle checked={notifs.marginAlerts} onChange={v => setNotifs(n => ({ ...n, marginAlerts: v }))} /></FieldRow>
                <FieldRow label="Low Stock Warnings" description="When inventory falls below reorder point"><Toggle checked={notifs.lowStock} onChange={v => setNotifs(n => ({ ...n, lowStock: v }))} /></FieldRow>
                <FieldRow label="New Customer" description="When a new customer is added or books"><Toggle checked={notifs.newCustomer} onChange={v => setNotifs(n => ({ ...n, newCustomer: v }))} /></FieldRow>
                <FieldRow label="Invoice Overdue" description="When an invoice passes its due date"><Toggle checked={notifs.invoiceOverdue} onChange={v => setNotifs(n => ({ ...n, invoiceOverdue: v }))} /></FieldRow>
                <FieldRow label="Revenue Goal Hit" description="When monthly revenue target is reached"><Toggle checked={notifs.revenueGoal} onChange={v => setNotifs(n => ({ ...n, revenueGoal: v }))} /></FieldRow>

                <div className="flex items-center gap-3 pt-4">
                  <Button icon={<Save size={14} />} onClick={saveNotifs}>Save Preferences</Button>
                  <SaveBanner show={notifSaved} />
                </div>
              </CardBody>
            </Card>
          )}

          {/* ── SECURITY ── */}
          {tab === 'security' && (
            <>
              {/* Change password */}
              <Card>
                <CardHeader><h3 className="font-semibold text-white text-sm">Change Password</h3></CardHeader>
                <CardBody className="space-y-4">
                  {([
                    { label: 'Current Password', key: 'current' },
                    { label: 'New Password (min 8 characters)', key: 'next' },
                    { label: 'Confirm New Password', key: 'confirm' },
                  ] as { label: string; key: keyof typeof pwd }[]).map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
                      <div className="relative">
                        <input
                          type={pwdShow[key] ? 'text' : 'password'}
                          value={pwd[key]}
                          onChange={e => setPwd(p => ({ ...p, [key]: e.target.value }))}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 pr-10 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500"
                        />
                        <button type="button" onClick={() => setPwdShow(s => ({ ...s, [key]: !s[key] }))}
                          className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors">
                          {pwdShow[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  ))}
                  {pwdError && (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      <AlertTriangle size={13} /> {pwdError}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Button icon={<Save size={14} />} onClick={savePassword}>Update Password</Button>
                    <SaveBanner show={pwdSaved} />
                  </div>
                </CardBody>
              </Card>

              {/* 2FA */}
              <Card>
                <CardHeader><h3 className="font-semibold text-white text-sm">Two-Factor Authentication</h3></CardHeader>
                <CardBody>
                  <FieldRow label="Enable 2FA" description="Require a verification code when signing in">
                    <Toggle checked={twoFA} onChange={setTwoFA} />
                  </FieldRow>
                  {twoFA && (
                    <div className="mt-4 bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 text-sm text-sky-300">
                      <p className="font-medium mb-1">2FA Setup</p>
                      <p className="text-xs text-sky-400/80">In production this would display a QR code to scan with your authenticator app (Google Authenticator, Authy, etc.). Your backend would generate a TOTP secret and verify the first code before activating.</p>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* API Keys */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-sm">API Keys</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Use these keys to connect external services to BizOps</p>
                    </div>
                    <Button size="sm" icon={<Plus size={14} />} onClick={() => setNewKeyOpen(true)}>Generate New Key</Button>
                  </div>
                </CardHeader>
                <div className="divide-y divide-slate-700/50">
                  {apiKeys.length === 0 && (
                    <p className="px-5 py-6 text-sm text-slate-500 text-center">No API keys yet. Generate one to get started.</p>
                  )}
                  {apiKeys.map(k => (
                    <div key={k.id} className="flex items-center justify-between px-5 py-4 gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200">{k.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs text-slate-400 font-mono bg-slate-700/50 px-2 py-0.5 rounded">{k.key}</code>
                          <CopyButton text={k.key} />
                        </div>
                        <p className="text-xs text-slate-600 mt-1">Created {k.created}{k.lastUsed ? ` · Last used ${k.lastUsed}` : ''}</p>
                      </div>
                      <button onClick={() => deleteKey(k.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1 flex-shrink-0">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* ── APPEARANCE ── */}
          {tab === 'appearance' && (
            <Card>
              <CardHeader><h3 className="font-semibold text-white text-sm">Appearance</h3></CardHeader>
              <CardBody className="space-y-6">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Accent Color</p>
                  <div className="flex gap-3 flex-wrap">
                    {['#0ea5e9','#22c55e','#f59e0b','#ec4899','#a855f7','#f43f5e'].map(c => (
                      <button key={c} onClick={() => setAccentColor(c)} style={{ background: c }}
                        className={`w-9 h-9 rounded-full border-2 transition-all ${accentColor === c ? 'border-white scale-110 ring-2 ring-white/20' : 'border-transparent hover:scale-105'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Selected: <span className="text-slate-300 font-mono">{accentColor}</span></p>
                </div>
                <FieldRow label="Compact Mode" description="Reduce spacing for denser information display">
                  <Toggle checked={compactMode} onChange={setCompactMode} />
                </FieldRow>
                <div className="flex items-center gap-3">
                  <Button icon={<Save size={14} />} onClick={saveApp}>Save Appearance</Button>
                  <SaveBanner show={appSaved} />
                </div>
              </CardBody>
            </Card>
          )}

          {/* ── TEAM & ACCESS ── */}
          {tab === 'team' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-sm">Team Members</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
                  </div>
                  <Button size="sm" icon={<Plus size={14} />} onClick={() => setInviteOpen(true)}>Invite Member</Button>
                </div>
              </CardHeader>
              <div className="divide-y divide-slate-700/50">
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {m.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{m.name}</p>
                        <p className="text-xs text-slate-500">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={m.role}
                        disabled={m.role === 'Owner'}
                        onChange={e => updateRole(m.id, e.target.value)}
                        className="bg-slate-700 border border-slate-600 text-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400/40 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {['Owner','Manager','Staff','Read Only'].map(r => (
                          <option key={r} className="bg-slate-800">{r}</option>
                        ))}
                      </select>
                      {m.role !== 'Owner' && (
                        <button
                          onClick={() => setRemoveConfirm(m)}
                          className="text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ── WEBHOOKS ── */}
          {tab === 'webhooks' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-sm">Webhook Endpoints</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Notify external systems when events happen in BizOps</p>
                  </div>
                  <Button size="sm" icon={<Plus size={14} />} onClick={openAddHook}>Add Endpoint</Button>
                </div>
              </CardHeader>
              <CardBody className="space-y-3">
                {hooks.length === 0 && (
                  <div className="text-center py-8">
                    <Webhook size={28} className="text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No webhooks yet. Add one to start pushing events.</p>
                  </div>
                )}
                {hooks.map(wh => (
                  <div key={wh.id} className={`rounded-xl border p-4 space-y-3 ${wh.status === 'active' ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-800/50 border-slate-700/50 opacity-60'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${wh.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          <span className="text-xs text-slate-400">{wh.status === 'active' ? 'Active' : 'Inactive'}</span>
                          {wh.lastTriggered && <span className="text-xs text-slate-600">· Last triggered {wh.lastTriggered}</span>}
                          {testResult[wh.id] && (
                            <Badge variant={testResult[wh.id] === 'ok' ? 'success' : 'error'}>
                              {testResult[wh.id] === 'ok' ? '200 OK' : 'Failed'}
                            </Badge>
                          )}
                        </div>
                        <p className="font-mono text-xs text-slate-200 break-all">{wh.url}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => testHook(wh.id)}
                          disabled={testingHook === wh.id}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-sky-400 border border-slate-600 hover:border-sky-500/40 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          title="Send test event"
                        >
                          {testingHook === wh.id ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                          {testingHook === wh.id ? 'Testing…' : 'Test'}
                        </button>
                        <button onClick={() => openEditHook(wh)} className="text-xs text-slate-400 hover:text-slate-200 border border-slate-600 hover:border-slate-500 px-2.5 py-1.5 rounded-lg transition-colors">
                          Edit
                        </button>
                        <button onClick={() => toggleHookStatus(wh.id)} className={`text-xs border px-2.5 py-1.5 rounded-lg transition-colors ${wh.status === 'active' ? 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10' : 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'}`}>
                          {wh.status === 'active' ? 'Pause' : 'Enable'}
                        </button>
                        <button onClick={() => setDeleteHookConfirm(wh)} className="text-slate-600 hover:text-red-400 border border-slate-700 hover:border-red-500/30 p-1.5 rounded-lg transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {wh.events.map(ev => (
                        <span key={ev} className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{ev}</span>
                      ))}
                    </div>
                    {wh.secret && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">Signing secret:</span>
                        <code className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                          {wh.secret.slice(0, 14)}…
                        </code>
                        <CopyButton text={wh.secret} />
                      </div>
                    )}
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* ── Generate API Key Modal ── */}
      <Modal open={newKeyOpen} onClose={() => { setNewKeyOpen(false); setGeneratedKey(null); setNewKeyName('') }} title="Generate API Key">
        <div className="p-6 space-y-4">
          {generatedKey ? (
            <>
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
                <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                <p className="text-sm text-emerald-300 font-medium">Key generated — copy it now, it won't be shown again.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
                <p className="text-sm text-slate-200">{generatedKey.name}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">API Key</label>
                <div className="flex items-center gap-2 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2">
                  <code className="text-xs font-mono text-sky-300 flex-1 break-all">{generatedKey.key}</code>
                  <CopyButton text={generatedKey.key} />
                </div>
              </div>
              <Button className="w-full" onClick={() => { setNewKeyOpen(false); setGeneratedKey(null); setNewKeyName('') }}>
                Done — I've copied my key
              </Button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Key Name / Purpose <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder="e.g. Production, Zapier Integration, Mobile App…"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500"
                  onKeyDown={e => e.key === 'Enter' && handleGenerateKey()}
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-500">The full key will only be shown once immediately after generation. Store it somewhere safe.</p>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={handleGenerateKey} disabled={!newKeyName.trim()} icon={<RefreshCw size={14} />}>
                  Generate Key
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setNewKeyOpen(false)}>Cancel</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ── Add / Edit Webhook Modal ── */}
      <Modal open={hookFormOpen} onClose={() => setHookFormOpen(false)} title={editingHook ? 'Edit Webhook' : 'Add Webhook Endpoint'} size="lg">
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Endpoint URL <span className="text-red-400">*</span></label>
            <input type="url" value={hookForm.url} onChange={e => setHookForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://your-app.com/webhooks/bizops"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Signing Secret</label>
            <div className="flex items-center gap-2">
              <input type="text" value={hookForm.secret} onChange={e => setHookForm(f => ({ ...f, secret: e.target.value }))}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm font-mono text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
              <button onClick={() => setHookForm(f => ({ ...f, secret: genSecret() }))}
                className="text-xs text-sky-400 hover:text-sky-300 border border-sky-500/30 hover:bg-sky-500/10 px-3 py-2 rounded-lg transition-colors whitespace-nowrap">
                Regenerate
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Used to verify the webhook signature on your server (HMAC-SHA256).</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Events to Subscribe To <span className="text-red-400">*</span>
              <span className="text-slate-600 font-normal ml-2">({hookForm.events.length} selected)</span>
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto scrollbar-thin pr-1">
              {ALL_WEBHOOK_EVENTS.map(ev => (
                <label key={ev} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${hookForm.events.includes(ev) ? 'bg-sky-500/15 border-sky-500/30 text-sky-300' : 'bg-slate-700/40 border-slate-600 text-slate-400 hover:border-slate-500'}`}>
                  <input type="checkbox" checked={hookForm.events.includes(ev)} onChange={() => toggleHookEvent(ev)} className="accent-sky-500 flex-shrink-0" />
                  <span className="text-xs font-mono">{ev}</span>
                </label>
              ))}
            </div>
          </div>
          {hookForm.events.length === 0 && (
            <p className="text-xs text-amber-400 flex items-center gap-1.5"><AlertTriangle size={12} /> Select at least one event.</p>
          )}
          <div className="flex gap-3 pt-1">
            <Button className="flex-1" onClick={saveHook} disabled={!hookForm.url.trim() || hookForm.events.length === 0}>
              {editingHook ? 'Save Changes' : 'Add Endpoint'}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setHookFormOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* ── Invite Member Modal ── */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Team Member">
        <div className="p-6 space-y-4">
          {inviteSent ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-14 h-14 bg-sky-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 size={28} className="text-sky-400" />
              </div>
              <p className="text-white font-semibold">Invitation sent!</p>
              <p className="text-sm text-slate-400 text-center">An invite email has been sent to <span className="text-sky-400">{inviteForm.email}</span>.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Full Name (optional)</label>
                <input type="text" value={inviteForm.name} onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Jane Smith"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email Address <span className="text-red-400">*</span></label>
                <input type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="jane@yourbusiness.com"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Role</label>
                <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40">
                  {['Manager','Staff','Read Only'].map(r => <option key={r} className="bg-slate-800">{r}</option>)}
                </select>
                <p className="text-xs text-slate-500 mt-1">Owner and Manager roles have full edit access. Staff can add/update data. Read Only can only view.</p>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={handleInvite} disabled={!inviteForm.email.trim()} icon={<Send size={14} />}>
                  Send Invitation
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setInviteOpen(false)}>Cancel</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ── Remove Member Confirm ── */}
      <Modal open={removeConfirm !== null} onClose={() => setRemoveConfirm(null)} title="Remove Team Member" size="sm">
        {removeConfirm && (
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-300">
              Are you sure you want to remove <span className="font-semibold text-white">{removeConfirm.name}</span>? They will lose access immediately.
            </p>
            <div className="flex gap-3">
              <Button variant="danger" className="flex-1" onClick={() => removeMember(removeConfirm.id)}>Remove</Button>
              <Button variant="secondary" className="flex-1" onClick={() => setRemoveConfirm(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Webhook Confirm ── */}
      <Modal open={deleteHookConfirm !== null} onClose={() => setDeleteHookConfirm(null)} title="Delete Webhook" size="sm">
        {deleteHookConfirm && (
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-300">
              Delete the endpoint <span className="font-mono text-xs text-slate-200 break-all">{deleteHookConfirm.url}</span>?<br />
              This cannot be undone and the receiving system will stop getting events.
            </p>
            <div className="flex gap-3">
              <Button variant="danger" className="flex-1" onClick={() => deleteHook(deleteHookConfirm.id)}>Delete</Button>
              <Button variant="secondary" className="flex-1" onClick={() => setDeleteHookConfirm(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
