import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, TrendingUp, MessageCircle, Clock, User, Pencil, Trash2, ChevronLeft, CheckCircle, AlertTriangle, Share2, RefreshCw } from 'lucide-react'
import { issuesApi, commentsApi } from '../api/index'
import { IssueMap } from '../components/issues/IssueMap'
import { IssueImageManager } from '../components/issues/ImageUploader'
import CommentThread from '../components/comments/CommentThread'
import { StatusBadge, PageLoader, Avatar, ConfirmModal, ErrorAlert, Spinner, Modal, Select } from '../components/ui/index'
import { CATEGORIES, STATUS_META, getErr, timeAgo, fmtDate, cn } from '../utils/helpers'
import { joinRoom, leaveRoom, connectSocket } from '../socket/index'
import useAuthStore from '../store/authStore'
import { toast } from 'react-toastify'

function Timeline({ issue }) {
    const steps = ['new', 'in_review', 'in_progress', 'resolved']
    if (issue.status === 'rejected') return (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div><p className="text-sm font-semibold text-red-700">Issue Rejected</p>
                {issue.rejectionReason && <p className="text-sm text-red-600 mt-0.5 break-words">{issue.rejectionReason}</p>}
            </div>
        </div>
    )
    const cur = steps.indexOf(issue.status)
    return (
        <div className="flex items-center">
            {steps.map((s, i) => (
                <div key={s} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1">
                        <div className={cn('h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all', i < cur ? 'bg-primary-800 border-primary-800' : i === cur ? 'border-primary-800 bg-primary-50' : 'border-slate-200 bg-white')}>
                            {i < cur ? <CheckCircle className="h-4 w-4 text-white" /> : <span className={cn('text-xs font-bold', i === cur ? 'text-primary-800' : 'text-slate-300')}>{i + 1}</span>}
                        </div>
                        <span className={cn('text-[9px] sm:text-[10px] font-semibold whitespace-nowrap hidden sm:block', i <= cur ? 'text-primary-800' : 'text-slate-400')}>{STATUS_META[s]?.label}</span>
                    </div>
                    {i < steps.length - 1 && <div className={cn('flex-1 h-0.5 mx-1 mb-4', i < cur ? 'bg-primary-800' : 'bg-slate-200')} />}
                </div>
            ))}
        </div>
    )
}

function getIssueCoordinates(issue) {
    const latitude = Number(issue.latitude)
    const longitude = Number(issue.longitude)
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return { latitude, longitude }
    }

    const [geoLongitude, geoLatitude] = issue.locationGeo?.coordinates || []
    const fallbackLatitude = Number(geoLatitude)
    const fallbackLongitude = Number(geoLongitude)
    if (
        Number.isFinite(fallbackLatitude) &&
        Number.isFinite(fallbackLongitude) &&
        !(fallbackLatitude === 0 && fallbackLongitude === 0)
    ) {
        return { latitude: fallbackLatitude, longitude: fallbackLongitude }
    }

    return null
}

function EditModal({ issue, onClose, onSaved }) {
    const [form, setForm] = useState({ title: issue.title, description: issue.description, location: issue.location, category: issue.category })
    const [busy, setBusy] = useState(false)
    const [err, setErr] = useState('')
    const save = async (e) => {
        e.preventDefault(); setBusy(true); setErr('')
        try { const r = await issuesApi.update(issue._id, form); onSaved(r.data.data); onClose(); toast.success('Issue updated') }
        catch (e) { setErr(getErr(e)) }
        finally { setBusy(false) }
    }
    return (
        <Modal open onClose={onClose} title="Edit Issue" size="lg">
            <ErrorAlert message={err} />
            <form onSubmit={save} className="space-y-4 mt-3">
                <div className="field"><label className="label">Title</label>
                    <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required maxLength={140} />
                </div>
                <div className="field"><label className="label">Category</label>
                    <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
                <div className="field"><label className="label">Location</label>
                    <input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required maxLength={200} />
                </div>
                <div className="field"><label className="label">Description</label>
                    <textarea className="input resize-none" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required maxLength={2000} />
                </div>
                <div className="flex justify-end gap-3 pt-1">
                    <button type="button" className="btn-ghost btn" onClick={onClose}>Cancel</button>
                    <button type="submit" className="btn-primary btn" disabled={busy}>{busy ? <Spinner size="sm" /> : 'Save Changes'}</button>
                </div>
            </form>
        </Modal>
    )
}

function StatusModal({ issue, onClose, onSaved }) {
    const [status, setStatus] = useState(issue.status)
    const [rejectionReason, setRejectionReason] = useState(issue.rejectionReason || '')
    const [busy, setBusy] = useState(false)
    const [err, setErr] = useState('')

    const save = async (e) => {
        e.preventDefault()
        setBusy(true)
        setErr('')
        try {
            const body = { status }
            if (status === 'rejected') body.rejectionReason = rejectionReason
            const r = await issuesApi.update(issue._id, body)
            onSaved(r.data.data)
            onClose()
            toast.success('Status updated')
        } catch (e) {
            setErr(getErr(e))
        } finally {
            setBusy(false)
        }
    }

    return (
        <Modal open onClose={onClose} title="Change Status" size="sm">
            <ErrorAlert message={err} />
            <form onSubmit={save} className="space-y-4 mt-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Issue</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800 line-clamp-2 break-words">
                        {issue.title}
                    </p>
                </div>
                <div className="field">
                    <label className="label">Status</label>
                    <Select value={status} onChange={e => setStatus(e.target.value)}>
                        {Object.entries(STATUS_META).map(([key, meta]) => (
                            <option key={key} value={key}>{meta.label}</option>
                        ))}
                    </Select>
                </div>
                {status === 'rejected' && (
                    <div className="field">
                        <label className="label">Rejection Reason</label>
                        <textarea
                            className="input resize-none"
                            rows={3}
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            maxLength={500}
                            placeholder="Explain why this issue is being rejected..."
                        />
                    </div>
                )}
                <div className="flex justify-end gap-3 pt-1">
                    <button type="button" className="btn-ghost btn" onClick={onClose}>Cancel</button>
                    <button type="submit" className="btn-primary btn" disabled={busy}>{busy ? <Spinner size="sm" /> : 'Save Status'}</button>
                </div>
            </form>
        </Modal>
    )
}

export default function IssueDetail() {
    const { id } = useParams()
    const nav = useNavigate()
    const { user, isMod } = useAuthStore()
    const [issue, setIssue] = useState(null)
    const [comments, setComments] = useState([])
    const [loading, setLoading] = useState(true)
    const [upvoting, setUpvoting] = useState(false)
    const [hasUpvoted, setHasUpvoted] = useState(false)
    const [editing, setEditing] = useState(false)
    const [statusChanging, setStatusChanging] = useState(false)
    const [confirmDel, setConfirmDel] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const fetchIssue = useCallback(async () => {
        try {
            const r = await issuesApi.getById(id)
            setIssue(r.data.data)
            setHasUpvoted(r.data.data.hasUpvoted || false)
        } catch { toast.error('Issue not found'); nav('/issues') }
    }, [id])

    const fetchComments = useCallback(async () => {
        try { const r = await commentsApi.list(id); setComments(r.data.data) } catch { }
    }, [id])

    useEffect(() => {
        Promise.all([fetchIssue(), fetchComments()]).finally(() => setLoading(false))
    }, [fetchIssue, fetchComments])

    // Socket.io live updates
    useEffect(() => {
        const sock = connectSocket()
        joinRoom(id)
        sock.on('issue:updated', ({ issueId, issue: upd }) => {
            if (String(issueId) === id) { setIssue(upd); toast.info('Status updated') }
        })
        sock.on('comment:created', () => fetchComments())
        sock.on('comment:updated', () => fetchComments())
        sock.on('comment:deleted', () => fetchComments())
        sock.on('upvote:changed', ({ issueId, upvotes }) => {
            if (String(issueId) === id) setIssue(p => p ? { ...p, upvotes } : p)
        })
        return () => {
            leaveRoom(id)
            sock.off('issue:updated'); sock.off('comment:created'); sock.off('comment:updated')
            sock.off('comment:deleted'); sock.off('upvote:changed')
        }
    }, [id])

    const handleUpvote = async () => {
        if (!user) { toast.error('Log in to upvote'); return }
        setUpvoting(true)
        try {
            const r = await issuesApi.upvote(id)
            const { upvoted, upvotes } = r.data.data
            setHasUpvoted(upvoted)
            setIssue(p => p ? { ...p, upvotes: upvotes ?? p.upvotes } : p)
        } catch (e) { toast.error(getErr(e)) }
        finally { setUpvoting(false) }
    }

    const handleDelete = async () => {
        setDeleting(true)
        try { await issuesApi.delete(id); toast.success('Issue deleted'); nav('/issues') }
        catch (e) { toast.error(getErr(e)); setDeleting(false); setConfirmDel(false) }
    }

    const handleShare = () => {
        navigator.clipboard?.writeText(window.location.href).then(() => toast.success('Link copied!'))
    }

    if (loading) return <PageLoader />
    if (!issue) return null

    const ownerId = issue.reportedBy?._id || issue.reportedBy
    const isOwner = user && (user._id === ownerId || user.id === ownerId)
    const canChangeStatus = isMod()
    const canEdit = isOwner && !canChangeStatus
    const canDel = isOwner || user?.role === 'admin'
    const issueCoordinates = getIssueCoordinates(issue)

    return (
        <div className="max-w-3xl mx-auto page-wrap">
            {/* Back */}
            <button onClick={() => nav(-1)} className="btn-ghost btn btn-sm -ml-2">
                <ChevronLeft className="h-4 w-4" /> Back
            </button>

            {/* Header card */}
            <div className="card p-5 sm:p-6 overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4 min-w-0">
                    <div className="flex flex-wrap gap-2 min-w-0">
                        <StatusBadge status={issue.status} size="md" />
                        <span className="max-w-full truncate text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">{issue.category}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button onClick={handleShare} className="btn-ghost btn btn-sm btn-icon" title="Share"><Share2 className="h-4 w-4" /></button>
                        {canChangeStatus && <button onClick={() => setStatusChanging(true)} className="btn-secondary btn btn-sm"><RefreshCw className="h-3.5 w-3.5" /> Change Status</button>}
                        {canEdit && <button onClick={() => setEditing(true)} className="btn-ghost btn btn-sm"><Pencil className="h-3.5 w-3.5" /> Edit</button>}
                        {canDel && <button onClick={() => setConfirmDel(true)} className="btn btn-sm text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /> Delete</button>}
                    </div>
                </div>

                <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-4 leading-snug line-clamp-3 break-words" title={issue.title}>{issue.title}</h1>
                <Timeline issue={issue} />

                <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4 text-sm text-slate-500 min-w-0">
                    <span className="flex min-w-0 items-center gap-1.5"><MapPin className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate max-w-[220px]">{issue.location}</span></span>
                    <span className="flex min-w-0 items-center gap-1.5"><User className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate max-w-[180px]">{issue.reportedBy?.fullName || 'Anonymous'}</span></span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 flex-shrink-0" />{timeAgo(issue.createdAt)}</span>
                    {issue.resolvedAt && <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle className="h-3.5 w-3.5" />Resolved {fmtDate(issue.resolvedAt)}</span>}
                </div>
            </div>

            {/* Description */}
            <div className="card p-5 sm:p-6">
                <h2 className="font-display font-bold mb-3 text-sm uppercase tracking-wide text-slate-500">Description</h2>
                <p className="max-h-80 overflow-y-auto scroll-thin pr-1 text-slate-700 leading-relaxed whitespace-pre-line break-words">{issue.description}</p>
            </div>

            {/* Images */}
            {(issue.images?.length > 0 || canEdit) && (
                <div className="card p-5 sm:p-6">
                    <h2 className="font-display font-bold mb-4 text-sm uppercase tracking-wide text-slate-500">Photos</h2>
                    <IssueImageManager issue={issue} canEdit={canEdit} onUpdate={fetchIssue} />
                </div>
            )}

            {/* Map */}
            {issueCoordinates && (
                <div className="card p-5 sm:p-6">
                    <h2 className="font-display font-bold mb-4 text-sm uppercase tracking-wide text-slate-500">Location</h2>
                    <IssueMap latitude={issueCoordinates.latitude} longitude={issueCoordinates.longitude} title={issue.title} />
                </div>
            )}

            {/* Upvote bar */}
            <div className="card p-4 sm:p-5 flex flex-wrap items-center gap-4">
                <button onClick={handleUpvote} disabled={upvoting}
                    aria-pressed={hasUpvoted}
                    className={cn(
                        'flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-sm transition-all border-2',
                        hasUpvoted
                            ? 'bg-primary-800 text-white border-primary-800 shadow-sm shadow-primary-800/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-primary-800 hover:bg-primary-50 hover:text-primary-800'
                    )}>
                    {upvoting ? <Spinner size="sm" /> : <TrendingUp className={cn('h-4 w-4 transition-transform', hasUpvoted && 'scale-110')} />}
                    <span>{hasUpvoted ? 'Upvoted' : 'Upvote'}</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs tabular-nums', hasUpvoted ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600')}>
                        {issue.upvotes ?? 0}
                    </span>
                </button>
                <span className="flex items-center gap-1.5 text-sm text-slate-500"><MessageCircle className="h-4 w-4" />{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
                {!user && <p className="text-xs text-slate-400 sm:ml-auto"><Link to="/login" className="text-primary-800 font-semibold hover:underline">Log in</Link> to upvote or comment</p>}
            </div>

            {/* Comments */}
            <div>
                <h2 className="font-display font-bold text-slate-900 mb-4">Discussion</h2>
                <CommentThread issueId={id} comments={comments} onRefresh={fetchComments} />
            </div>

            {editing && <EditModal issue={issue} onClose={() => setEditing(false)} onSaved={u => setIssue(u)} />}
            {statusChanging && <StatusModal issue={issue} onClose={() => setStatusChanging(false)} onSaved={u => setIssue(u)} />}
            <ConfirmModal open={confirmDel} title="Delete this issue?" desc="This cannot be undone. The issue and all its data will be permanently removed."
                danger loading={deleting} onConfirm={handleDelete} onCancel={() => setConfirmDel(false)} />
        </div>
    )
}
