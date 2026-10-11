import { useEffect, useState, useCallback } from 'react'
import {
  Shield,
  Users,
  FileText,
  RefreshCw,
  CheckSquare,
  Search,
  X,
  UserCheck,
  UserX,
  Crown,
  Eye,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { adminApi } from '../api/index'
import { StatusBadge, Spinner, Avatar, Select, Modal } from '../components/ui/index'
import { timeAgo, fmtDate, getErr, STATUS_META } from '../utils/helpers'
import useAuthStore from '../store/authStore'
import { toast } from 'react-toastify'

function StatCard({ label, value, accent, icon: Icon, bg, trend }) {
  return (
    <div className="card p-4 sm:p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`h-[18px] w-[18px] ${accent}`} />
        </div>
        {trend != null && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-600 ' : 'bg-red-50 text-red-500 '}`}
          >
            {trend >= 0 ? '+' : ''}
            {trend}%
          </span>
        )}
      </div>
      <p className={`font-display text-2xl sm:text-3xl font-bold ${accent}`}>
        {value?.toLocaleString() ?? '—'}
      </p>
      <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
    </div>
  )
}

function TabBtn({ active, onClick, icon: Icon, children, badge }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
        active
          ? 'bg-primary-800 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800 '
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
      {badge != null && badge > 0 && (
        <span
          className={`ml-0.5 h-4 min-w-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${active ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700 '}`}
        >
          {badge}
        </span>
      )}
    </button>
  )
}

/* ── Issues Tab ──────────────────────────────────────────────────── */
function IssuesTab() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [fStatus, setFStatus] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const [bulkStatus, setBulkSt] = useState('in_review')
  const [bulkBusy, setBulkBusy] = useState(false)
  const [modModal, setModModal] = useState(null)
  const [newStatus, setNewSt] = useState('')
  const [rejReason, setRej] = useState('')
  const [modBusy, setModBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (fStatus) params.status = fStatus
      const r = await adminApi.issues(params)
      setIssues(r.data.data)
    } catch (e) {
      toast.error(getErr(e))
    } finally {
      setLoading(false)
    }
  }, [fStatus])

  useEffect(() => {
    load()
  }, [load])

  const filtered = issues.filter(
    (i) =>
      !search ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.location.toLowerCase().includes(search.toLowerCase()),
  )

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const allChk = filtered.length > 0 && selected.length === filtered.length

  const bulkMod = async () => {
    if (!selected.length) return
    setBulkBusy(true)
    try {
      await adminApi.bulkModerate({ issueIds: selected, status: bulkStatus })
      toast.success(`${selected.length} issues → ${bulkStatus}`)
      setSelected([])
      load()
    } catch (e) {
      toast.error(getErr(e))
    } finally {
      setBulkBusy(false)
    }
  }

  const moderate = async () => {
    setModBusy(true)
    try {
      await adminApi.moderate(modModal._id, {
        status: newStatus,
        rejectionReason: newStatus === 'rejected' ? rejReason : undefined,
      })
      toast.success('Issue updated')
      setModModal(null)
      load()
    } catch (e) {
      toast.error(getErr(e))
    } finally {
      setModBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            className="input pl-8 text-sm w-44 py-2"
            placeholder="Search issues…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              onClick={() => setSearch('')}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <Select
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value)}
          className="text-sm w-36 py-2"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </Select>
        <button className="btn-ghost btn btn-sm ml-auto" onClick={load}>
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-primary-50 border border-primary-200 px-4 py-2.5 animate-slide-up">
          <CheckSquare className="h-4 w-4 text-primary-800 flex-shrink-0" />
          <span className="text-sm font-bold text-primary-800">{selected.length} selected</span>
          <Select
            value={bulkStatus}
            onChange={(e) => setBulkSt(e.target.value)}
            className="text-xs w-32 py-1.5"
          >
            {Object.entries(STATUS_META).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
          <button className="btn-primary btn btn-sm" onClick={bulkMod} disabled={bulkBusy}>
            {bulkBusy ? <Spinner size="sm" /> : 'Apply'}
          </button>
          <button className="btn-ghost btn btn-sm" onClick={() => setSelected([])}>
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-primary-800" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-slate-50 border-b border-slate-200 ">
                <tr>
                  <th className="px-3 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={allChk}
                      onChange={() => setSelected(allChk ? [] : filtered.map((i) => i._id))}
                      className="rounded accent-primary-800"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 ">
                    Title
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 hidden md:table-cell">
                    Category
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 ">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 hidden lg:table-cell">
                    Reported
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold text-slate-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 ">
                {filtered.map((i) => (
                  <tr key={i._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(i._id)}
                        onChange={() => toggle(i._id)}
                        className="rounded accent-primary-800"
                      />
                    </td>
                    <td className="px-3 py-3 max-w-[180px]">
                      <p className="font-medium text-slate-900 truncate">{i.title}</p>
                      <p className="text-xs text-slate-400 truncate">{i.location}</p>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {i.category}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={i.status} />
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell text-xs text-slate-400">
                      {timeAgo(i.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/issues/${i._id}`}
                          className="btn-ghost btn btn-sm btn-icon"
                          title="View issue"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          className="btn-secondary btn btn-sm text-xs"
                          onClick={() => {
                            setModModal(i)
                            setNewSt(i.status)
                            setRej('')
                          }}
                        >
                          Update Status
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && (
              <div className="py-12 text-center text-sm text-slate-400">No issues found.</div>
            )}
          </div>
        </div>
      )}

      {/* Moderate modal */}
      <Modal
        open={!!modModal}
        onClose={() => setModModal(null)}
        title="Update Issue Status"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 mb-0.5">Issue</p>
            <p className="text-sm font-semibold text-slate-800 line-clamp-2">{modModal?.title}</p>
          </div>
          <div className="field">
            <label className="label">New Status</label>
            <Select value={newStatus} onChange={(e) => setNewSt(e.target.value)}>
              {Object.entries(STATUS_META).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </Select>
          </div>
          {newStatus === 'rejected' && (
            <div className="field">
              <label className="label">
                Rejection Reason{' '}
                <span className="text-slate-400 font-normal">(will notify citizen)</span>
              </label>
              <textarea
                className="input resize-none"
                rows={3}
                value={rejReason}
                onChange={(e) => setRej(e.target.value)}
                placeholder="Explain why this issue is being rejected…"
              />
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button className="btn-ghost btn" onClick={() => setModModal(null)}>
              Cancel
            </button>
            <button className="btn-primary btn" onClick={moderate} disabled={modBusy}>
              {modBusy ? <Spinner size="sm" /> : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ── Users Tab ───────────────────────────────────────────────────── */
function UsersTab() {
  const { isAdmin, user: self } = useAuthStore()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleModal, setRoleModal] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [roleLoading, setRoleLoading] = useState(false)
  const [suspendModal, setSuspendModal] = useState(null)
  const [suspendLoading, setSuspendLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await adminApi.users()
      setUsers(r.data.data)
    } catch (e) {
      toast.error(getErr(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (!isAdmin()) {
    return (
      <div className="card p-8 text-center">
        <Shield className="mx-auto h-10 w-10 text-slate-200 mb-3" />
        <p className="font-semibold text-slate-700">Admin Access Required</p>
        <p className="text-sm text-slate-500 mt-1">Only admins can manage user accounts.</p>
      </div>
    )
  }

  const filtered = users.filter(
    (u) =>
      !search ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  )

  const changeRole = async () => {
    if (roleModal._id === self?._id || roleModal.id === self?.id) {
      toast.error("You can't change your own role")
      return
    }
    setRoleLoading(true)
    try {
      await adminApi.updateRole(roleModal._id, newRole)
      toast.success(`${roleModal.fullName}'s role updated to ${newRole}`)
      setRoleModal(null)
      load()
    } catch (e) {
      toast.error(getErr(e))
    } finally {
      setRoleLoading(false)
    }
  }

  const toggleSuspend = async (confirmed) => {
    if (!confirmed || !suspendModal) return
    setSuspendLoading(true)
    try {
      await adminApi.suspendUser(suspendModal._id, !suspendModal.suspended)
      toast.success(
        suspendModal.suspended
          ? `${suspendModal.fullName} unsuspended`
          : `${suspendModal.fullName} suspended`,
      )
      setSuspendModal(null)
      load()
    } catch (e) {
      toast.error(getErr(e))
    } finally {
      setSuspendLoading(false)
    }
  }

  const ROLE_STYLE = {
    admin: 'bg-red-100 text-red-700 border-red-200',
    moderator: 'bg-amber-100 text-amber-700 border-amber-200',
    user: 'bg-slate-100 text-slate-600 border-slate-200',
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            className="input pl-8 text-sm w-52 py-2"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              onClick={() => setSearch('')}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <span className="text-xs text-slate-400">{filtered.length} users</span>
        <button className="btn-ghost btn btn-sm ml-auto" onClick={load}>
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-primary-800" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="bg-slate-50 border-b border-slate-200 ">
                <tr>
                  {['User', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-3 text-left text-xs font-semibold text-slate-500 "
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 ">
                {filtered.map((u) => {
                  const isSelf = u._id === self?._id || u._id === self?.id
                  return (
                    <tr
                      key={u._id}
                      className={`hover:bg-slate-50 transition-colors ${u.suspended ? 'opacity-60' : ''}`}
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={u.avatarUrl} name={u.fullName} size="sm" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-slate-900 truncate max-w-[110px] text-xs sm:text-sm">
                                {u.fullName}
                              </p>
                              {isSelf && (
                                <span className="text-[9px] font-bold bg-primary-50 text-primary-800 px-1.5 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 truncate max-w-[130px]">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${ROLE_STYLE[u.role] || ROLE_STYLE.user}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`text-xs font-semibold flex items-center gap-1 ${u.suspended ? 'text-red-500' : 'text-emerald-600'}`}
                        >
                          {u.suspended ? (
                            <>
                              <UserX className="h-3 w-3" /> Suspended
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3 w-3" /> Active
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400">
                        {fmtDate(u.createdAt, 'MMM d, yy')}
                      </td>
                      <td className="px-3 py-3">
                        {isSelf ? (
                          <span className="text-xs text-slate-300 italic">—</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {/* Change role: citizen <-> moderator (admin can't demote self) */}
                            <button
                              className="btn-ghost btn btn-sm text-xs gap-1"
                              onClick={() => {
                                setRoleModal(u)
                                setNewRole(u.role)
                              }}
                              title="Change role"
                            >
                              <Crown className="h-3.5 w-3.5" /> Role
                            </button>
                            {/* Suspend / Unsuspend */}
                            <button
                              className={`btn btn-sm text-xs ${u.suspended ? 'btn-success' : 'btn-danger'}`}
                              onClick={() => setSuspendModal(u)}
                            >
                              {u.suspended ? 'Unsuspend' : 'Suspend'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!filtered.length && (
              <div className="py-12 text-center text-sm text-slate-400">No users found.</div>
            )}
          </div>
        </div>
      )}

      {/* Role change modal */}
      <Modal
        open={!!roleModal}
        onClose={() => setRoleModal(null)}
        title="Change User Role"
        size="sm"
      >
        <div className="space-y-4">
          {roleModal && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <Avatar src={roleModal.avatarUrl} name={roleModal.fullName} size="md" />
              <div>
                <p className="font-semibold text-slate-900 text-sm">{roleModal.fullName}</p>
                <p className="text-xs text-slate-400">{roleModal.email}</p>
              </div>
            </div>
          )}
          <div className="field">
            <label className="label">New Role</label>
            <Select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="user">Citizen (User)</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </Select>
            <p className="text-xs text-slate-400 mt-1.5">
              {newRole === 'moderator' &&
                '🛡 Moderators can view & update issue statuses, access the admin panel.'}
              {newRole === 'admin' && '⚡ Admins have full access including user management.'}
              {newRole === 'user' && '👤 Citizens can report issues, comment, and upvote.'}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-ghost btn" onClick={() => setRoleModal(null)}>
              Cancel
            </button>
            <button className="btn-primary btn" onClick={changeRole} disabled={roleLoading}>
              {roleLoading ? <Spinner size="sm" /> : 'Save Role'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Suspend confirmation modal */}
      <Modal
        open={!!suspendModal}
        onClose={() => setSuspendModal(null)}
        title={suspendModal?.suspended ? 'Unsuspend Account' : 'Suspend Account'}
        size="sm"
      >
        {suspendModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <Avatar src={suspendModal.avatarUrl} name={suspendModal.fullName} size="md" />
              <div>
                <p className="font-semibold text-slate-900 text-sm">{suspendModal.fullName}</p>
                <p className="text-xs text-slate-400">{suspendModal.email}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              {suspendModal.suspended
                ? `Unsuspending will restore ${suspendModal.fullName}'s ability to log in and use the platform.`
                : `Suspending will prevent ${suspendModal.fullName} from logging in. All their reports remain visible.`}
            </p>
            <div className="flex justify-end gap-3">
              <button className="btn-ghost btn" onClick={() => setSuspendModal(null)}>
                Cancel
              </button>
              <button
                className={`btn ${suspendModal.suspended ? 'btn-success' : 'btn-danger'}`}
                onClick={() => toggleSuspend(true)}
                disabled={suspendLoading}
              >
                {suspendLoading ? (
                  <Spinner size="sm" />
                ) : suspendModal.suspended ? (
                  'Yes, Unsuspend'
                ) : (
                  'Yes, Suspend'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ── Main ────────────────────────────────────────────────────────── */
export default function AdminPanel() {
  const { user, isAdmin } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [tab, setTab] = useState('issues')

  useEffect(() => {
    adminApi
      .stats()
      .then((r) => setStats(r.data.data))
      .catch(() => null)
  }, [])

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="card p-5 sm:p-6 border-l-4 border-l-primary-800 bg-gradient-to-r from-primary-950/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary-800 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="page-title">Admin Panel</h1>
              <p className="page-sub">
                Signed in as{' '}
                <span
                  className={`font-bold ${user?.role === 'admin' ? 'text-red-600 ' : 'text-amber-600 '}`}
                >
                  {user?.role}
                </span>
                <span className="text-slate-400 "> · {user?.fullName}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                adminApi
                  .stats()
                  .then((r) => setStats(r.data.data))
                  .catch(() => null)
              }
              className="btn-ghost btn btn-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={FileText}
          label="Total Issues"
          value={stats?.totalIssues}
          accent="text-primary-800 "
          bg="bg-primary-50 "
        />
        <StatCard
          icon={Shield}
          label="Pending Review"
          value={stats?.pendingReview}
          accent="text-amber-600 "
          bg="bg-amber-50 "
        />
        <StatCard
          icon={CheckSquare}
          label="Resolved Today"
          value={stats?.resolvedToday}
          accent="text-emerald-600 "
          bg="bg-emerald-50 "
        />
        <StatCard
          icon={Users}
          label="Active Users"
          value={stats?.activeUsers}
          accent="text-slate-700 "
          bg="bg-slate-100 "
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap border-b border-slate-200 pb-3">
        <TabBtn
          icon={FileText}
          active={tab === 'issues'}
          onClick={() => setTab('issues')}
          badge={stats?.pendingReview}
        >
          Issues
        </TabBtn>
        {isAdmin() && (
          <TabBtn icon={Users} active={tab === 'users'} onClick={() => setTab('users')}>
            User Management
          </TabBtn>
        )}
      </div>

      {tab === 'issues' && <IssuesTab />}
      {tab === 'users' && <UsersTab />}
    </div>
  )
}
