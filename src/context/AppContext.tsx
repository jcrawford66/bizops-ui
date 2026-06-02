import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Alert, ChatMessage } from '../types'

type AppContextType = {
  alerts: Alert[]
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => void
  markAlertRead: (id: string) => void
  clearAlerts: () => void
  unreadCount: number
  chatOpen: boolean
  setChatOpen: (open: boolean) => void
  chatMessages: ChatMessage[]
  sendChatMessage: (content: string) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  // Appearance
  accentColor: string
  setAccentColor: (hex: string) => void
  compactMode: boolean
  setCompactMode: (v: boolean) => void
}

const AppContext = createContext<AppContextType | null>(null)

const MOCK_RESPONSES: Record<string, string> = {
  default: "I'm analyzing your business data. Could you be more specific? For example, ask about a customer, revenue, or inventory.",
  john: "John Doe last visited on June 3, 2025. He's had 12 total visits and spent $4,280 lifetime. His next scheduled appointment is June 15, 2025.",
  revenue: "Your revenue this month is $142,500 — up 8.3% vs last month. Your best-performing category is Services at $89k, followed by Products at $53k.",
  expense: "Your top expense this month is Payroll at $48,200, followed by Supplies at $12,400. You have 3 invoices totaling $8,900 that are overdue.",
  inventory: "You have 14 items below reorder point. Your fastest-moving item this week is Widget Pro (sold 47 units). I'd recommend reordering Office Supplies — stock is critically low.",
  employee: "Your top performer this week is Sarah Johnson with 94% efficiency and $32,400 in attributed revenue. Average team efficiency is 81%.",
  customer: "You have 342 active customers. 28 are flagged as 'at-risk' (no visit in 90+ days). Your highest-value customer this month is Acme Corp at $12,800.",
  appointment: "You have 6 appointments tomorrow. First is at 9:00 AM with Michael Torres. Your schedule is fully booked from 10 AM–2 PM.",
  margin: "Current gross margin is 42.3%. Your lowest-margin product line is Hardware at 18%. I'd recommend reviewing your pricing on SKU-0041 through SKU-0055.",
}

function getMockResponse(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('john') || lower.includes('doe')) return MOCK_RESPONSES.john
  if (lower.includes('revenue') || lower.includes('sales')) return MOCK_RESPONSES.revenue
  if (lower.includes('expense') || lower.includes('invoice') || lower.includes('bill')) return MOCK_RESPONSES.expense
  if (lower.includes('inventory') || lower.includes('stock')) return MOCK_RESPONSES.inventory
  if (lower.includes('employee') || lower.includes('staff') || lower.includes('team')) return MOCK_RESPONSES.employee
  if (lower.includes('customer') || lower.includes('client')) return MOCK_RESPONSES.customer
  if (lower.includes('appointment') || lower.includes('calendar') || lower.includes('schedule')) return MOCK_RESPONSES.appointment
  if (lower.includes('margin') || lower.includes('profit')) return MOCK_RESPONSES.margin
  return MOCK_RESPONSES.default
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: '1', type: 'warning', title: 'Low Margin Alert', message: 'Invoice #1042 drops project margin below 20%', timestamp: new Date(), read: false, section: 'expenses' },
    { id: '2', type: 'error', title: 'Low Stock', message: 'Widget Pro has 3 units remaining (reorder point: 20)', timestamp: new Date(), read: false, section: 'inventory' },
    { id: '3', type: 'info', title: 'New Customer', message: 'Riverdale Bakery just booked their first appointment', timestamp: new Date(), read: false, section: 'customers' },
    { id: '4', type: 'success', title: 'Goal Reached', message: 'Monthly revenue target hit — 103% of goal', timestamp: new Date(), read: true, section: 'revenue' },
  ])
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: "Hi! I'm your BizOps AI assistant. Ask me anything about your business — customers, revenue, inventory, employees, and more.", timestamp: new Date() }
  ])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [accentColor, setAccentColor] = useState('#0ea5e9')   // sky-500 default
  const [compactMode, setCompactMode] = useState(false)

  const addAlert = useCallback((alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => {
    setAlerts(prev => [{
      ...alert,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    }, ...prev])
  }, [])

  const markAlertRead = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
  }, [])

  const clearAlerts = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
  }, [])

  const sendChatMessage = useCallback((content: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() }
    setChatMessages(prev => [...prev, userMsg])
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getMockResponse(content),
        timestamp: new Date(),
      }
      setChatMessages(prev => [...prev, assistantMsg])
    }, 800)
  }, [])

  const unreadCount = alerts.filter(a => !a.read).length

  return (
    <AppContext.Provider value={{
      alerts, addAlert, markAlertRead, clearAlerts, unreadCount,
      chatOpen, setChatOpen, chatMessages, sendChatMessage,
      sidebarCollapsed, setSidebarCollapsed,
      accentColor, setAccentColor, compactMode, setCompactMode,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
