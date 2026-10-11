import { formatDistanceToNow, format } from 'date-fns'
import { toast } from 'react-toastify'

export const timeAgo = (d) => formatDistanceToNow(new Date(d), { addSuffix: true })
export const fmtDate = (d, f = 'MMM d, yyyy') => format(new Date(d), f)

export const STATUS_META = {
  new: { label: 'New', dot: 'bg-slate-400', badge: 'badge-new' },
  in_review: { label: 'In Review', dot: 'bg-amber-500', badge: 'badge-in_review' },
  in_progress: { label: 'In Progress', dot: 'bg-blue-500', badge: 'badge-in_progress' },
  resolved: { label: 'Resolved', dot: 'bg-emerald-500', badge: 'badge-resolved' },
  rejected: { label: 'Rejected', dot: 'bg-red-500', badge: 'badge-rejected' },
}
export const STATUSES = Object.keys(STATUS_META)

export const CATEGORIES = [
  'Road & Pavement',
  'Street Light',
  'Water Supply',
  'Drainage & Sewage',
  'Garbage Collection',
  'Parks & Recreation',
  'Traffic Signal',
  'Public Safety',
  'Electricity',
  'Building & Construction',
  'Noise Complaint',
  'Other',
]

export const getErr = (e) => e?.response?.data?.message || e?.message || 'Something went wrong'

export const cn = (...c) => c.filter(Boolean).join(' ')

// Convenience wrappers around react-toastify
export const notify = {
  success: (msg) => toast.success(msg),
  error: (msg) => toast.error(msg),
  info: (msg) => toast.info(msg),
  warn: (msg) => toast.warn(msg),
}
