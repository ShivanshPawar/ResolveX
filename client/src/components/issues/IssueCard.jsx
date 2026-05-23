import { Link, useNavigate } from 'react-router-dom'
import { MessageCircle, Clock, TrendingUp, Tag, Navigation, Image as ImageIcon } from 'lucide-react'
import { StatusBadge, Avatar } from '../ui/index'
import { timeAgo, cn } from '../../utils/helpers'

export default function IssueCard({ issue, onUpvote, hasUpvoted, upvoting }) {
    const img = issue.images?.[0]
    const nav = useNavigate()

    const handleUpvoteClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        onUpvote && onUpvote(issue._id)
    }

    const handleMapClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        nav(`/issues/${issue._id}#map`)
    }

    return (
        <article className="group flex bg-white border border-slate-200 rounded-xl hover:border-primary-800/30 hover:shadow-md transition-all duration-200 overflow-hidden">
            {/* ── Vote column ── */}
            <div className="flex flex-col items-center justify-start pt-4 pb-3 px-2.5 sm:px-3 min-w-[52px] sm:min-w-[60px] bg-slate-50 border-r border-slate-100 ">
                <button
                    onClick={handleUpvoteClick}
                    disabled={upvoting}
                    aria-pressed={hasUpvoted}
                    aria-label={hasUpvoted ? 'Remove upvote' : 'Upvote this issue'}
                    title={hasUpvoted ? 'Upvoted - click to remove' : 'Upvote this issue'}
                    className={cn(
                        'group/vote flex min-h-[58px] w-11 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 transition-all duration-150 select-none',
                        upvoting && 'opacity-60 cursor-wait',
                        hasUpvoted
                            ? 'border-primary-800 bg-primary-800 text-white shadow-sm shadow-primary-800/20'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800 '
                    )}
                >
                    <TrendingUp className={cn('h-5 w-5 transition-transform', hasUpvoted ? 'scale-110' : 'group-hover/vote:-translate-y-0.5')} />
                    <span className={cn('text-xs font-bold tabular-nums leading-none', hasUpvoted ? 'text-white' : 'text-slate-600 ')}>
                        {issue.upvotes ?? 0}
                    </span>
                </button>
            </div>

            {/* ── Content ── */}
            <Link to={`/issues/${issue._id}`} className="flex-1 min-w-0 py-3 sm:py-3.5 px-3 sm:px-4">
                {/* Top meta: reporter + status + category + time */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <Avatar src={issue.reportedBy?.avatarUrl} name={issue.reportedBy?.fullName || '?'} size="xs" />
                        <span className="text-xs text-slate-600 font-semibold truncate max-w-[100px]">
                            {issue.reportedBy?.fullName || 'Anonymous'}
                        </span>
                    </div>

                    <span className="text-slate-200 select-none hidden sm:inline">-</span>

                    <StatusBadge status={issue.status} />

                    <span className="inline-flex max-w-[160px] items-center gap-1 truncate text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                        <Tag className="h-2.5 w-2.5 flex-shrink-0" />{issue.category}
                    </span>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1 flex-shrink-0 ml-auto">
                        <Clock className="h-2.5 w-2.5" />{timeAgo(issue.createdAt)}
                    </span>
                </div>

                {/* Title + thumbnail */}
                <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                        <h3 className={cn(
                            'font-display font-bold leading-snug text-[15px] group-hover:text-primary-800 transition-colors line-clamp-2 mb-1 [overflow-wrap:anywhere]',
                            'text-slate-900 '
                        )}>
                            {issue.title}
                        </h3>
                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed [overflow-wrap:anywhere]">
                            {issue.description}
                        </p>
                    </div>

                    {img ? (
                        <div className="flex-shrink-0 hidden sm:block">
                            <img
                                src={img.thumbnailUrl || img.url}
                                alt=""
                                className="h-20 w-28 sm:h-[88px] sm:w-32 rounded-lg object-cover border border-slate-100 "
                            />
                        </div>
                    ) : (
                        <div className="h-20 w-28 rounded-lg bg-slate-50 items-center justify-center flex-shrink-0 hidden sm:flex border border-slate-100 ">
                            <ImageIcon className="h-6 w-6 text-slate-200 " />
                        </div>
                    )}
                </div>

                {/* Footer: location + comments */}
                <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-slate-400 ">
                    <button
                        onClick={handleMapClick}
                        className="flex items-center gap-1 hover:text-primary-800 transition-colors min-w-0 group/loc"
                    >
                        <Navigation className="h-3 w-3 flex-shrink-0 group-hover/loc:text-primary-800 " />
                        <span className="truncate max-w-[140px]">{issue.location || 'View on map'}</span>
                    </button>

                    <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {issue.commentsCount ?? 0} comment{issue.commentsCount !== 1 ? 's' : ''}
                    </span>
                </div>
            </Link>
        </article>
    )
}
