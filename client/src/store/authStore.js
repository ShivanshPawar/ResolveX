import { create } from 'zustand'
import { authApi } from '../api/index'

const useAuthStore = create((set, get) => ({
    user: null,
    loading: true,
    init: async () => {
        try { const r = await authApi.me(); set({ user: r.data.data, loading: false }) }
        catch { set({ user: null, loading: false }) }
    },
    login: async (creds) => { const r = await authApi.login(creds); set({ user: r.data.data }); return r.data.data },
    register: async (d) => { const r = await authApi.register(d); set({ user: r.data.data }); return r.data.data },
    logout: async () => { await authApi.logout().catch(() => null); set({ user: null }) },
    setUser: (u) => set({ user: u }),
    isAuth: () => !!get().user,
    isMod: () => ['admin', 'moderator'].includes(get().user?.role),
    isAdmin: () => get().user?.role === 'admin',
    isCitizen: () => get().user?.role === 'user',
}))

export default useAuthStore
