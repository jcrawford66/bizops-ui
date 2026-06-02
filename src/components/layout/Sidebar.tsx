import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, Receipt, Users2, Share2,
  Package, Users, CalendarDays, Plug, Settings, ChevronLeft,
  ChevronRight, Zap,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'

const NAV = [
  { label: 'Dashboard',   path: '/',            icon: LayoutDashboard },
  { label: 'Revenue',     path: '/revenue',     icon: TrendingUp },
  { label: 'Expenses',    path: '/expenses',    icon: Receipt },
  { label: 'Employees',   path: '/employees',   icon: Users2 },
  { label: 'Social Media',path: '/social',      icon: Share2 },
  { label: 'Inventory',   path: '/inventory',   icon: Package },
  { label: 'Customers',   path: '/customers',   icon: Users },
  { label: 'Calendar',    path: '/calendar',    icon: CalendarDays },
  { label: 'Integrations',path: '/integrations',icon: Plug },
  { label: 'Settings',    path: '/settings',    icon: Settings },
]

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useApp()

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-slate-900 flex flex-col transition-all duration-300 z-40 ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-700/60 ${sidebarCollapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        {!sidebarCollapsed && (
          <span className="font-bold text-white text-sm tracking-wide">BizOps</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
        {NAV.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors group ${
                isActive
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              } ${sidebarCollapsed ? 'justify-center' : ''}`
            }
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="flex items-center justify-center p-3 border-t border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  )
}
