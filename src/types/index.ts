export type NavItem = {
  label: string
  path: string
  icon: string
}

export type Alert = {
  id: string
  type: 'warning' | 'error' | 'success' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
  section?: string
}

export type Integration = {
  id: string
  name: string
  category: string
  connected: boolean
  icon: string
  description: string
  webhookUrl?: string
  apiKey?: string
  lastSync?: Date
}

export type RevenueDataPoint = {
  month: string
  revenue: number
  cost: number
  margin: number
}

export type ExpenseItem = {
  id: string
  vendor: string
  category: string
  amount: number
  date: string
  status: 'paid' | 'pending' | 'overdue'
  invoiceNo?: string
  estimatedMarginImpact?: number
}

export type Employee = {
  id: string
  name: string
  role: string
  efficiency: number
  tasksCompleted: number
  hoursLogged: number
  revenue: number
  avatar?: string
}

export type Customer = {
  id: string
  name: string
  email: string
  phone?: string
  lastVisit?: string
  totalSpend: number
  visits: number
  status: 'active' | 'inactive' | 'new'
  tags: string[]
}

export type InventoryItem = {
  id: string
  name: string
  sku: string
  category: string
  quantity: number
  reorderPoint: number
  cost: number
  price: number
  supplier?: string
  lastUpdated: string
}

export type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  type: 'appointment' | 'meeting' | 'task' | 'reminder'
  customer?: string
  employee?: string
  notes?: string
  color?: string
}

export type SocialPost = {
  id: string
  platform: 'facebook' | 'instagram' | 'tiktok' | 'linkedin'
  content: string
  imageUrl?: string
  scheduledAt?: string
  publishedAt?: string
  status: 'draft' | 'scheduled' | 'published'
  likes?: number
  comments?: number
  shares?: number
  reach?: number
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}
