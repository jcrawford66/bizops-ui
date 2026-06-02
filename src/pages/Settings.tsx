import { useState } from 'react'
import { Building2, Bell, Shield, Palette, Users2, Webhook, Save } from 'lucide-react'
import Card, { CardHeader, CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'

type Tab = 'business' | 'notifications' | 'security' | 'appearance' | 'team' | 'webhooks'

const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: 'business',      label: 'Business Profile', icon: Building2 },
  { id: 'notifications', label: 'Notifications',    icon: Bell },
  { id: 'security',      label: 'Security',          icon: Shield },
  { id: 'appearance',    label: 'Appearance',        icon: Palette },
  { id: 'team',          label: 'Team & Access',     icon: Users2 },
  { id: 'webhooks',      label: 'Webhooks',          icon: Webhook },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-10 h-5.5 relative rounded-full transition-colors ${checked ? 'bg-brand-500' : 'bg-slate-700'}`}
      style={{ height: '22px', width: '44px' }}
    >
      <span className={`absolute top-0.5 w-4.5 h-4.5 bg-slate-800 rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} style={{ width: '18px', height: '18px', top: '2px', left: '2px', transform: checked ? 'translateX(22px)' : 'translateX(0)' }} />
    </button>
  )
}

function FieldRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0 ml-6">{children}</div>
    </div>
  )
}

export default function Settings() {
  const [tab, setTab] = useState<Tab>('business')
  const [biz, setBiz] = useState({ name: 'My Business', industry: 'General Services', email: 'owner@mybiz.com', phone: '(555) 000-1234', address: '123 Main St', city: 'Austin', state: 'TX', zip: '78701' })
  const [notifs, setNotifs] = useState({ email: true, sms: false, push: true, marginAlerts: true, lowStock: true, newCustomer: true, invoiceOverdue: true, revenueGoal: true })
  const [appearance, setAppearance] = useState({ accentColor: '#6366f1', compactMode: false })

  return (
    <div className="space-y-6">
      <div className="flex gap-6">
        {/* Tab sidebar */}
        <div className="w-52 flex-shrink-0">
          <Card>
            <nav className="p-2 space-y-0.5">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${tab === id ? 'bg-brand-500/15 text-brand-400 font-medium' : 'text-slate-400 hover:bg-slate-700/40 hover:text-white'}`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {tab === 'business' && (
            <Card>
              <CardHeader><h3 className="font-semibold text-white text-sm">Business Profile</h3></CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Business Name', key: 'name' }, { label: 'Industry', key: 'industry' },
                    { label: 'Email', key: 'email' }, { label: 'Phone', key: 'phone' },
                    { label: 'Address', key: 'address' }, { label: 'City', key: 'city' },
                    { label: 'State', key: 'state' }, { label: 'ZIP Code', key: 'zip' },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
                      <input
                        type="text"
                        value={biz[key as keyof typeof biz]}
                        onChange={e => setBiz(b => ({ ...b, [key]: e.target.value }))}
                        className="w-full border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Revenue Goal (Monthly)</label>
                  <input type="number" placeholder="150000" className="w-full border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500" />
                </div>
                <Button icon={<Save size={14} />}>Save Changes</Button>
              </CardBody>
            </Card>
          )}

          {tab === 'notifications' && (
            <Card>
              <CardHeader><h3 className="font-semibold text-white text-sm">Notification Preferences</h3></CardHeader>
              <CardBody>
                <div className="mb-6">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Channels</p>
                  <FieldRow label="Email Notifications" description="Receive alerts via email"><Toggle checked={notifs.email} onChange={v => setNotifs(n => ({ ...n, email: v }))} /></FieldRow>
                  <FieldRow label="SMS Notifications" description="Receive alerts via text message"><Toggle checked={notifs.sms} onChange={v => setNotifs(n => ({ ...n, sms: v }))} /></FieldRow>
                  <FieldRow label="Push Notifications" description="Browser and desktop push alerts"><Toggle checked={notifs.push} onChange={v => setNotifs(n => ({ ...n, push: v }))} /></FieldRow>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Alert Types</p>
                  <FieldRow label="Margin Alerts" description="When an expense reduces margin below threshold"><Toggle checked={notifs.marginAlerts} onChange={v => setNotifs(n => ({ ...n, marginAlerts: v }))} /></FieldRow>
                  <FieldRow label="Low Stock Warnings" description="When inventory falls below reorder point"><Toggle checked={notifs.lowStock} onChange={v => setNotifs(n => ({ ...n, lowStock: v }))} /></FieldRow>
                  <FieldRow label="New Customer" description="When a new customer is added or books"><Toggle checked={notifs.newCustomer} onChange={v => setNotifs(n => ({ ...n, newCustomer: v }))} /></FieldRow>
                  <FieldRow label="Invoice Overdue" description="When an invoice passes its due date"><Toggle checked={notifs.invoiceOverdue} onChange={v => setNotifs(n => ({ ...n, invoiceOverdue: v }))} /></FieldRow>
                  <FieldRow label="Revenue Goal Hit" description="When monthly revenue target is reached"><Toggle checked={notifs.revenueGoal} onChange={v => setNotifs(n => ({ ...n, revenueGoal: v }))} /></FieldRow>
                </div>
                <div className="pt-4"><Button icon={<Save size={14} />}>Save Preferences</Button></div>
              </CardBody>
            </Card>
          )}

          {tab === 'security' && (
            <Card>
              <CardHeader><h3 className="font-semibold text-white text-sm">Security</h3></CardHeader>
              <CardBody className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Change Password</h4>
                  {['Current Password', 'New Password', 'Confirm New Password'].map(l => (
                    <div key={l}>
                      <label className="block text-xs font-medium text-slate-400 mb-1">{l}</label>
                      <input type="password" className="w-full border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500" />
                    </div>
                  ))}
                  <Button icon={<Save size={14} />}>Update Password</Button>
                </div>
                <div className="border-t border-slate-700/60 pt-6">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Two-Factor Authentication</h4>
                  <FieldRow label="Enable 2FA" description="Require a code when logging in"><Toggle checked={false} onChange={() => {}} /></FieldRow>
                </div>
                <div className="border-t border-slate-700/60 pt-6">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">API Keys</h4>
                  <p className="text-sm text-slate-400 mb-3">Generate API keys to connect external services to BizOps.</p>
                  <Button variant="secondary" size="sm">Generate New Key</Button>
                </div>
              </CardBody>
            </Card>
          )}

          {tab === 'appearance' && (
            <Card>
              <CardHeader><h3 className="font-semibold text-white text-sm">Appearance</h3></CardHeader>
              <CardBody className="space-y-6">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Accent Color</p>
                  <div className="flex gap-3">
                    {['#6366f1','#22c55e','#f59e0b','#ec4899','#0ea5e9','#f43f5e'].map(c => (
                      <button
                        key={c}
                        onClick={() => setAppearance(a => ({ ...a, accentColor: c }))}
                        style={{ background: c }}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${appearance.accentColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                      />
                    ))}
                  </div>
                </div>
                <FieldRow label="Compact Mode" description="Reduce spacing for denser information display">
                  <Toggle checked={appearance.compactMode} onChange={v => setAppearance(a => ({ ...a, compactMode: v }))} />
                </FieldRow>
                <Button icon={<Save size={14} />}>Save Appearance</Button>
              </CardBody>
            </Card>
          )}

          {tab === 'team' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white text-sm">Team Members</h3>
                  <Button size="sm">Invite Member</Button>
                </div>
              </CardHeader>
              <div className="divide-y divide-slate-700/60">
                {[
                  { name: 'Justin Crawford', email: 'justin@mybiz.com', role: 'Owner', avatar: 'JC' },
                  { name: 'Sarah Johnson', email: 'sarah@mybiz.com', role: 'Manager', avatar: 'SJ' },
                  { name: 'Marcus Torres', email: 'marcus@mybiz.com', role: 'Staff', avatar: 'MT' },
                ].map(m => (
                  <div key={m.email} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">{m.avatar}</div>
                      <div>
                        <p className="text-sm font-medium text-white">{m.name}</p>
                        <p className="text-xs text-slate-500">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select defaultValue={m.role} className="border border-slate-600 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400/40">
                        <option>Owner</option><option>Manager</option><option>Staff</option><option>Read Only</option>
                      </select>
                      {m.role !== 'Owner' && <Button variant="ghost" size="sm">Remove</Button>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'webhooks' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white text-sm">Webhook Endpoints</h3>
                  <Button size="sm">Add Endpoint</Button>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <p className="text-sm text-slate-400">Configure outbound webhooks to notify external systems when events occur in BizOps.</p>
                {[
                  { url: 'https://hooks.zapier.com/hooks/catch/abc123', events: ['new_customer', 'invoice_paid'], status: 'active' },
                  { url: 'https://api.myapp.com/bizops/events', events: ['low_stock', 'margin_alert'], status: 'active' },
                ].map((wh, i) => (
                  <div key={i} className="flex items-start justify-between p-4 bg-slate-700/40 rounded-xl border border-slate-600">
                    <div>
                      <p className="font-mono text-xs text-slate-300">{wh.url}</p>
                      <div className="flex gap-1 mt-2">
                        {wh.events.map(e => <span key={e} className="bg-slate-800 border border-slate-600 text-xs text-slate-400 px-2 py-0.5 rounded-full">{e}</span>)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-xs text-emerald-600">Active</span>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
