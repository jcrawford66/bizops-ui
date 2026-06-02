import { useState } from 'react'
import { Bell, MessageSquare, Search, X, CheckCheck } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { format } from 'date-fns'

const ALERT_COLORS: Record<string, string> = {
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  error:   'bg-red-500/10 border-red-500/30 text-red-300',
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  info:    'bg-blue-500/10 border-blue-500/30 text-blue-300',
}
const ALERT_DOT: Record<string, string> = {
  warning: 'bg-amber-400',
  error:   'bg-red-400',
  success: 'bg-emerald-400',
  info:    'bg-blue-400',
}

export default function Header({ title }: { title: string }) {
  const { alerts, unreadCount, markAlertRead, clearAlerts, setChatOpen, chatOpen } = useApp()
  const [alertsOpen, setAlertsOpen] = useState(false)

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="font-semibold text-white text-lg">{title}</h1>

      <div className="flex items-center gap-2">
        <button className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
          <Search size={18} />
        </button>

        {/* Alerts */}
        <div className="relative">
          <button
            onClick={() => setAlertsOpen(!alertsOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {alertsOpen && (
            <div className="absolute right-0 top-11 w-96 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                <span className="font-semibold text-sm text-white">Notifications</span>
                <div className="flex items-center gap-2">
                  <button onClick={clearAlerts} className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1">
                    <CheckCheck size={13} /> Mark all read
                  </button>
                  <button onClick={() => setAlertsOpen(false)} className="text-slate-500 hover:text-slate-300">
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
                      className={`flex gap-3 p-3 mx-2 my-1 rounded-lg border cursor-pointer transition-opacity ${ALERT_COLORS[alert.type]} ${alert.read ? 'opacity-40' : ''}`}
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
          className={`p-2 rounded-lg transition-colors ${chatOpen ? 'bg-sky-500 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
        >
          <MessageSquare size={18} />
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-xs font-bold ml-1">
          JD
        </div>
      </div>
    </header>
  )
}
