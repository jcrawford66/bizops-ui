/**
 * BusinessDataContext — single source of truth for financial data.
 *
 * Both Revenue and Expenses pages read from and write to this context so
 * every metric (gross profit, gross margin, cost breakdown) is always
 * derived from the same live dataset.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { ExpenseItem } from '../types'

// ─── Revenue entries (month-level) ──────────────────────────────────────────
export type RevenueEntry = {
  month: string         // e.g. "Jun"
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

// ─── Expenses ────────────────────────────────────────────────────────────────
const INITIAL_EXPENSES: ExpenseItem[] = [
  { id: '1', vendor: 'Office Pro Supplies',   category: 'Supplies',  amount: 2400,  date: '2025-06-01', status: 'paid',    invoiceNo: 'INV-1039' },
  { id: '2', vendor: 'Metro Payroll Services', category: 'Payroll',   amount: 48200, date: '2025-06-01', status: 'paid',    invoiceNo: 'PAY-0601' },
  { id: '3', vendor: 'Acme Parts Co.',         category: 'COGS',      amount: 8900,  date: '2025-06-03', status: 'overdue', invoiceNo: 'INV-1042', estimatedMarginImpact: -4.2 },
  { id: '4', vendor: 'CloudStack Inc.',        category: 'Software',  amount: 1200,  date: '2025-06-05', status: 'pending', invoiceNo: 'INV-1043' },
  { id: '5', vendor: 'City Utilities',         category: 'Utilities', amount: 890,   date: '2025-06-06', status: 'paid',    invoiceNo: 'UTIL-0606' },
  { id: '6', vendor: 'Prime Advertising',      category: 'Marketing', amount: 5500,  date: '2025-06-08', status: 'pending', invoiceNo: 'MKT-0608', estimatedMarginImpact: -1.1 },
  { id: '7', vendor: 'BuildRight Contractors', category: 'Facilities',amount: 11000, date: '2025-06-10', status: 'pending', invoiceNo: 'INV-1045' },
]

// ─── Connected platforms ─────────────────────────────────────────────────────
export type ConnectedPlatform = {
  id: string
  name: string           // "QuickBooks", "Square", or user-entered custom name
  type: 'revenue' | 'accounting' | 'both'
  connectedAt: string    // ISO date string
}

// ─── Derived helpers ──────────────────────────────────────────────────────────
export function deriveMetrics(revenue: number, expenses: ExpenseItem[]) {
  // Only count COGS for gross margin calc (direct cost of goods/services)
  const cogs = expenses
    .filter(e => ['COGS', 'Supplies'].includes(e.category))
    .reduce((s, e) => s + e.amount, 0)

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const grossProfit = revenue - cogs
  const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0
  const netProfit = revenue - totalExpenses
  const netMarginPct = revenue > 0 ? (netProfit / revenue) * 100 : 0

  const overdueAmount = expenses
    .filter(e => e.status === 'overdue')
    .reduce((s, e) => s + e.amount, 0)

  const marginAlerts = expenses.filter(
    e => e.estimatedMarginImpact !== undefined && e.estimatedMarginImpact < -2
  )

  return {
    revenue,
    cogs,
    totalExpenses,
    grossProfit,
    grossMarginPct,
    netProfit,
    netMarginPct,
    overdueAmount,
    marginAlerts,
  }
}

// ─── Context type ─────────────────────────────────────────────────────────────
type BusinessDataContextType = {
  // Expenses
  expenses: ExpenseItem[]
  addExpense: (e: Omit<ExpenseItem, 'id'>) => void
  updateExpense: (id: string, patch: Partial<ExpenseItem>) => void
  deleteExpense: (id: string) => void

  // Revenue entries
  revenueHistory: RevenueEntry[]
  currentMonthRevenue: number
  setCurrentMonthRevenue: (v: number) => void

  // Live derived metrics (current month)
  metrics: ReturnType<typeof deriveMetrics>

  // Connected platforms
  connectedPlatforms: ConnectedPlatform[]
  addConnectedPlatform: (p: Omit<ConnectedPlatform, 'id' | 'connectedAt'>) => void
  removeConnectedPlatform: (id: string) => void
}

const BusinessDataContext = createContext<BusinessDataContextType | null>(null)

export function BusinessDataProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES)
  const [revenueHistory, setRevenueHistory] = useState<RevenueEntry[]>(INITIAL_REVENUE)
  const [connectedPlatforms, setConnectedPlatforms] = useState<ConnectedPlatform[]>([])

  const currentMonthRevenue = revenueHistory.find(r => r.isCurrentMonth)?.revenue ?? 0

  const setCurrentMonthRevenue = useCallback((v: number) => {
    setRevenueHistory(prev => prev.map(r => r.isCurrentMonth ? { ...r, revenue: v } : r))
  }, [])

  const addExpense = useCallback((e: Omit<ExpenseItem, 'id'>) => {
    setExpenses(prev => [...prev, { ...e, id: Date.now().toString() }])
  }, [])

  const updateExpense = useCallback((id: string, patch: Partial<ExpenseItem>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e))
  }, [])

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }, [])

  const addConnectedPlatform = useCallback((p: Omit<ConnectedPlatform, 'id' | 'connectedAt'>) => {
    setConnectedPlatforms(prev => [...prev, {
      ...p,
      id: Date.now().toString(),
      connectedAt: new Date().toISOString(),
    }])
  }, [])

  const removeConnectedPlatform = useCallback((id: string) => {
    setConnectedPlatforms(prev => prev.filter(p => p.id !== id))
  }, [])

  const metrics = deriveMetrics(currentMonthRevenue, expenses)

  return (
    <BusinessDataContext.Provider value={{
      expenses, addExpense, updateExpense, deleteExpense,
      revenueHistory, currentMonthRevenue, setCurrentMonthRevenue,
      metrics,
      connectedPlatforms, addConnectedPlatform, removeConnectedPlatform,
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
