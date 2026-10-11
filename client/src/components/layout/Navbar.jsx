import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../../assets/Logo.avif'
import {
  Bell,
  Menu,
  LogOut,
  User,
  Shield,
  PlusCircle,
  ChevronDown,
  MessageCircle,
  TrendingUp,
  RefreshCw,
  CheckCheck,
  ArrowRight,
  FileText,
  Edit3,
  Trash2,
  UserCog,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useNotifStore from '../../store/notifStore'
import { Avatar } from '../ui/index'
import { timeAgo, notify, cn } from '../../utils/helpers'

/* ── Notification type metadata ─────────────────────────────── */
function getNotifMeta(type) {
  switch (type) {
    case 'issue_created':
      return { icon: FileText, color: 'text-amber-600 ', bg: 'bg-amber-50 ', label: 'New Report' }
    case 'issue_updated':
      return { icon: Edit3, color: 'text-indigo-600 ', bg: 'bg-indigo-50 ', label: 'Edited' }
    case 'issue_deleted':
      return { icon: Trash2, color: 'text-red-600 ', bg: 'bg-red-50 ', label: 'Deleted' }
    case 'issue_status_changed':
      return { icon: RefreshCw, color: 'text-blue-600 ', bg: 'bg-blue-50 ', label: 'Status Update' }
    case 'issue_comment':
      return {
        icon: MessageCircle,
        color: 'text-emerald-600 ',
        bg: 'bg-emerald-50 ',
        label: 'Comment',
      }
    case 'issue_upvote':
      return { icon: TrendingUp, color: 'text-primary-800 ', bg: 'bg-primary-50 ', label: 'Upvote' }
    case 'account_role_changed':
      return { icon: UserCog, color: 'text-violet-600 ', bg: 'bg-violet-50 ', label: 'Role' }
    default:
      return { icon: Bell, color: 'text-slate-500 ', bg: 'bg-slate-100 ', label: 'Notification' }
  }
}

export default function Navbar({ onMenu, menuOpen }) {
  const { user, logout, isMod, isCitizen } = useAuthStore()
  const { notifs, unread, fetch: fetchNotifs, markRead, markAll } = useNotifStore()
  const [showN, setShowN] = useState(false)
  const [showU, setShowU] = useState(false)
  const nRef = useRef()
  const uRef = useRef()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const isLanding = pathname === '/'

  const landingLinks = [
    { href: '/#how-it-works', label: 'How it works' },
    { href: '/#features', label: 'Features' },
    { href: '/#get-started', label: 'Get started' },
  ]

  useEffect(() => {
    if (user) fetchNotifs()
  }, [user, fetchNotifs])

  useEffect(() => {
    const h = (e) => {
      if (nRef.current && !nRef.current.contains(e.target)) setShowN(false)
      if (uRef.current && !uRef.current.contains(e.target)) setShowU(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleLogout = async () => {
    setShowU(false)
    await logout()
    nav('/')
    notify.success('Logged out successfully')
  }

  const handleNotifClick = (n) => {
    markRead(n._id)
    setShowN(false)
    if (n.payload?.issueId) nav(`/issues/${n.payload.issueId}`)
  }

  const preview = notifs.slice(0, 6)

  return (
    <header className="sticky top-0 z-40 h-14 sm:h-16 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="flex h-full items-center gap-2 sm:gap-3 px-3 sm:px-5">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary-800 flex items-center justify-center shadow-sm overflow-auto">
            <img className="h-full w-full" src={Logo} alt="ResolveX logo" />
          </div>
          <span className="hidden sm:block font-display font-bold text-primary-800 text-[17px]">
            ResolveX
          </span>
        </Link>

        {isLanding && (
          <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border border-slate-200 bg-slate-50/80 p-1 lg:flex">
            {landingLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-white hover:text-primary-800 hover:shadow-sm"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          {user ? (
            <>
              {/* Citizens: Report button */}
              {isCitizen?.() && (
                <Link to="/issues/new" className="btn-primary btn btn-sm hidden sm:flex">
                  <PlusCircle className="h-3.5 w-3.5" /> Report
                </Link>
              )}

              {/* Mods/admins: Admin link */}
              {isMod?.() && (
                <Link to="/admin" className="btn-secondary btn btn-sm hidden sm:flex">
                  <Shield className="h-3.5 w-3.5" /> Admin
                </Link>
              )}

              {/* ── Notifications dropdown ── */}
              <div className="relative" ref={nRef}>
                <button
                  className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                  onClick={() => {
                    setShowN((v) => !v)
                    setShowU(false)
                  }}
                  aria-label="Notifications"
                >
                  <Bell className="h-[18px] w-[18px]" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 min-w-[16px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none px-0.5">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>

                {showN && (
                  <div className="absolute right-0 top-12 w-80 sm:w-96 card shadow-xl animate-slide-up z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50 ">
                      <div className="flex items-center gap-2">
                        <Bell className="h-3.5 w-3.5 text-slate-500 " />
                        <span className="font-semibold text-sm text-slate-800 ">Notifications</span>
                        {unread > 0 && (
                          <span className="h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                            {unread}
                          </span>
                        )}
                      </div>
                      {unread > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markAll()
                          }}
                          className="flex items-center gap-1 text-xs text-primary-800 hover:underline font-medium"
                        >
                          <CheckCheck className="h-3 w-3" /> Mark all read
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto scroll-thin divide-y divide-slate-50 ">
                      {preview.length === 0 ? (
                        <div className="px-4 py-10 text-center">
                          <Bell className="mx-auto h-8 w-8 text-slate-200 mb-2" />
                          <p className="text-sm text-slate-400 ">No notifications yet</p>
                        </div>
                      ) : (
                        preview.map((n) => {
                          const meta = getNotifMeta(n.type)
                          const Icon = meta.icon
                          return (
                            <button
                              key={n._id}
                              onClick={() => handleNotifClick(n)}
                              className={cn(
                                'w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3',
                                !n.read && 'bg-primary-50/60 ',
                              )}
                            >
                              {/* Icon */}
                              <div
                                className={cn(
                                  'h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                                  meta.bg,
                                )}
                              >
                                <Icon className={cn('h-3.5 w-3.5', meta.color)} />
                              </div>

                              {/* Text */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span
                                    className={cn(
                                      'text-[10px] font-bold uppercase tracking-wide',
                                      meta.color,
                                    )}
                                  >
                                    {meta.label}
                                  </span>
                                  {!n.read && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary-800 flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-slate-700 leading-snug line-clamp-2 break-words">
                                  {n.payload?.message || n.type.replace(/_/g, ' ')}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {timeAgo(n.createdAt)}
                                </p>
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5">
                      <Link
                        to="/notifications"
                        onClick={() => setShowN(false)}
                        className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary-800 hover:underline"
                      >
                        View all notifications <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* ── User dropdown ── */}
              <div className="relative hidden lg:block" ref={uRef}>
                <button
                  className="flex items-center gap-1.5 rounded-xl px-1.5 py-1 hover:bg-slate-100 transition-colors"
                  onClick={() => {
                    setShowU((v) => !v)
                    setShowN(false)
                  }}
                >
                  <Avatar src={user.avatarUrl} name={user.fullName} size="sm" />
                  <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[80px] truncate">
                    {user.fullName?.split(' ')[0]}
                  </span>
                  <ChevronDown className="hidden sm:block h-3 w-3 text-slate-400" />
                </button>

                {showU && (
                  <div className="absolute right-0 top-11 w-52 card shadow-xl animate-slide-up z-50 py-1 overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-slate-100 ">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 "
                      onClick={() => setShowU(false)}
                    >
                      <User className="h-4 w-4 text-slate-400" /> Profile
                    </Link>
                    <Link
                      to="/notifications"
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 "
                      onClick={() => setShowU(false)}
                    >
                      <Bell className="h-4 w-4 text-slate-400" />
                      <span>Notifications</span>
                      {unread > 0 && (
                        <span className="ml-auto h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                          {unread}
                        </span>
                      )}
                    </Link>
                    {isMod?.() && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 "
                        onClick={() => setShowU(false)}
                      >
                        <Shield className="h-4 w-4 text-slate-400" /> Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-slate-100 mt-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 "
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowN(false)
                  setShowU(false)
                  onMenu()
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
                aria-label="Open navigation menu"
                aria-expanded={menuOpen}
              >
                <Menu className="h-5 w-5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost btn btn-sm">
                Log in
              </Link>
              <Link to="/register" className="btn-primary btn btn-sm">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
