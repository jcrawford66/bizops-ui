import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

type Props = {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  prefix?: string
  alert?: boolean
}

export default function StatCard({ title, value, change, changeLabel, icon: Icon, iconColor = 'text-brand-500', iconBg = 'bg-brand-50', alert }: Props) {
  const positive = change !== undefined && change >= 0

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 ${alert ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
              {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              <span>{positive ? '+' : ''}{change}%</span>
              {changeLabel && <span className="text-slate-400 font-normal">{changeLabel}</span>}
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </div>
  )
}
