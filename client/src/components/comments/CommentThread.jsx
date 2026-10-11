import { useState } from 'react'
import { CornerDownRight, Edit2, Trash2, Reply } from 'lucide-react'
import { Avatar, Spinner } from '../ui/index'
import { commentsApi } from '../../api/index'
import { timeAgo, getErr, cn } from '../../utils/helpers'
import useAuthStore from '../../store/authStore'
import { toast } from 'react-toastify'

function CommentForm({
  onSubmit,
  placeholder = 'Add a comment…',
  initial = '',
  label = 'Post',
  onCancel,
}) {
  const [text, setText] = useState(initial)
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    try {
      await onSubmit(text.trim())
      setText('')
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <textarea
        className="input resize-none text-sm"
        rows={3}
        maxLength={1000}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{text.length}/1000</span>
        <div className="flex gap-2">
          {onCancel && (
            <button type="button" className="btn-ghost btn btn-sm" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn-primary btn btn-sm" disabled={busy || !text.trim()}>
            {busy ? <Spinner size="sm" /> : label}
          </button>
        </div>
      </div>
    </form>
  )
}

function CommentItem({ comment, issueId, onRefresh, depth = 0 }) {
  const { user, isMod } = useAuthStore()
  const [replying, setReplying] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const authorId = comment.userId?._id || comment.userId
  const isOwner = user && (user._id === authorId || user.id === authorId)
  const canDel = isOwner || isMod()
  const canEdit = isOwner && !comment.isDeleted
  const canReply = !!user && depth < 2 && !comment.isDeleted

  const handleReply = async (text) => {
    try {
      await commentsApi.create(issueId, { text, parentId: comment._id })
      setReplying(false)
      onRefresh()
    } catch (e) {
      toast.error(getErr(e))
    }
  }
  const handleEdit = async (text) => {
    try {
      await commentsApi.update(comment._id, { text })
      setEditing(false)
      onRefresh()
    } catch (e) {
      toast.error(getErr(e))
    }
  }
  const handleDelete = async () => {
    setDeleting(true)
    try {
      await commentsApi.delete(comment._id)
      onRefresh()
    } catch (e) {
      toast.error(getErr(e))
      setDeleting(false)
    }
  }

  const name = comment.userId?.fullName || 'Anonymous'
  const avatar = comment.userId?.avatarUrl

  return (
    <div className={cn('flex gap-2.5', depth > 0 && 'ml-6 sm:ml-10 mt-3')}>
      {depth > 0 && <CornerDownRight className="h-4 w-4 text-slate-200 mt-3 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <Avatar src={avatar} name={name} size="xs" />
          <span className="text-sm font-semibold text-slate-800">{name}</span>
          <span className="text-xs text-slate-400">{timeAgo(comment.createdAt)}</span>
          {comment.isEdited && <span className="text-[10px] text-slate-400 italic">(edited)</span>}
        </div>

        {editing ? (
          <CommentForm
            initial={comment.text}
            onSubmit={handleEdit}
            label="Save"
            onCancel={() => setEditing(false)}
          />
        ) : (
          <p
            className={cn(
              'text-sm leading-relaxed',
              comment.isDeleted ? 'text-slate-400 italic' : 'text-slate-700',
            )}
          >
            {comment.text}
          </p>
        )}

        {!comment.isDeleted && !editing && (
          <div className="flex items-center gap-3 mt-1.5">
            {canReply && (
              <button
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary-800 transition-colors"
                onClick={() => setReplying((r) => !r)}
              >
                <Reply className="h-3 w-3" /> Reply
              </button>
            )}
            {canEdit && (
              <button
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary-800 transition-colors"
                onClick={() => setEditing(true)}
              >
                <Edit2 className="h-3 w-3" /> Edit
              </button>
            )}
            {canDel && (
              <button
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <Spinner size="sm" /> : <Trash2 className="h-3 w-3" />} Delete
              </button>
            )}
          </div>
        )}

        {replying && (
          <div className="mt-3">
            <CommentForm
              placeholder={`Replying to ${name}…`}
              onSubmit={handleReply}
              label="Reply"
              onCancel={() => setReplying(false)}
            />
          </div>
        )}

        {comment.replies?.map((r) => (
          <CommentItem
            key={r._id}
            comment={r}
            issueId={issueId}
            onRefresh={onRefresh}
            depth={depth + 1}
          />
        ))}
      </div>
    </div>
  )
}

export default function CommentThread({ issueId, comments, onRefresh }) {
  const { user } = useAuthStore()

  const handlePost = async (text) => {
    try {
      await commentsApi.create(issueId, { text, parentId: null })
      onRefresh()
    } catch (e) {
      toast.error(getErr(e))
    }
  }

  // Build nested tree
  const byId = Object.fromEntries(comments.map((c) => [c._id, { ...c, replies: [] }]))
  const roots = []
  comments.forEach((c) => {
    const node = byId[c._id]
    if (c.parentId && byId[c.parentId]) byId[c.parentId].replies.push(node)
    else roots.push(node)
  })

  return (
    <div className="space-y-4">
      {user ? (
        <div className="card p-4">
          <p className="text-sm font-semibold text-slate-700 mb-3">Leave a comment</p>
          <CommentForm onSubmit={handlePost} />
        </div>
      ) : (
        <div className="card p-4 text-center">
          <p className="text-sm text-slate-500">
            <a href="/login" className="text-primary-800 font-semibold hover:underline">
              Log in
            </a>{' '}
            to leave a comment
          </p>
        </div>
      )}
      {roots.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No comments yet — be the first!</p>
      ) : (
        <div className="space-y-px">
          {roots.map((c) => (
            <div key={c._id} className="card p-4">
              <CommentItem comment={c} issueId={issueId} onRefresh={onRefresh} depth={0} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
