import { useState, useEffect, useCallback, useRef } from 'react'
import Logo from '../assets/Logo.svg'
import { Link } from 'react-router-dom'
import {
    PlusCircle, LayoutList, Clock, Flame, Layers,
    SlidersHorizontal, X, Info, Tag, Filter,
    Search, ChevronDown, TrendingUp
} from 'lucide-react'
import { issuesApi, analyticsApi } from '../api/index'
import IssueCard from '../components/issues/IssueCard'
import { SkeletonCard, EmptyState, Select } from '../components/ui/index'
import { useDebounce } from '../hooks/useDebounce'
import { getErr, CATEGORIES, STATUS_META, notify, cn } from '../utils/helpers'
import useAuthStore from '../store/authStore'

/* ─── Sort / filter tabs ──────────────────────────────────────── */
const SORT_TABS = [
    { key: 'all', icon: Layers, label: 'All' },
    { key: 'newest', icon: Clock, label: 'New' },
    { key: 'most_upvoted', icon: Flame, label: 'Most Upvoted' },
]

/* ─── Stat card ─────────────────────────────────────────────────── */
function StatCard({ label, value, color }) {
    return (
        <div className="card px-3 sm:px-4 py-2.5 text-center">
            <p className={`font-display text-lg sm:text-xl font-bold ${color}`}>{value?.toLocaleString()}</p>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">{label}</p>
        </div>
    )
}

/* ─── Active filter chip ─────────────────────────────────────────── */
function Chip({ label, onRemove }) {
    return (
        <span className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-800 border border-primary-200 rounded-full px-2.5 py-0.5 font-medium">
            {label}
            <button onClick={onRemove} className="hover:text-red-500 ml-0.5 leading-none" aria-label="Remove filter">
                <X className="h-3 w-3" />
            </button>
        </span>
    )
}

/* ─── Left sidebar widget ────────────────────────────────────────── */
function QuickNav({ user, isCitizen, summary }) {
    return (
        <aside className="hidden xl:flex flex-col gap-3 w-56 flex-shrink-0">
            {/* Community card */}
            <div className="card p-4">
                <div className="h-12 rounded-lg bg-gradient-to-r from-primary-950 via-primary-800 to-primary-700 mb-3" />
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 -mt-7 rounded-lg border-2 border-white bg-primary-800 flex items-center justify-center shadow flex-shrink-0 overflow-auto">
                        <img className='w-full h-full' src={Logo} alt="Logo" srcset="" />
                    </div>
                    <p className="font-display font-bold text-slate-900 text-sm mt-0.5">ResolveX</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    A public platform for reporting and tracking civic issues in your community.
                </p>
                {isCitizen?.() ? (
                    <Link to="/issues/new" className="btn-primary btn btn-sm w-full justify-center">
                        <PlusCircle className="h-3.5 w-3.5" /> Report Issue
                    </Link>
                ) : !user ? (
                    <Link to="/login" className="btn-secondary btn btn-sm w-full justify-center">
                        Sign in to report
                    </Link>
                ) : null}
            </div>

            {/* Community stats */}
            {summary && (
                <div className="card p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Community Stats</p>
                    <div className="space-y-2">
                        {[
                            { label: 'Total Issues', value: summary.totalIssues, color: 'text-slate-700 ' },
                            { label: 'Open', value: summary.openIssues, color: 'text-amber-600 ' },
                            { label: 'In Progress', value: summary.inProgressIssues, color: 'text-blue-600 ' },
                            { label: 'Resolved', value: summary.resolvedIssues, color: 'text-emerald-600 ' },
                        ].map(s => (
                            <div key={s.label} className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 ">{s.label}</span>
                                <span className={`text-xs font-bold ${s.color}`}>{s.value?.toLocaleString() ?? '—'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick links */}
            <div className="card p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Quick Links</p>
                <div className="space-y-1">
                    {[
                        { to: '/analytics', label: 'View Analytics', icon: TrendingUp },
                        ...(isCitizen?.() ? [{ to: '/issues/new', label: 'New Report', icon: PlusCircle }] : []),
                    ].map(({ to, label, icon: Icon }) => (
                        <Link key={to} to={to}
                            className="flex items-center gap-2 text-xs text-slate-600 hover:text-primary-800 px-1 py-1 rounded transition-colors">
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </Link>
                    ))}
                </div>
            </div>
        </aside>
    )
}

/* ─── Right sidebar ─────────────────────────────────────────────── */
function RightPanel({ filters, setField, summary }) {
    return (
        <aside className="hidden lg:flex flex-col gap-3 w-56 flex-shrink-0">
            {/* About */}
            <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Info className="h-4 w-4 text-primary-800 flex-shrink-0" />
                    <h3 className="font-display font-bold text-slate-900 text-sm">About this Feed</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                    Every report is visible to the community and sent to local authorities for action.
                </p>
            </div>

            {/* Categories */}
            <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-primary-800 flex-shrink-0" />
                    <h3 className="font-display font-bold text-slate-900 text-sm">Browse by Category</h3>
                </div>
                <div className="space-y-0.5">
                    {CATEGORIES.slice(0, 9).map(c => (
                        <button key={c} onClick={() => setField('category', filters.category === c ? '' : c)}
                            className={cn(
                                'w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors',
                                filters.category === c
                                    ? 'bg-primary-50 text-primary-800 font-semibold'
                                    : 'text-slate-600 hover:bg-slate-50 '
                            )}>
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Status filter */}
            <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-4 w-4 text-primary-800 flex-shrink-0" />
                    <h3 className="font-display font-bold text-slate-900 text-sm">Filter by Status</h3>
                </div>
                <div className="space-y-0.5">
                    {Object.entries(STATUS_META).map(([k, v]) => (
                        <button key={k} onClick={() => setField('status', filters.status === k ? '' : k)}
                            className={cn(
                                'w-full text-left flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg transition-colors',
                                filters.status === k
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

/* ─── Main page ──────────────────────────────────────────────────── */
export default function IssuesPage() {
    const { user, isCitizen } = useAuthStore()
    const [filters, setFilters] = useState({ sort: 'newest', limit: 20, page: 1 })
    const [search, setSearch] = useState('')
    const [issues, setIssues] = useState([])
    const [meta, setMeta] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(false)
    const [upvoted, setUpvoted] = useState({})
    const [upvoting, setUpvoting] = useState({})
    const [summary, setSummary] = useState(null)
    const searchRef = useRef(null)

    const dbFilters = useDebounce({ ...filters, search: search || undefined }, 350)

    useEffect(() => {
        analyticsApi.summary().then(r => setSummary(r.data.data)).catch(() => null)
    }, [])

    const load = useCallback(async () => {
        setLoading(true)
        try {
            // "all" sort key → send as newest (no special sort, just all records)
            const effectiveFilters = { ...dbFilters }
            if (effectiveFilters.sort === 'all') delete effectiveFilters.sort
            const params = Object.fromEntries(
                Object.entries(effectiveFilters).filter(([, v]) => v != null && v !== '')
            )
            const r = await issuesApi.list(params)
            setIssues(r.data.data)
            setMeta(r.data.meta)
            const map = {}
            r.data.data.forEach(i => { map[i._id] = !!i.hasUpvoted })
            setUpvoted(prev => ({ ...prev, ...map }))
        } catch (e) { notify.error(getErr(e)) }
        finally { setLoading(false) }
    }, [JSON.stringify(dbFilters)])

    useEffect(() => { load() }, [load])

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

    const setSort = k => setFilters(f => ({ ...f, sort: k, page: 1 }))
    const setField = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }))
    const clearAll = () => { setFilters({ sort: 'newest', limit: 20, page: 1 }); setSearch('') }

    const hasActive = filters.category || filters.status || search
    const pages = meta?.totalPages || 1

    return (
        <div className="page-wrap">
            {/* Header banner */}
            <div className="card overflow-hidden">
                <div className="h-16 sm:h-20 bg-gradient-to-r from-primary-950 via-primary-800 to-primary-700" />
                <div className="px-4 sm:px-5 pb-4 pt-3 flex flex-col sm:flex-row sm:items-end gap-3">
                    <div className="flex items-center gap-3">
                        <div className="-mt-6 sm:-mt-8 h-12 w-12 sm:h-14 sm:w-14 rounded-xl border-4 border-white bg-primary-800 flex items-center justify-center shadow-lg flex-shrink-0 overflow-auto">
                            <img className='w-full h-full' src={Logo} alt="Logo" srcset="" />
                        </div>
                        <div>
                            <h1 className="font-display font-bold text-slate-900 text-lg sm:text-xl">Civic Issues Feed</h1>
                            <p className="text-xs text-slate-500 ">
                                {meta ? `${meta.total.toLocaleString()} reports` : 'Loading...'} · Community platform
                            </p>
                        </div>
                    </div>
                    {isCitizen?.() && (
                        <Link to="/issues/new" className="btn-primary btn btn-sm sm:ml-auto self-start">
                            <PlusCircle className="h-4 w-4" /> Report Issue
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats strip */}
            {summary && (
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <StatCard label="Total" value={summary.totalIssues} color="text-slate-700 " />
                    <StatCard label="Open" value={summary.openIssues} color="text-amber-600 " />
                    <StatCard label="Resolved" value={summary.resolvedIssues} color="text-emerald-600 " />
                </div>
            )}

            {/* Three-column layout */}
            <div className="flex gap-4 items-start">

                {/* ── Left panel (xl+) ── */}
                <QuickNav user={user} isCitizen={isCitizen} summary={summary} />

                {/* ── Main feed ── */}
                <div className="flex-1 min-w-0 space-y-3">

                    {/* Sort tabs + search bar */}
                    <div className="card px-3 sm:px-4 py-2.5">
                        <div className="flex items-center gap-1 flex-wrap">
                            {/* Sort tabs */}
                            <div className="flex items-center gap-0.5">
                                {SORT_TABS.map(t => (
                                    <button key={t.key} onClick={() => setSort(t.key)}
                                        className={cn(
                                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                                            filters.sort === t.key
                                                ? 'bg-primary-800 text-white'
                                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 '
                                        )}>
                                        <t.icon className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span className="hidden sm:inline">{t.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1" />

                            {/* Search bar (desktop) */}
                            <div className="relative hidden sm:flex items-center">
                                <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                                <input
                                    ref={searchRef}
                                    className="w-48 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-7 py-1.5 text-xs placeholder:text-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-800 focus:border-transparent transition-all focus:w-56"
                                    placeholder="Search issues..."
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setFilters(f => ({ ...f, page: 1 })) }}
                                />
                                {search && (
                                    <button className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setSearch('')}>
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>

                            {/* Filter toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                                    showFilters || hasActive
                                        ? 'bg-primary-50 text-primary-800 border border-primary-200 '
                                        : 'text-slate-500 hover:bg-slate-100 '
                                )}>
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Filter</span>
                                {hasActive && <span className="h-1.5 w-1.5 rounded-full bg-primary-800 " />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile search */}
                    <div className="sm:hidden relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            className="input text-sm pl-9"
                            placeholder="Search issues..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setFilters(f => ({ ...f, page: 1 })) }}
                        />
                        {search && (
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setSearch('')}>
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Expanded filters panel */}
                    {showFilters && (
                        <div className="card p-4 animate-slide-up space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div className="field">
                                    <label className="label text-xs">Category</label>
                                    <Select value={filters.category || ''} onChange={e => setField('category', e.target.value)} className="text-sm py-2">
                                        <option value="">All Categories</option>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </Select>
                                </div>
                                <div className="field">
                                    <label className="label text-xs">Status</label>
                                    <Select value={filters.status || ''} onChange={e => setField('status', e.target.value)} className="text-sm py-2">
                                        <option value="">All Statuses</option>
                                        {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                    </Select>
                                </div>
                                <div className="field">
                                    <label className="label text-xs">Per page</label>
                                    <Select value={filters.limit || 20} onChange={e => setField('limit', Number(e.target.value))} className="text-sm py-2">
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </Select>
                                </div>
                            </div>
                            {hasActive && (
                                <button onClick={clearAll} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                                    <X className="h-3 w-3" /> Clear all filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* Active filter chips */}
                    {hasActive && (
                        <div className="flex flex-wrap gap-1.5">
                            {search && <Chip label={`"${search}"`} onRemove={() => setSearch('')} />}
                            {filters.category && <Chip label={filters.category} onRemove={() => setField('category', '')} />}
                            {filters.status && <Chip label={STATUS_META[filters.status]?.label} onRemove={() => setField('status', '')} />}
                        </div>
                    )}

                    {/* Issues list */}
                    {loading
                        ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}</div>
                        : issues.length === 0
                            ? (
                                <EmptyState
                                    icon={LayoutList}
                                    title="No issues found"
                                    desc="Try adjusting your filters or be the first to report an issue."
                                    action={isCitizen?.() ? (
                                        <Link to="/issues/new" className="btn-primary btn btn-sm">
                                            <PlusCircle className="h-4 w-4" /> Report Issue
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

                    {/* Pagination */}
                    {pages > 1 && (
                        <div className="flex items-center justify-center gap-2 py-2">
                            <button
                                className="btn-ghost btn btn-sm"
                                disabled={filters.page <= 1}
                                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>
                                ← Prev
                            </button>
                            <div className="flex gap-1">
                                {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                                    const p = pages <= 7 ? i + 1
                                        : filters.page <= 4 ? i + 1
                                            : filters.page >= pages - 3 ? pages - 6 + i
                                                : filters.page - 3 + i
                                    if (p < 1 || p > pages) return null
                                    return (
                                        <button key={p} onClick={() => setFilters(f => ({ ...f, page: p }))}
                                            className={cn(
                                                'h-8 w-8 rounded-lg text-sm font-semibold transition-colors',
                                                filters.page === p
                                                    ? 'bg-primary-800 text-white'
                                                    : 'text-slate-500 hover:bg-slate-100 '
                                            )}>
                                            {p}
                                        </button>
                                    )
                                })}
                            </div>
                            <button
                                className="btn-ghost btn btn-sm"
                                disabled={filters.page >= pages}
                                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>
                                Next →
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Right panel ── */}
                <RightPanel filters={filters} setField={setField} summary={summary} />
            </div>
        </div>
    )
}
