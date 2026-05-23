import { Search, X } from 'lucide-react'
import { CATEGORIES, STATUS_META } from '../../utils/helpers'
import { Select } from '../ui/index'

export default function IssueFilters({ filters, onChange }) {
    const set = (k, v) => onChange({ ...filters, [k]: v, page: 1 })
    const hasActive = filters.search || filters.category || filters.status

    return (
        <div className="card p-4 space-y-3">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input className="input pl-9" placeholder="Search issues…" value={filters.search || ''} onChange={e => set('search', e.target.value)} />
                {filters.search && (
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => set('search', '')}>
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
            {/* Filter row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                    <label className="label text-xs">Category</label>
                    <Select value={filters.category || ''} onChange={e => set('category', e.target.value)} className="text-sm py-2">
                        <option value="">All Categories</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                </div>
                <div>
                    <label className="label text-xs">Status</label>
                    <Select value={filters.status || ''} onChange={e => set('status', e.target.value)} className="text-sm py-2">
                        <option value="">All Statuses</option>
                        {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </Select>
                </div>
                <div>
                    <label className="label text-xs">Sort by</label>
                    <Select value={filters.sort || 'newest'} onChange={e => set('sort', e.target.value)} className="text-sm py-2">
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="most_upvoted">Most Upvoted</option>
                    </Select>
                </div>
                <div>
                    <label className="label text-xs">Per page</label>
                    <Select value={filters.limit || 20} onChange={e => set('limit', Number(e.target.value))} className="text-sm py-2">
                        <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                    </Select>
                </div>
            </div>
            {/* Active chips */}
            {hasActive && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {filters.search && <Chip label={`"${filters.search}"`} onRemove={() => set('search', '')} />}
                    {filters.category && <Chip label={filters.category} onRemove={() => set('category', '')} />}
                    {filters.status && <Chip label={STATUS_META[filters.status]?.label} onRemove={() => set('status', '')} />}
                    <button onClick={() => onChange({ sort: 'newest', limit: 20, page: 1 })} className="text-xs text-slate-400 hover:text-red-500 underline ml-1">Clear all</button>
                </div>
            )}
        </div>
    )
}

function Chip({ label, onRemove }) {
    return (
        <span className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-800 rounded-full px-2.5 py-0.5 font-medium">
            {label}<button onClick={onRemove} className="hover:text-red-500 ml-0.5 leading-none">×</button>
        </span>
    )
}
