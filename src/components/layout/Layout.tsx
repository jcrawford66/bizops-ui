import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import ChatBot from './ChatBot'
import { useApp } from '../../context/AppContext'

const PAGE_TITLES: Record<string, string> = {
  '/':            'Dashboard',
  '/revenue':     'Revenue & Margins',
  '/expenses':    'Expenses',
  '/employees':   'Employee Efficiency',
  '/social':      'Social Media',
  '/inventory':   'Inventory',
  '/customers':   'Customers',
  '/calendar':    'Calendar',
  '/integrations':'Integrations',
  '/settings':    'Settings',
}

/** Convert #rrggbb → "r g b" for CSS rgb() / rgba() usage */
function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `${r} ${g} ${b}`
}

/** Multiply each channel by a ratio to produce a darker shade */
function darken(hex: string, ratio = 0.82): string {
  const h = hex.replace('#', '')
  const r = Math.round(parseInt(h.slice(0, 2), 16) * ratio)
  const g = Math.round(parseInt(h.slice(2, 4), 16) * ratio)
  const b = Math.round(parseInt(h.slice(4, 6), 16) * ratio)
  return `${r} ${g} ${b}`
}

export default function Layout() {
  const { sidebarCollapsed, accentColor, compactMode } = useApp()
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] ?? 'BizOps'

  // Apply accent color as CSS custom properties on :root whenever it changes
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--bz-accent',      hexToRgb(accentColor))
    root.style.setProperty('--bz-accent-dark',  darken(accentColor))
    root.style.setProperty('--bz-accent-hex',   accentColor)
  }, [accentColor])

  // Apply compact-mode class on body
  useEffect(() => {
    document.body.classList.toggle('compact-mode', compactMode)
  }, [compactMode])

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#0d1b2a' }}>
      <Sidebar />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-60'}`}>
        <Header title={title} />
        <main className={`flex-1 overflow-y-auto scrollbar-thin ${compactMode ? 'p-3' : 'p-6'}`}>
          <Outlet />
        </main>
      </div>
      <ChatBot />
    </div>
  )
}
