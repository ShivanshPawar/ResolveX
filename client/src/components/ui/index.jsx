import { cn, STATUS_META } from '../../utils/helpers'
import { AlertCircle, X } from 'lucide-react'

export function StatusBadge({ status, size = 'sm' }) {
  const m = STATUS_META[status] || STATUS_META.new
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold',
        m.badge,
        size === 'sm' ? 'text-xs' : 'text-sm',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', m.dot)} />
      {m.label}
    </span>
  )
}

export function Spinner({ size = 'md', className = '' }) {
  const s = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-9 w-9' }[size]
  return (
    <svg className={cn('animate-spin text-current', s, className)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center text-primary-800 ">
      <Spinner size="lg" />
    </div>
  )
}

export function Avatar({ src, name = '', size = 'md', className = '' }) {
  const s = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  }[size]
  const ini = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  if (src)
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover flex-shrink-0', s, className)}
        onError={(e) => {
          e.target.style.display = 'none'
        }}
      />
    )
  return (
    <div
      className={cn(
        'rounded-full bg-primary-800 text-white flex items-center justify-center font-bold select-none flex-shrink-0',
        s,
        className,
      )}
    >
      {ini || '?'}
    </div>
  )
}

export function ErrorAlert({ message }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 ">
      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 ">
          <Icon className="h-7 w-7 text-slate-400" />
        </div>
      )}
      <h3 className="font-display text-base font-bold text-slate-800 ">{title}</h3>
      {desc && <p className="mt-1 text-sm text-slate-500 max-w-sm">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3 animate-pulse">
      <div className="flex gap-2">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-20 rounded-full" />
      </div>
      <div className="skeleton h-5 w-3/4" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-2/3" />
    </div>
  )
}

export function Modal({ open, onClose, title, children, size = 'sm' }) {
  if (!open) return null
  const w = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' }[size]
  return (
    <div className="fixed inset-0 z-[80] flex min-h-[100dvh] w-screen items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="fixed inset-0 min-h-[100dvh] w-screen bg-slate-950/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative card w-full animate-slide-up sm:rounded-xl rounded-t-2xl rounded-b-none sm:rounded-b-xl max-h-[90vh] overflow-y-auto scroll-thin',
          w,
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl sm:rounded-t-xl">
            <h3 className="font-display font-bold text-slate-900 ">{title}</h3>
            <button onClick={onClose} className="btn-ghost btn-icon p-1 rounded-lg">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmModal({
  open,
  title,
  desc,
  onConfirm,
  onCancel,
  danger = false,
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      {desc && <p className="text-sm text-slate-600 mb-5">{desc}</p>}
      <div className="flex justify-end gap-3">
        <button className="btn-ghost btn" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button
          className={cn('btn', danger ? 'btn-danger' : 'btn-primary')}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? <Spinner size="sm" /> : 'Confirm'}
        </button>
      </div>
    </Modal>
  )
}

export function Select({ className = '', children, ...p }) {
  return (
    <select className={cn('input cursor-pointer', className)} {...p}>
      {children}
    </select>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors flex-shrink-0',
          checked ? 'bg-primary-800' : 'bg-slate-300 ',
        )}
        onClick={onChange}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5',
          )}
        />
      </div>
      {label && <span className="text-sm text-slate-700 ">{label}</span>}
    </label>
  )
}
