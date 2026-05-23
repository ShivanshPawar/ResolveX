import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { PageLoader } from './ui/index'

export function RequireAuth({ children }) {
    const { user, loading } = useAuthStore()
    const loc = useLocation()
    if (loading) return <PageLoader />
    if (!user) return <Navigate to="/login" state={{ from: loc }} replace />
    return children
}

// Citizens only (role === 'user') — admins/mods manage, they don't report
export function CitizenOnly({ children }) {
    const { user, loading } = useAuthStore()
    if (loading) return <PageLoader />
    if (!user) return <Navigate to="/login" replace />
    if (user.role === 'admin' || user.role === 'moderator') return <Navigate to="/admin" replace />
    return children
}

export function RequireMod({ children }) {
    const { user, loading, isMod } = useAuthStore()
    const loc = useLocation()
    if (loading) return <PageLoader />
    if (!user) return <Navigate to="/login" state={{ from: loc }} replace />
    if (!isMod()) return <Navigate to="/dashboard" replace />
    return children
}

export function GuestOnly({ children }) {
    const { user, loading, isMod } = useAuthStore()
    if (loading) return <PageLoader />
    if (user) return <Navigate to={isMod() ? '/admin' : '/dashboard'} replace />
    return children
}
