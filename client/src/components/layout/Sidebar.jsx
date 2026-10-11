import { NavLink, Link } from 'react-router-dom'
import {
  Home,
  MapPin,
  PlusCircle,
  User,
  Shield,
  BarChart2,
  Bell,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useNotifStore from '../../store/notifStore'
import { Avatar } from '../ui/index'
import { cn } from '../../utils/helpers'

const citizenLinks = [
  { to: '/issues', icon: Home, label: 'Home Feed', end: true },
  { to: '/issues/new', icon: PlusCircle, label: 'Report Issue', end: true },
  { to: '/analytics', icon: TrendingUp, label: 'Analytics', end: true },
  { to: '/notifications', icon: Bell, label: 'Notifications', end: true },
  { to: '/profile', icon: User, label: 'Profile', end: true },
]

const modLinks = [
  { to: '/issues', icon: Eye, label: 'Issues Feed', end: true },
  { to: '/admin', icon: Shield, label: 'Admin Panel', end: true },
  { to: '/admin/analytics', icon: BarChart2, label: 'Analytics', end: true },
  { to: '/profile', icon: User, label: 'Profile', end: true },
]

const guestLinks = [
  { to: '/issues', icon: MapPin, label: 'Browse Issues', end: true },
  { to: '/analytics', icon: TrendingUp, label: 'Analytics', end: true },
]

export default function Sidebar({ open, collapsed, mobileOnly, onClose, onToggleCollapse }) {
  const { user, isMod, isAdmin } = useAuthStore()
  const { unread } = useNotifStore()

  const links = !user ? guestLinks : isMod() ? modLinks : citizenLinks

  const statusColor = isAdmin()
    ? 'bg-red-500'
    : isMod()
      ? 'bg-amber-500'
      : user
        ? 'bg-emerald-500'
        : 'bg-slate-400'

  const lc = ({ isActive }) =>
    cn(
      'flex items-center gap-3 rounded-xl transition-all duration-150 font-medium text-sm group relative',
      collapsed ? 'px-0 py-2.5 justify-center w-10 mx-auto' : 'px-3 py-2.5',
      isActive
        ? 'bg-primary-800 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 ',
    )

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          'fixed right-0 top-14 sm:top-16 z-30 lg:left-0 lg:right-auto',
          'h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)]',
          'bg-white border-l border-slate-200 lg:border-l-0 lg:border-r ',
          'flex flex-col min-h-0 transition-all duration-250 overflow-hidden',
          collapsed ? 'w-16' : 'w-56',
          open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
          mobileOnly && 'lg:hidden',
        )}
      >
        {/* Mobile header */}
        {/* <div className="flex items-center justify-between px-4 py-3 lg:hidden border-b border-slate-100 ">
 <span className="font-display font-bold text-primary-800 text-sm">Menu</span>
 <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-500">
 <X className="h-4 w-4" />
 </button>
 </div> */}

        {/* Collapse toggle */}
        <div
          className={cn(
            'hidden lg:flex pt-3 pb-2',
            collapsed ? 'justify-center' : 'justify-end  pr-3',
          )}
        >
          <button
            onClick={onToggleCollapse}
            className="h-7 w-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-primary-800 transition-colors shadow-sm"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Nav links */}
        <nav
          className={cn(
            'flex-1 min-h-0 overflow-y-auto overscroll-contain py-2 space-y-0.5 sidebar-scroll',
            collapsed ? 'px-1' : 'px-3',
          )}
        >
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={lc} onClick={onClose} end={l.end}>
              <l.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="flex-1">{l.label}</span>}
              {!collapsed && l.to === '/notifications' && unread > 0 && (
                <span className="h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
              {collapsed && l.to === '/notifications' && unread > 0 && (
                <span className="absolute top-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 flex-shrink-0" />
              )}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border ">
                  {l.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User card at bottom */}
        {user && (
          <div
            className={cn(
              'border-t border-slate-100 ',
              collapsed ? 'py-3 flex justify-center' : 'p-3',
            )}
          >
            {collapsed ? (
              <Link to="/profile" className="relative">
                <Avatar src={user.avatarUrl} name={user.fullName} size="sm" />
                <span
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ',
                    statusColor,
                  )}
                />
              </Link>
            ) : (
              <Link
                to="/profile"
                className="flex items-center gap-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 px-3 py-2.5 transition-colors"
                onClick={onClose}
              >
                <div className="relative flex-shrink-0">
                  <Avatar src={user.avatarUrl} name={user.fullName} size="sm" />
                  <span
                    className={cn(
                      'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ',
                      statusColor,
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">{user.fullName}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                </div>
              </Link>
            )}
          </div>
        )}
      </aside>
    </>
  )
}
