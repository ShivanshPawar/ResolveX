import { useEffect } from 'react'
import useAuthStore from '../store/authStore'

export function useAuthExpiredHandler() {
    useEffect(() => {
        const handleAuthExpired = () => useAuthStore.getState().logout()

        window.addEventListener('auth:expired', handleAuthExpired)
        return () => window.removeEventListener('auth:expired', handleAuthExpired)
    }, [])
}
