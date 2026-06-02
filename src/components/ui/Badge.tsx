type Variant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple'

const STYLES: Record<Variant, string> = {
  default: 'bg-slate-700 text-slate-300',
  success: 'bg-emerald-500/20 text-emerald-400',
  warning: 'bg-amber-500/20 text-amber-400',
  error:   'bg-red-500/20 text-red-400',
  info:    'bg-blue-500/20 text-blue-400',
  purple:  'bg-teal-500/20 text-teal-400',
}

export default function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: Variant }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STYLES[variant]}`}>
      {children}
    </span>
  )
}
