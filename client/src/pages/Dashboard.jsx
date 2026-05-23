import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
    FileText, CheckCircle, Clock, PlusCircle, ArrowRight,
    TrendingUp, MapPin, BarChart2, User, Flame, Layers,
    Tag, Filter, Info, ChevronUp, RefreshCw
} from 'lucide-react'
import { usersApi, issuesApi, analyticsApi } from '../api/index'
import useAuthStore from '../store/authStore'
import { PageLoader, Avatar, StatusBadge, SkeletonCard, EmptyState } from '../components/ui/index'
import IssueCard from '../components/issues/IssueCard'
import { fmtDate, timeAgo, CATEGORIES, STATUS_META, notify, getErr, cn } from '../utils/helpers'

/* ─── Stat card ─────────────────────────────────────────────────── */
function StatCard({ icon: I, label, value, color, bg }) {
    return (
        <div className="card p-3 sm:p-4 flex items-center gap-3">
            <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                <I className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} />
            </div>
            <div className="min-w-0">
                <p className="font-display text-xl sm:text-2xl font-bold text-slate-900 ">{value}</p>
                <p className="text-xs text-slate-500 truncate">{label}</p>
            </div>
        </div>
    )
}

/* ─── Sort tabs ─────────────────────────────────────────────────── */
const SORT_TABS = [
    { key: 'all', icon: Layers, label: 'All' },
    { key: 'newest', icon: Clock, label: 'New' },
    { key: 'most_upvoted', icon: Flame, label: 'Top' },
]

/* ─── Left panel ─────────────────────────────────────────────────── */
function LeftPanel({ user, dashData, isCitizen }) {
    const pending = Math.max(
        0,
        (dashData?.totalIssues || 0) - (dashData?.resolvedIssues || 0) - (dashData?.inProgressIssues || 0)
    )

    return (
        <aside className="hidden lg:flex flex-col gap-3 w-56 xl:w-60 flex-shrink-0">
            {/* Profile card */}
            <div className="card p-4">
                <div className="flex flex-col items-center text-center gap-2 mb-3">
                    <Avatar src={user?.avatarUrl} name={user?.fullName} size="lg" />
                    <div>
                        <p className="font-display font-bold text-slate-900 text-sm truncate">{user?.fullName}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        {user?.createdAt && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                Member since {fmtDate(user.createdAt)}
                            </p>
                        )}
                    </div>
                </div>
                <Link to="/profile" className="btn-secondary btn btn-sm w-full justify-center">
                    <User className="h-3.5 w-3.5" /> Edit Profile
                </Link>
            </div>

            {/* My stats */}
            {dashData && (
                <div className="card p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">
                        My Activity
                    </p>
                    <div className="space-y-2">
                        {[
                            { label: 'Total Reported', value: dashData.totalIssues || 0, color: 'text-primary-800 ' },
                            { label: 'In Progress', value: dashData.inProgressIssues || 0, color: 'text-blue-600 ' },
                            { label: 'Resolved', value: dashData.resolvedIssues || 0, color: 'text-emerald-600 ' },
                            { label: 'Pending', value: pending, color: 'text-amber-600 ' },
                        ].map(s => (
                            <div key={s.label} className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 ">{s.label}</span>
                                <span className={`text-xs font-bold ${s.color}`}>{s.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick navigation */}
            <div className="card p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">
                    Quick Navigation
                </p>
                <div className="space-y-0.5">
                    {[
                        { to: '/issues', icon: MapPin, label: 'Browse Issues' },
                        { to: '/analytics', icon: BarChart2, label: 'Analytics' },
                        ...(isCitizen?.() ? [{ to: '/issues/new', icon: PlusCircle, label: 'Report Issue' }] : []),
                    ].map(({ to, icon: Icon, label }) => (
                        <Link key={to} to={to}
                            className="flex items-center gap-2.5 text-xs text-slate-600 hover:text-primary-800 hover:bg-slate-50 px-2.5 py-2 rounded-lg transition-colors">
                            <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                            {label}
                        </Link>
                    ))}
                </div>
            </div>
        </aside>
    )
}

/* ─── Right panel ─────────────────────────────────────────────────── */
function RightPanel({ activeCategory, setActiveCategory, activeStatus, setActiveStatus }) {
    return (
        <aside className="hidden xl:flex flex-col gap-3 w-56 flex-shrink-0">
            {/* About */}
            <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-primary-800 flex-shrink-0" />
                    <h3 className="font-display font-bold text-slate-900 text-sm">About This Feed</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                    Your personal civic activity feed. Issues you've reported and community updates all in one place.
                </p>
            </div>

            {/* Browse by category */}
            <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-primary-800 flex-shrink-0" />
                    <h3 className="font-display font-bold text-slate-900 text-sm">Browse by Category</h3>
                </div>
                <div className="space-y-0.5">
                    {CATEGORIES.slice(0, 9).map(c => (
                        <button key={c}
                            onClick={() => setActiveCategory(activeCategory === c ? '' : c)}
                            className={cn(
                                'w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors',
                                activeCategory === c
                                    ? 'bg-primary-50 text-primary-800 font-semibold'
                                    : 'text-slate-600 hover:bg-slate-50 '
                            )}>
                            {c}
                        </button>
                    ))}
                    <Link to="/issues"
                        className="flex items-center gap-1 text-xs text-primary-800 hover:underline px-2.5 py-1.5 mt-1">
                        View all categories <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </div>

            {/* Filter by status */}
            <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-4 w-4 text-primary-800 flex-shrink-0" />
                    <h3 className="font-display font-bold text-slate-900 text-sm">Filter by Status</h3>
                </div>
                <div className="space-y-0.5">
                    {Object.entries(STATUS_META).map(([k, v]) => (
                        <button key={k}
                            onClick={() => setActiveStatus(activeStatus === k ? '' : k)}
                            className={cn(
                                'w-full text-left flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg transition-colors',
                                activeStatus === k
                                    ? 'bg-primary-50 font-semibold text-primary-800 '
                                    : 'text-slate-600 hover:bg-slate-50 '
                            )}>
                            <span className={`h-2 w-2 rounded-full flex-shrink-0 ${v.dot}`} />
                            {v.label}
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    )
}

/* ─── Main Dashboard ─────────────────────────────────────────────── */
export default function Dashboard() {
    const { user, isCitizen } = useAuthStore()
    const [dashData, setDashData] = useState(null)
    const [dashLoading, setDashLoading] = useState(true)
    const [issues, setIssues] = useState([])
    const [feedLoading, setFeedLoading] = useState(true)
    const [upvoted, setUpvoted] = useState({})
    const [upvoting, setUpvoting] = useState({})
    const [sort, setSort] = useState('newest')
    const [activeCategory, setActiveCategory] = useState('')
    const [activeStatus, setActiveStatus] = useState('')
    const [summary, setSummary] = useState(null)

    useEffect(() => {
        usersApi.dashboard()
            .then(r => setDashData(r.data.data))
            .catch(() => null)
            .finally(() => setDashLoading(false))

        analyticsApi.summary()
            .then(r => setSummary(r.data.data))
            .catch(() => null)
    }, [])

    const loadFeed = useCallback(async () => {
        setFeedLoading(true)
        try {
            const params = {
                limit: 15,
                page: 1,
                ...(sort !== 'all' ? { sort } : {}),
                ...(activeCategory ? { category: activeCategory } : {}),
                ...(activeStatus ? { status: activeStatus } : {}),
            }
            const r = await issuesApi.list(params)
            setIssues(r.data.data)
            const map = {}
            r.data.data.forEach(i => { map[i._id] = !!i.hasUpvoted })
            setUpvoted(prev => ({ ...prev, ...map }))
        } catch (e) {
            notify.error(getErr(e))
        } finally {
            setFeedLoading(false)
        }
    }, [sort, activeCategory, activeStatus])

    useEffect(() => { loadFeed() }, [loadFeed])

    const handleUpvote = async (issueId) => {
        if (!user) { notify.error('Log in to upvote'); return }
        setUpvoting(p => ({ ...p, [issueId]: true }))
        const wasUpvoted = !!upvoted[issueId]
        setUpvoted(p => ({ ...p, [issueId]: !wasUpvoted }))
        setIssues(p => p.map(i =>
            i._id === issueId
                ? { ...i, upvotes: wasUpvoted ? Math.max(0, (i.upvotes || 0) - 1) : (i.upvotes || 0) + 1 }
                : i
        ))
        try {
            const r = await issuesApi.upvote(issueId)
            const { upvoted: confirmed, upvotes } = r.data.data
            setUpvoted(p => ({ ...p, [issueId]: confirmed }))
            setIssues(p => p.map(i => i._id === issueId ? { ...i, upvotes: upvotes ?? i.upvotes } : i))
        } catch (e) {
            setUpvoted(p => ({ ...p, [issueId]: wasUpvoted }))
            setIssues(p => p.map(i =>
                i._id === issueId
                    ? { ...i, upvotes: wasUpvoted ? (i.upvotes || 0) + 1 : Math.max(0, (i.upvotes || 0) - 1) }
                    : i
            ))
            notify.error(getErr(e))
        } finally { setUpvoting(p => ({ ...p, [issueId]: false })) }
    }

    if (dashLoading) return <PageLoader />

    const pending = Math.max(
        0,
        (dashData?.totalIssues || 0) - (dashData?.resolvedIssues || 0) - (dashData?.inProgressIssues || 0)
    )

    return (
        <div className="page-wrap">
            {/* Welcome header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="page-title">Welcome back, {user?.fullName?.split(' ')[0]}</h1>
                    <p className="page-sub">Your civic activity overview and community feed</p>
                </div>
                {isCitizen?.() && (
                    <Link to="/issues/new" className="btn-primary btn self-start sm:self-auto">
                        <PlusCircle className="h-4 w-4" /> Report Issue
                    </Link>
                )}
            </div>

            {/* Stats strip — full width above columns */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={FileText} label="Total Reported" value={dashData?.totalIssues || 0} bg="bg-primary-50 " color="text-primary-800 " />
                <StatCard icon={Clock} label="In Progress" value={dashData?.inProgressIssues || 0} bg="bg-blue-50 " color="text-blue-600 " />
                <StatCard icon={CheckCircle} label="Resolved" value={dashData?.resolvedIssues || 0} bg="bg-emerald-50 " color="text-emerald-600 " />
                <StatCard icon={TrendingUp} label="Pending" value={pending} bg="bg-amber-50 " color="text-amber-600 " />
            </div>

            {/* Three-column feed layout */}
            <div className="flex gap-4 items-start">

                {/* ── Left panel ── */}
                <LeftPanel user={user} dashData={dashData} isCitizen={isCitizen} />

                {/* ── Center feed ── */}
                <div className="flex-1 min-w-0 space-y-3">
                    {/* Feed controls */}
                    <div className="card px-3 sm:px-4 py-2.5 flex items-center gap-1 flex-wrap">
                        <div className="flex items-center gap-0.5">
                            {SORT_TABS.map(t => (
                                <button key={t.key} onClick={() => setSort(t.key)}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                                        sort === t.key
                                            ? 'bg-primary-800 text-white'
                                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 '
                                    )}>
                                    <t.icon className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="hidden sm:inline">{t.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex-1" />

                        {/* Active filters display */}
                        <div className="flex items-center gap-1.5">
                            {activeCategory && (
                                <span className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-800 border border-primary-200 rounded-full px-2 py-0.5 font-medium">
                                    {activeCategory}
                                    <button onClick={() => setActiveCategory('')} className="hover:text-red-500 ml-0.5">×</button>
                                </span>
                            )}
                            {activeStatus && (
                                <span className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-800 border border-primary-200 rounded-full px-2 py-0.5 font-medium">
                                    {STATUS_META[activeStatus]?.label}
                                    <button onClick={() => setActiveStatus('')} className="hover:text-red-500 ml-0.5">×</button>
                                </span>
                            )}
                        </div>

                        <button
                            onClick={loadFeed}
                            title="Refresh feed"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-800 hover:bg-slate-100 transition-colors"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {/* Feed content */}
                    {feedLoading
                        ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}</div>
                        : issues.length === 0
                            ? (
                                <EmptyState
                                    icon={FileText}
                                    title="No issues in feed"
                                    desc="Your feed is empty. Try adjusting filters or report your first civic issue."
                                    action={isCitizen?.() ? (
                                        <Link to="/issues/new" className="btn-primary btn btn-sm">
                                            <PlusCircle className="h-4 w-4" /> Report First Issue
                                        </Link>
                                    ) : null}
                                />
                            )
                            : (
                                <div className="space-y-2.5">
                                    {issues.map(i => (
                                        <IssueCard
                                            key={i._id}
                                            issue={i}
                                            onUpvote={handleUpvote}
                                            hasUpvoted={!!upvoted[i._id]}
                                            upvoting={!!upvoting[i._id]}
                                        />
                                    ))}
                                </div>
                            )
                    }

                    {/* View all link */}
                    <div className="flex justify-center pt-1">
                        <Link
                            to="/issues"
                            className="btn-ghost btn btn-sm text-primary-800 hover:bg-primary-50 ">
                            Browse all issues <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>

                {/* ── Right panel ── */}
                <RightPanel
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    activeStatus={activeStatus}
                    setActiveStatus={setActiveStatus}
                />
            </div>
        </div>
    )
}
