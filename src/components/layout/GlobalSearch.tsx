import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Users, Package, Receipt, TrendingUp, Users2, ArrowRight } from 'lucide-react'
import { useBusinessData, type LiveTicket } from '../../context/BusinessDataContext'
import type { ExpenseItem, InventoryItem } from '../../types'

// ── Static customers (mirrors Customers page) ────────────────────────────────
const CUSTOMERS = [
  { id: 'c1', name: 'Acme Corporation',  email: 'billing@acmecorp.com',   status: 'active' },
  { id: 'c2', name: 'Michael Torres',    email: 'mtorres@email.com',       status: 'active' },
  { id: 'c3', name: 'Riverdale Bakery',  email: 'hello@riverdalebakery.com',status: 'new'   },
  { id: 'c4', name: 'Sandra Wei',        email: 'sandra.wei@gmail.com',    status: 'inactive'},
  { id: 'c5', name: 'Blue Ridge Roofing',email: 'ops@blueridgeroofing.com',status: 'active' },
  { id: 'c6', name: 'Jamie Okafor',      email: 'jamie.o@email.com',       status: 'active' },
  { id: 'c7', name: 'TechStart LLC',     email: 'ops@techstart.io',        status: 'inactive'},
]

const EMPLOYEES = [
  { id: 'e1', name: 'Sarah Johnson',  role: 'Senior Technician' },
  { id: 'e2', name: 'Marcus Torres',  role: 'Account Manager'   },
  { id: 'e3', name: 'Priya Kapoor',   role: 'Operations Lead'   },
  { id: 'e4', name: 'Tom Whitfield',  role: 'Technician'        },
  { id: 'e5', name: 'Lisa Martinez',  role: 'Customer Success'  },
  { id: 'e6', name: 'Derek Okafor',   role: 'Apprentice Tech'   },
]

type ResultItem = {
  id: string
  section: string
  icon: typeof Users
  label: string
  sublabel: string
  path: string
  badge?: string
  badgeColor?: string
}

function buildResults(query: string, expenses: ExpenseItem[], inventory: InventoryItem[], tickets: LiveTicket[]): ResultItem[] {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  const results: ResultItem[] = []

  // Customers
  CUSTOMERS.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)).forEach(c =>
    results.push({ id: `c-${c.id}`, section: 'Customers', icon: Users, label: c.name, sublabel: c.email, path: '/customers', badge: c.status, badgeColor: c.status === 'active' ? 'text-emerald-400' : c.status === 'new' ? 'text-sky-400' : 'text-amber-400' })
  )

  // Expenses
  expenses.filter(e => e.vendor.toLowerCase().includes(q) || (e.invoiceNo ?? '').toLowerCase().includes(q) || e.category.toLowerCase().includes(q)).forEach(e =>
    results.push({ id: `exp-${e.id}`, section: 'Expenses', icon: Receipt, label: e.vendor, sublabel: `${e.invoiceNo ?? e.category} · $${e.amount.toLocaleString()}`, path: '/expenses', badge: e.status, badgeColor: e.status === 'paid' ? 'text-emerald-400' : e.status === 'overdue' ? 'text-red-400' : 'text-amber-400' })
  )

  // Inventory
  inventory.filter(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)).forEach(i =>
    results.push({ id: `inv-${i.id}`, section: 'Inventory', icon: Package, label: i.name, sublabel: `${i.sku} · ${i.category} · Qty: ${i.quantity}`, path: '/inventory', badge: i.quantity === 0 ? 'Out of Stock' : i.quantity <= i.reorderPoint ? 'Low Stock' : undefined, badgeColor: i.quantity === 0 ? 'text-red-400' : 'text-amber-400' })
  )

  // Live tickets
  tickets.filter(t => t.customer.toLowerCase().includes(q) || t.ticketNo.toLowerCase().includes(q) || (t.technician ?? '').toLowerCase().includes(q)).forEach(t =>
    results.push({ id: `tk-${t.id}`, section: 'Tickets', icon: TrendingUp, label: `${t.ticketNo} — ${t.customer}`, sublabel: t.technician ? `Assigned to ${t.technician}` : 'Unassigned', path: '/revenue', badge: t.status.replace('_', ' '), badgeColor: t.status === 'completed' ? 'text-emerald-400' : t.status === 'in_progress' ? 'text-amber-400' : 'text-sky-400' })
  )

  // Employees
  EMPLOYEES.filter(e => e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q)).forEach(e =>
    results.push({ id: `emp-${e.id}`, section: 'Employees', icon: Users2, label: e.name, sublabel: e.role, path: '/employees' })
  )

  return results.slice(0, 20)
}

type Props = {
  open: boolean
  onClose: () => void
}

export default function GlobalSearch({ open, onClose }: Props) {
  const navigate = useNavigate()
  const { expenses, tickets } = useBusinessData()

  type SimpleInvItem = Pick<InventoryItem, 'id' | 'name' | 'sku' | 'category' | 'quantity' | 'reorderPoint'>

  // Inventory isn't in shared context yet — mirror the initial list
  const inventory: SimpleInvItem[] = [
    { id: '1', name: 'Widget Pro',            sku: 'WP-001', category: 'Parts & Components', quantity: 3,  reorderPoint: 20 },
    { id: '2', name: 'Office Supplies Bundle', sku: 'OS-012', category: 'Office Supplies',    quantity: 8,  reorderPoint: 25 },
    { id: '3', name: 'Service Kit Standard',   sku: 'SK-004', category: 'Service Kits',       quantity: 44, reorderPoint: 10 },
    { id: '4', name: 'Hardware Bundle A',      sku: 'HB-009', category: 'Hardware',           quantity: 17, reorderPoint: 15 },
    { id: '5', name: 'Cleaning Supplies',      sku: 'CS-003', category: 'Maintenance',        quantity: 2,  reorderPoint: 12 },
    { id: '6', name: 'Premium Service Kit',    sku: 'SK-007', category: 'Service Kits',       quantity: 31, reorderPoint: 8  },
    { id: '7', name: 'Safety Equipment Set',   sku: 'SE-002', category: 'Safety & PPE',       quantity: 12, reorderPoint: 5  },
    { id: '8', name: 'Promotional Materials',  sku: 'PM-015', category: 'Marketing Materials',quantity: 0,  reorderPoint: 50 },
  ]

  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = buildResults(query, expenses, inventory as InventoryItem[], tickets)

  // Group by section
  const sections = results.reduce<Record<string, ResultItem[]>>((acc, r) => {
    acc[r.section] = [...(acc[r.section] ?? []), r]
    return acc
  }, {})

  // Flatten for keyboard nav index
  const flat = Object.values(sections).flat()

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const go = useCallback((item: ResultItem) => {
    navigate(item.path)
    onClose()
    setQuery('')
  }, [navigate, onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, flat.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
      if (e.key === 'Enter' && flat[selected]) go(flat[selected])
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, flat, selected, go, onClose])

  // Reset selection when query changes
  useEffect(() => { setSelected(0) }, [query])

  if (!open) return null

  const SECTION_ICONS: Record<string, typeof Users> = {
    Customers: Users,
    Expenses:  Receipt,
    Inventory: Package,
    Tickets:   TrendingUp,
    Employees: Users2,
  }

  let flatIndex = 0

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
          <Search size={18} className="text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search customers, expenses, inventory, tickets, employees…"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded border border-slate-600">esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
          {!query && (
            <div className="px-4 py-8 text-center">
              <Search size={28} className="text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Start typing to search across your business</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {['Acme', 'Widget Pro', 'Sarah Johnson', 'TK-108', 'overdue'].map(hint => (
                  <button
                    key={hint}
                    onClick={() => setQuery(hint)}
                    className="text-xs bg-slate-700 hover:bg-sky-500/20 hover:text-sky-300 text-slate-400 px-3 py-1 rounded-full transition-colors"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-slate-500">No results for <span className="text-slate-300 font-medium">"{query}"</span></p>
            </div>
          )}

          {query && results.length > 0 && Object.entries(sections).map(([sectionName, items]) => {
            const SectionIcon = SECTION_ICONS[sectionName] ?? Search
            return (
              <div key={sectionName}>
                {/* Section header */}
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border-b border-slate-700/50">
                  <SectionIcon size={12} className="text-slate-500" />
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{sectionName}</span>
                  <span className="text-[10px] text-slate-600">{items.length}</span>
                </div>

                {items.map(item => {
                  const idx = flatIndex++
                  const isSelected = idx === selected
                  return (
                    <button
                      key={item.id}
                      onClick={() => go(item)}
                      onMouseEnter={() => setSelected(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-slate-700/30 last:border-0 ${isSelected ? 'bg-sky-500/10' : 'hover:bg-slate-700/40'}`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-sky-500/20' : 'bg-slate-700'}`}>
                        <item.icon size={13} className={isSelected ? 'text-sky-400' : 'text-slate-400'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {/* Highlight matching text */}
                          {highlightMatch(item.label, query)}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{item.sublabel}</p>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] font-medium capitalize flex-shrink-0 ${item.badgeColor ?? 'text-slate-400'}`}>
                          {item.badge}
                        </span>
                      )}
                      {isSelected && <ArrowRight size={13} className="text-sky-400 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-700 bg-slate-900/50">
            <span className="text-[10px] text-slate-600 flex items-center gap-1.5">
              <kbd className="bg-slate-700 border border-slate-600 px-1 rounded text-[9px]">↑↓</kbd> navigate
            </span>
            <span className="text-[10px] text-slate-600 flex items-center gap-1.5">
              <kbd className="bg-slate-700 border border-slate-600 px-1 rounded text-[9px]">↵</kbd> go to section
            </span>
            <span className="text-[10px] text-slate-600 flex items-center gap-1.5">
              <kbd className="bg-slate-700 border border-slate-600 px-1 rounded text-[9px]">esc</kbd> close
            </span>
            <span className="text-[10px] text-slate-500 ml-auto">{results.length} result{results.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Bolden the matched portion of a label
function highlightMatch(text: string, query: string): React.ReactNode {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-sky-500/30 text-sky-200 rounded-sm px-0.5 not-italic font-semibold">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}
