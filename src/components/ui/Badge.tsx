type Variant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple'

const STYLES: Record<Variant, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  error:   'bg-red-50 text-red-600',
  info:    'bg-blue-50 text-blue-700',
  purple:  'bg-purple-50 text-purple-700',
}

export default function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: Variant }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STYLES[variant]}`}>
      {children}
    </span>
  )
}
