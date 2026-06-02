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

export default function Layout() {
  const { sidebarCollapsed } = useApp()
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] ?? 'BizOps'

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#0d1b2a' }}>
      <Sidebar />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-60'}`}>
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <Outlet />
        </main>
      </div>
      <ChatBot />
    </div>
  )
}
