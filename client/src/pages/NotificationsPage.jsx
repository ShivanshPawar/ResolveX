import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, MessageCircle, TrendingUp, RefreshCw, FileText, Edit3, Trash2, UserCog } from 'lucide-react'
import useNotifStore from '../store/notifStore'
import { timeAgo, cn } from '../utils/helpers'
import { PageLoader } from '../components/ui/index'

/* ── Map notification type → icon + label + colour ─────────────── */
function notifMeta(type) {
    switch (type) {
        case 'issue_created':
            return { icon: FileText, label: 'New Report', color: 'text-amber-600 ', bg: 'bg-amber-50 ' }
        case 'issue_updated':
            return { icon: Edit3, label: 'Report Edited', color: 'text-indigo-600 ', bg: 'bg-indigo-50 ' }
        case 'issue_deleted':
            return { icon: Trash2, label: 'Issue Deleted', color: 'text-red-600 ', bg: 'bg-red-50 ' }
        case 'issue_status_changed':
            return { icon: RefreshCw, label: 'Status Update', color: 'text-blue-600 ', bg: 'bg-blue-50 ' }
        case 'issue_comment':
            return { icon: MessageCircle, label: 'New Comment', color: 'text-emerald-600 ', bg: 'bg-emerald-50 ' }
        case 'issue_upvote':
            return { icon: TrendingUp, label: 'New Upvote', color: 'text-primary-800 ', bg: 'bg-primary-50 ' }
        case 'account_role_changed':
            return { icon: UserCog, label: 'Role Updated', color: 'text-violet-600 ', bg: 'bg-violet-50 ' }
        default:
            return { icon: Bell, label: 'Notification', color: 'text-slate-500 ', bg: 'bg-slate-100 ' }
    }
}

export default function NotificationsPage() {
    const { notifs, unread, fetch, markRead, markAll } = useNotifStore()
    const nav = useNavigate()

    useEffect(() => { fetch() }, [])

    const handleClick = (n) => {
        if (!n.read) markRead(n._id)
        if (n.payload?.issueId) nav(`/issues/${n.payload.issueId}`)
    }

    // Group by today / yesterday / older
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfYesterday = new Date(startOfToday - 86400000)

    const groups = [
        { label: 'Today', items: notifs.filter(n => new Date(n.createdAt) >= startOfToday) },
        { label: 'Yesterday', items: notifs.filter(n => new Date(n.createdAt) >= startOfYesterday && new Date(n.createdAt) < startOfToday) },
        { label: 'Older', items: notifs.filter(n => new Date(n.createdAt) < startOfYesterday) },
    ].filter(g => g.items.length > 0)

    return (
        <div className="max-w-2xl mx-auto page-wrap">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary-800 " />
                        Notifications
                        {unread > 0 && (
                            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                {unread > 99 ? '99+' : unread}
                            </span>
                        )}
                    </h1>
                    <p className="page-sub">{notifs.length} total - {unread} unread</p>
                </div>
                {unread > 0 && (
                    <button
                        onClick={markAll}
                        className="btn-secondary btn btn-sm flex items-center gap-1.5">
                        <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                    </button>
                )}
            </div>

            {/* Empty state */}
            {notifs.length === 0 && (
                <div className="card p-12 text-center">
                    <div className="mx-auto h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <Bell className="h-7 w-7 text-slate-300 " />
                    </div>
                    <p className="font-display font-bold text-slate-700 ">All caught up</p>
                    <p className="text-sm text-slate-500 mt-1">No notifications yet. We'll let you know when something happens.</p>
                </div>
            )}

            {/* Grouped list */}
            {groups.map(group => (
                <div key={group.label} className="space-y-1.5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                        {group.label}
                    </p>
                    <div className="card overflow-hidden divide-y divide-slate-50 ">
                        {group.items.map(n => {
                            const meta = notifMeta(n.type)
                            const Icon = meta.icon
                            return (
                                <button
                                    key={n._id}
                                    onClick={() => handleClick(n)}
                                    className={cn(
                                        'w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors',
                                        !n.read && 'bg-primary-50/50 '
                                    )}>
                                    {/* Icon */}
                                    <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', meta.bg)}>
                                        <Icon className={cn('h-4 w-4', meta.color)} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={cn('text-[10px] font-bold uppercase tracking-wide', meta.color)}>
                                                {meta.label}
                                            </span>
                                            {!n.read && (
                                                <span className="h-1.5 w-1.5 rounded-full bg-primary-800 flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-700 leading-snug break-words">
                                            {n.payload?.message || n.type.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                                    </div>

                                    {/* Unread dot */}
                                    {!n.read && (
                                        <div className="flex-shrink-0 mt-2">
                                            <span className="block h-2 w-2 rounded-full bg-primary-800 " />
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}
