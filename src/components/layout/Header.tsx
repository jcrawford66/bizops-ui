import { useState } from 'react'
import { Bell, MessageSquare, Search, X, CheckCheck } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { format } from 'date-fns'

const ALERT_COLORS: Record<string, string> = {
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  error:   'bg-red-50 border-red-200 text-red-800',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  info:    'bg-blue-50 border-blue-200 text-blue-800',
}
const ALERT_DOT: Record<string, string> = {
  warning: 'bg-amber-400',
  error:   'bg-red-500',
  success: 'bg-emerald-500',
  info:    'bg-blue-500',
}

export default function Header({ title }: { title: string }) {
  const { alerts, unreadCount, markAlertRead, clearAlerts, setChatOpen, chatOpen } = useApp()
  const [alertsOpen, setAlertsOpen] = useState(false)

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="font-semibold text-slate-900 text-lg">{title}</h1>

      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <Search size={18} />
        </button>

        {/* Alerts */}
        <div className="relative">
          <button
            onClick={() => setAlertsOpen(!alertsOpen)}
            className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {alertsOpen && (
            <div className="absolute right-0 top-11 w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="font-semibold text-sm text-slate-900">Notifications</span>
                <div className="flex items-center gap-2">
                  <button onClick={clearAlerts} className="text-xs text-brand-500 hover:underline flex items-center gap-1">
                    <CheckCheck size={13} /> Mark all read
                  </button>
                  <button onClick={() => setAlertsOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {alerts.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">No notifications</p>
                ) : (
                  alerts.map(alert => (
                    <div
                      key={alert.id}
                      onClick={() => markAlertRead(alert.id)}
                      className={`flex gap-3 p-3 mx-2 my-1 rounded-lg border cursor-pointer transition-opacity ${ALERT_COLORS[alert.type]} ${alert.read ? 'opacity-50' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${ALERT_DOT[alert.type]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs">{alert.title}</p>
                        <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{alert.message}</p>
                        <p className="text-[10px] opacity-60 mt-1">{format(alert.timestamp, 'h:mm a')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chat */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className={`p-2 rounded-lg transition-colors ${chatOpen ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
        >
          <MessageSquare size={18} />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold ml-1">
          JD
        </div>
      </div>
    </header>
  )
}
