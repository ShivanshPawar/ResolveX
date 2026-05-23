import { useEffect, useState } from 'react'
import { BarChart2, TrendingUp, PieChart, Clock, Award, Activity, ChevronUp, MessageCircle, RefreshCw } from 'lucide-react'
import { analyticsApi } from '../api/index'
import { PageLoader, Spinner } from '../components/ui/index'
import { STATUS_META, cn } from '../utils/helpers'

/* ── Bar chart ──────────────────────────────────────────────── */
function BarChart({ data, lk, vk, color = '#1E3A8A', height = 'h-40 sm:h-48' }) {
    if (!data?.length) return <p className="text-sm text-slate-400 text-center py-10">No data available</p>
    const max = Math.max(...data.map(d => d[vk]), 1)
    return (
        <div className={`flex items-end gap-1 sm:gap-1.5 ${height} pt-2`}>
            {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0 group">
                    <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        {d[vk]}
                    </span>
                    <div
                        className="w-full rounded-t transition-all duration-500 hover:opacity-80 min-h-[3px]"
                        style={{ height: `${Math.max(3, (d[vk] / max) * 100)}%`, background: color }}
                        title={`${d[lk]}: ${d[vk]}`}
                    />
                    <span className="text-[8px] sm:text-[9px] text-slate-400 truncate w-full text-center leading-none">
                        {d[lk]}
                    </span>
                </div>
            ))}
        </div>
    )
}

/* ── Donut chart ────────────────────────────────────────────── */
const PIE_COLORS = ['#1E3A8A', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']

function DonutChart({ data, lk = '_id', vk = 'count' }) {
    if (!data?.length) return <p className="text-sm text-slate-400 text-center py-10">No data available</p>
    const total = data.reduce((s, d) => s + d[vk], 0)
    let cum = 0
    const polar = (cx, cy, r, a) => {
        const rad = a * Math.PI / 180
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
    }
    const slices = data.map((d, i) => {
        const pct = d[vk] / total, s = cum * 360, e = (cum + pct) * 360
        cum += pct
        const p1 = polar(50, 50, 40, s - 90), p2 = polar(50, 50, 40, e - 90)
        return { ...d, path: `M50 50 L${p1.x} ${p1.y} A40 40 0 ${e - s > 180 ? 1 : 0} 1 ${p2.x} ${p2.y}Z`, color: PIE_COLORS[i % PIE_COLORS.length], pct }
    })
    return (
        <div className="flex flex-col sm:flex-row items-center gap-5">
            <svg viewBox="0 0 100 100" className="h-32 w-32 flex-shrink-0">
                {slices.map((s, i) => (
                    <path key={i} d={s.path} fill={s.color} className="hover:opacity-80 transition-opacity cursor-pointer">
                        <title>{s[lk]}: {s[vk]} ({(s.pct * 100).toFixed(1)}%)</title>
                    </path>
                ))}
                <circle cx="50" cy="50" r="26" fill="white" />
                <text x="50" y="52" textAnchor="middle" fontSize="11" fill="#1E3A8A" fontWeight="bold" fontFamily="sans-serif">{total}</text>
                <text x="50" y="62" textAnchor="middle" fontSize="6" fill="#94a3b8" fontFamily="sans-serif">total</text>
            </svg>
            <div className="flex flex-wrap sm:flex-col gap-2 sm:gap-1.5 flex-1">
                {slices.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                        <span className="text-slate-600 truncate max-w-[120px]">{s[lk] || 'Unknown'}</span>
                        <span className="text-slate-400 ml-auto pl-1 font-mono tabular-nums">
                            {s[vk]} <span className="text-[9px]">({(s.pct * 100).toFixed(0)}%)</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ── Summary card ────────────────────────────────────────────── */
function SummaryCard({ icon: I, label, value, sub, accent = 'text-primary-800 ', bg = 'bg-primary-50 ' }) {
    return (
        <div className="card p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
                <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <I className={`h-[18px] w-[18px] ${accent}`} />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 ">{label}</p>
            </div>
            <p className={`font-display text-2xl sm:text-3xl font-bold ${accent}`}>{value?.toLocaleString()}</p>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
    )
}

/* ── Section card wrapper ─────────────────────────────────── */
function Section({ icon: Icon, title, children, className = '' }) {
    return (
        <div className={cn('card p-5 sm:p-6', className)}>
            <div className="flex items-center gap-2 mb-4">
                <Icon className="h-4 w-4 text-primary-800 flex-shrink-0" />
                <h2 className="font-display font-bold text-slate-900 text-sm sm:text-base">{title}</h2>
            </div>
            {children}
        </div>
    )
}

/* ── Main page ──────────────────────────────────────────────── */
export default function AnalyticsPage() {
    const [d, setD] = useState(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const load = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true)
        else setLoading(true)
        try {
            const [sum, tr, cat, stat, top, res] = await Promise.all([
                analyticsApi.summary(), analyticsApi.trends(30), analyticsApi.categories(),
                analyticsApi.statusDist(), analyticsApi.topIssues(8), analyticsApi.resolution(),
            ])
            setD({
                sum: sum.data.data,
                trends: tr.data.data.map(t => ({ label: `${t._id.month}/${t._id.day}`, count: t.count })),
                cats: cat.data.data.slice(0, 6),
                statDist: stat.data.data,
                top: top.data.data,
                res: res.data.data,
            })
        } catch { }
        finally { setLoading(false); setRefreshing(false) }
    }

    useEffect(() => { load() }, [])

    if (loading) return <PageLoader />

    const rate = d?.sum ? ((d.sum.resolvedIssues / Math.max(d.sum.totalIssues, 1)) * 100).toFixed(1) : 0
    const inProgress = d?.sum?.inProgressIssues ?? 0

    return (
        <div className="page-wrap">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary-800 flex items-center justify-center shadow-sm flex-shrink-0">
                        <Activity className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="page-title">Platform Analytics</h1>
                        <p className="page-sub">Public insights into civic issue reporting and resolution</p>
                    </div>
                </div>
                <button
                    onClick={() => load(true)}
                    disabled={refreshing}
                    className="btn-ghost btn btn-sm"
                    title="Refresh data">
                    <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
                    <span className="hidden sm:inline">Refresh</span>
                </button>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <SummaryCard icon={BarChart2} label="Total Issues" value={d?.sum?.totalIssues ?? 0} accent="text-primary-800 " bg="bg-primary-50 " />
                <SummaryCard icon={TrendingUp} label="Open Issues" value={d?.sum?.openIssues ?? 0} accent="text-amber-600 " bg="bg-amber-50 " />
                <SummaryCard icon={Activity} label="In Progress" value={inProgress} accent="text-blue-600 " bg="bg-blue-50 " />
                <SummaryCard icon={Award} label="Resolved" value={d?.sum?.resolvedIssues ?? 0} accent="text-emerald-600 " bg="bg-emerald-50 "
                    sub={`${rate}% resolution rate`} />
            </div>

            {/* Resolution rate progress bar */}
            <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-700 ">Overall Resolution Rate</p>
                    <p className="text-sm font-bold text-emerald-600 ">{rate}%</p>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000"
                        style={{ width: `${rate}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2">
                    <span className="text-xs text-slate-400 ">{d?.sum?.totalIssues ?? 0} total reports</span>
                    <span className="text-xs text-slate-400 ">{d?.sum?.resolvedIssues ?? 0} resolved</span>
                </div>
            </div>

            {/* Trend chart */}
            <Section icon={TrendingUp} title="Issues Reported — Last 30 Days">
                {d?.trends?.length
                    ? <BarChart data={d.trends} lk="label" vk="count" height="h-44 sm:h-52" />
                    : <p className="text-sm text-slate-400 text-center py-10">No data for the last 30 days.</p>
                }
            </Section>

            {/* Category + Status side by side */}
            <div className="grid sm:grid-cols-2 gap-4">
                <Section icon={PieChart} title="Issues by Category">
                    <DonutChart data={d?.cats} />
                </Section>
                <Section icon={PieChart} title="Issues by Status">
                    <DonutChart data={d?.statDist?.map(x => ({ ...x, _id: STATUS_META[x._id]?.label || x._id }))} />
                </Section>
            </div>

            {/* Top issues */}
            {d?.top?.length > 0 && (
                <Section icon={Award} title="Most Upvoted Issues">
                    <div className="space-y-2">
                        {d.top.map((issue, i) => (
                            <div key={issue._id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                                <span className={cn(
                                    'font-display font-bold text-sm w-6 text-center flex-shrink-0',
                                    i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400 ' : i === 2 ? 'text-amber-700 ' : 'text-slate-200 '
                                )}>
                                    {i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate">{issue.title}</p>
                                    <p className="text-xs text-slate-400 ">{issue.category}</p>
                                </div>
                                <div className="flex items-center gap-3 text-xs flex-shrink-0">
                                    <span className="flex items-center gap-1 font-semibold text-primary-800 ">
                                        <ChevronUp className="h-3 w-3" />{issue.upvotes}
                                    </span>
                                    <span className="flex items-center gap-1 text-slate-400 ">
                                        <MessageCircle className="h-3 w-3" />{issue.commentsCount}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* Resolution time by category */}
            {d?.res?.length > 0 && (
                <Section icon={Clock} title="Avg. Resolution Time by Category">
                    <div className="space-y-3">
                        {d.res.map(r => {
                            const maxHrs = Math.max(...d.res.map(x => x.avgResolutionHours), 1)
                            const pct = Math.min(100, (r.avgResolutionHours / maxHrs) * 100)
                            return (
                                <div key={r._id} className="flex items-center gap-3">
                                    <span className="text-xs text-slate-600 w-36 truncate flex-shrink-0">{r._id}</span>
                                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary-800 to-primary-600 rounded-full transition-all duration-700"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-500 w-16 text-right flex-shrink-0 tabular-nums">
                                        {r.avgResolutionHours.toFixed(1)}h
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </Section>
            )}
        </div>
    )
}
