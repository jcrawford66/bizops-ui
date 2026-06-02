/**
 * BusinessDataContext — single source of truth for all financial data.
 * Revenue, Expenses, Tickets, and connected platform configs all live here
 * so every metric is derived from the same live dataset.
 */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { ExpenseItem } from '../types'

// ─── Revenue entries (monthly) ────────────────────────────────────────────────
export type RevenueEntry = {
  month: string
  revenue: number
  isCurrentMonth?: boolean
}

const INITIAL_REVENUE: RevenueEntry[] = [
  { month: 'Jan', revenue: 98000 },
  { month: 'Feb', revenue: 112000 },
  { month: 'Mar', revenue: 108000 },
  { month: 'Apr', revenue: 125000 },
  { month: 'May', revenue: 131000 },
  { month: 'Jun', revenue: 142500, isCurrentMonth: true },
]

// ─── Expenses ─────────────────────────────────────────────────────────────────
const INITIAL_EXPENSES: ExpenseItem[] = [
  { id: '1', vendor: 'Office Pro Supplies',   category: 'Supplies',  amount: 2400,  date: '2025-06-01', status: 'paid',    invoiceNo: 'INV-1039' },
  { id: '2', vendor: 'Metro Payroll Services', category: 'Payroll',   amount: 48200, date: '2025-06-01', status: 'paid',    invoiceNo: 'PAY-0601' },
  { id: '3', vendor: 'Acme Parts Co.',         category: 'COGS',      amount: 8900,  date: '2025-06-03', status: 'overdue', invoiceNo: 'INV-1042', estimatedMarginImpact: -4.2 },
  { id: '4', vendor: 'CloudStack Inc.',        category: 'Software',  amount: 1200,  date: '2025-06-05', status: 'pending', invoiceNo: 'INV-1043' },
  { id: '5', vendor: 'City Utilities',         category: 'Utilities', amount: 890,   date: '2025-06-06', status: 'paid',    invoiceNo: 'UTIL-0606' },
  { id: '6', vendor: 'Prime Advertising',      category: 'Marketing', amount: 5500,  date: '2025-06-08', status: 'pending', invoiceNo: 'MKT-0608', estimatedMarginImpact: -1.1 },
  { id: '7', vendor: 'BuildRight Contractors', category: 'Facilities',amount: 11000, date: '2025-06-10', status: 'pending', invoiceNo: 'INV-1045' },
]

// ─── Live tickets (from shop software) ───────────────────────────────────────
export type TicketStatus = 'open' | 'in_progress' | 'pending_approval' | 'completed'

export type TicketLineItem = {
  description: string
  qty: number
  unitCost: number   // what it costs you
  unitPrice: number  // what you charge
}

export type LiveTicket = {
  id: string
  ticketNo: string
  customer: string
  technician?: string
  status: TicketStatus
  createdAt: string      // ISO string
  lineItems: TicketLineItem[]
  notes?: string
  source: 'webhook' | 'manual' | 'simulated'
}

function ticketTotals(t: LiveTicket) {
  const revenue = t.lineItems.reduce((s, l) => s + l.qty * l.unitPrice, 0)
  const cost    = t.lineItems.reduce((s, l) => s + l.qty * l.unitCost, 0)
  const profit  = revenue - cost
  const margin  = revenue > 0 ? (profit / revenue) * 100 : 0
  return { revenue, cost, profit, margin }
}

const INITIAL_TICKETS: LiveTicket[] = [
  {
    id: 't1', ticketNo: 'TK-1089', customer: 'Acme Corporation',
    technician: 'Sarah Johnson', status: 'in_progress',
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(), source: 'webhook',
    lineItems: [
      { description: 'Premium Service Package', qty: 1, unitCost: 120, unitPrice: 285 },
      { description: 'Parts & Materials',       qty: 3, unitCost: 45,  unitPrice: 89  },
    ],
  },
  {
    id: 't2', ticketNo: 'TK-1090', customer: 'Blue Ridge Roofing',
    technician: 'Marcus Torres', status: 'open',
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(), source: 'webhook',
    lineItems: [
      { description: 'Hardware Bundle A', qty: 2, unitCost: 195, unitPrice: 349 },
      { description: 'Installation Labor', qty: 4, unitCost: 35,  unitPrice: 95  },
    ],
  },
  {
    id: 't3', ticketNo: 'TK-1091', customer: 'Jamie Okafor',
    technician: 'Tom Whitfield', status: 'pending_approval',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(), source: 'webhook',
    lineItems: [
      { description: 'Diagnostic Fee',   qty: 1, unitCost: 15,  unitPrice: 65  },
      { description: 'Replacement Parts',qty: 1, unitCost: 280, unitPrice: 310 },
    ],
  },
]

// ─── Revenue drivers (live, editable) ─────────────────────────────────────────
export type RevenueDriver = {
  id: string
  name: string
  revenue: number
  cost: number
  change: number   // % change vs last month
}

const INITIAL_DRIVERS: RevenueDriver[] = [
  { id: 'd1', name: 'Premium Service Package', revenue: 38400, cost: 16000, change: 12 },
  { id: 'd2', name: 'Enterprise Consulting',   revenue: 24000, cost: 7000,  change: 8  },
  { id: 'd3', name: 'Widget Pro Sales',         revenue: 18800, cost: 12400, change: -3 },
  { id: 'd4', name: 'Monthly Retainer — Acme', revenue: 12000, cost: 2400,  change: 0  },
  { id: 'd5', name: 'Hardware Bundle',          revenue: 9300,  cost: 7600,  change: -7 },
]

// ─── Connected platforms ──────────────────────────────────────────────────────
export type ConnectedPlatform = {
  id: string
  name: string
  type: 'revenue' | 'accounting' | 'both'
  connectedAt: string
  webhookUrl?: string
}

// ─── Derived metrics ──────────────────────────────────────────────────────────
export function deriveMetrics(revenue: number, expenses: ExpenseItem[], tickets: LiveTicket[]) {
  const cogs = expenses
    .filter(e => ['COGS', 'Supplies'].includes(e.category))
    .reduce((s, e) => s + e.amount, 0)
  const totalExpenses  = expenses.reduce((s, e) => s + e.amount, 0)
  const grossProfit    = revenue - cogs
  const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0
  const netProfit      = revenue - totalExpenses
  const netMarginPct   = revenue > 0 ? (netProfit / revenue) * 100 : 0

  // Minimum margin a ticket must achieve to cover all monthly overhead
  // = totalExpenses / revenue — below this and the shop is losing money
  const minRequiredMarginPct = revenue > 0 ? (totalExpenses / revenue) * 100 : 0

  const overdueAmount  = expenses.filter(e => e.status === 'overdue').reduce((s, e) => s + e.amount, 0)
  const marginAlerts   = expenses.filter(e => (e.estimatedMarginImpact ?? 0) < -2)

  // Open ticket totals
  const openTicketRevenue = tickets
    .filter(t => t.status !== 'completed')
    .reduce((s, t) => s + ticketTotals(t).revenue, 0)

  return {
    revenue, cogs, totalExpenses, grossProfit, grossMarginPct,
    netProfit, netMarginPct, minRequiredMarginPct,
    overdueAmount, marginAlerts, openTicketRevenue,
  }
}

// ─── Context type ─────────────────────────────────────────────────────────────
type BusinessDataContextType = {
  expenses: ExpenseItem[]
  addExpense: (e: Omit<ExpenseItem, 'id'>) => void
  updateExpense: (id: string, patch: Partial<ExpenseItem>) => void
  deleteExpense: (id: string) => void

  revenueHistory: RevenueEntry[]
  currentMonthRevenue: number
  setCurrentMonthRevenue: (v: number) => void

  tickets: LiveTicket[]
  addTicket: (t: Omit<LiveTicket, 'id' | 'createdAt'>) => void
  updateTicket: (id: string, patch: Partial<LiveTicket>) => void
  deleteTicket: (id: string) => void
  ticketTotals: typeof ticketTotals

  drivers: RevenueDriver[]
  addDriver: (d: Omit<RevenueDriver, 'id'>) => void
  updateDriver: (id: string, patch: Partial<RevenueDriver>) => void
  deleteDriver: (id: string) => void

  connectedPlatforms: ConnectedPlatform[]
  addConnectedPlatform: (p: Omit<ConnectedPlatform, 'id' | 'connectedAt'>) => void
  removeConnectedPlatform: (id: string) => void

  metrics: ReturnType<typeof deriveMetrics>

  // Webhook simulation — pushes a fake incoming ticket as if from shop software
  simulateIncomingTicket: () => void
  lastWebhookEvent: string | null
}

const BusinessDataContext = createContext<BusinessDataContextType | null>(null)

const SIMULATED_CUSTOMERS = ['Riverdale Bakery','Sandra Wei','TechStart LLC','Michael Torres','Green Valley Farms']
const SIMULATED_SERVICES = [
  { description: 'Express Service', unitCost: 40, unitPrice: 120 },
  { description: 'Full Inspection',  unitCost: 25, unitPrice: 95  },
  { description: 'Parts Replacement',unitCost: 85, unitPrice: 175 },
  { description: 'Consulting Hour',  unitCost: 20, unitPrice: 150 },
  { description: 'Hardware Install', unitCost: 195, unitPrice: 310},
]

export function BusinessDataProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses]   = useState<ExpenseItem[]>(INITIAL_EXPENSES)
  const [revenueHistory, setRevenueHistory] = useState<RevenueEntry[]>(INITIAL_REVENUE)
  const [tickets, setTickets]     = useState<LiveTicket[]>(INITIAL_TICKETS)
  const [drivers, setDrivers]     = useState<RevenueDriver[]>(INITIAL_DRIVERS)
  const [connectedPlatforms, setConnectedPlatforms] = useState<ConnectedPlatform[]>([])
  const [lastWebhookEvent, setLastWebhookEvent] = useState<string | null>(null)
  const [ticketCounter, setTicketCounter] = useState(1092)

  const currentMonthRevenue = revenueHistory.find(r => r.isCurrentMonth)?.revenue ?? 0

  const setCurrentMonthRevenue = useCallback((v: number) => {
    setRevenueHistory(prev => prev.map(r => r.isCurrentMonth ? { ...r, revenue: v } : r))
  }, [])

  // Expenses
  const addExpense    = useCallback((e: Omit<ExpenseItem, 'id'>) => setExpenses(prev => [...prev, { ...e, id: Date.now().toString() }]), [])
  const updateExpense = useCallback((id: string, patch: Partial<ExpenseItem>) => setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e)), [])
  const deleteExpense = useCallback((id: string) => setExpenses(prev => prev.filter(e => e.id !== id)), [])

  // Tickets
  const addTicket    = useCallback((t: Omit<LiveTicket, 'id' | 'createdAt'>) => setTickets(prev => [...prev, { ...t, id: Date.now().toString(), createdAt: new Date().toISOString() }]), [])
  const updateTicket = useCallback((id: string, patch: Partial<LiveTicket>) => setTickets(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t)), [])
  const deleteTicket = useCallback((id: string) => setTickets(prev => prev.filter(t => t.id !== id)), [])

  // Revenue drivers
  const addDriver    = useCallback((d: Omit<RevenueDriver, 'id'>) => setDrivers(prev => [...prev, { ...d, id: Date.now().toString() }]), [])
  const updateDriver = useCallback((id: string, patch: Partial<RevenueDriver>) => setDrivers(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d)), [])
  const deleteDriver = useCallback((id: string) => setDrivers(prev => prev.filter(d => d.id !== id)), [])

  // Connected platforms
  const addConnectedPlatform = useCallback((p: Omit<ConnectedPlatform, 'id' | 'connectedAt'>) => {
    setConnectedPlatforms(prev => [...prev, { ...p, id: Date.now().toString(), connectedAt: new Date().toISOString() }])
  }, [])
  const removeConnectedPlatform = useCallback((id: string) => setConnectedPlatforms(prev => prev.filter(p => p.id !== id)), [])

  // Simulate an incoming webhook ticket (demo)
  const simulateIncomingTicket = useCallback(() => {
    const customer = SIMULATED_CUSTOMERS[Math.floor(Math.random() * SIMULATED_CUSTOMERS.length)]
    const svc = SIMULATED_SERVICES[Math.floor(Math.random() * SIMULATED_SERVICES.length)]
    const qty = Math.floor(Math.random() * 3) + 1
    const no = ticketCounter
    setTicketCounter(n => n + 1)
    const newTicket: LiveTicket = {
      id: `sim-${Date.now()}`,
      ticketNo: `TK-${no}`,
      customer,
      status: 'open',
      createdAt: new Date().toISOString(),
      source: 'simulated',
      lineItems: [{ ...svc, qty }],
    }
    setTickets(prev => [newTicket, ...prev])
    setLastWebhookEvent(`Incoming ticket ${newTicket.ticketNo} from ${customer} — ${new Date().toLocaleTimeString()}`)
  }, [ticketCounter])

  // Auto-clear webhook event toast after 4s
  useEffect(() => {
    if (!lastWebhookEvent) return
    const t = setTimeout(() => setLastWebhookEvent(null), 4000)
    return () => clearTimeout(t)
  }, [lastWebhookEvent])

  const metrics = deriveMetrics(currentMonthRevenue, expenses, tickets)

  return (
    <BusinessDataContext.Provider value={{
      expenses, addExpense, updateExpense, deleteExpense,
      revenueHistory, currentMonthRevenue, setCurrentMonthRevenue,
      tickets, addTicket, updateTicket, deleteTicket, ticketTotals,
      drivers, addDriver, updateDriver, deleteDriver,
      connectedPlatforms, addConnectedPlatform, removeConnectedPlatform,
      metrics, simulateIncomingTicket, lastWebhookEvent,
    }}>
      {children}
    </BusinessDataContext.Provider>
  )
}

export function useBusinessData() {
  const ctx = useContext(BusinessDataContext)
  if (!ctx) throw new Error('useBusinessData must be used within BusinessDataProvider')
  return ctx
}
