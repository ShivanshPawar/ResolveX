import { create } from 'zustand'
import { notifApi } from '../api/index'

const useNotifStore = create((set, get) => ({
    notifs: [],
    unread: 0,

    fetch: async () => {
        try {
            const r = await notifApi.list()
            set({ notifs: r.data.data, unread: r.data.meta?.unreadCount ?? 0 })
        } catch { }
    },

    markRead: async (id) => {
        try {
            await notifApi.markRead(id)
            set(s => ({
                notifs: s.notifs.map(n => n._id === id ? { ...n, read: true } : n),
                unread: Math.max(0, s.unread - 1),
            }))
        } catch { }
    },

    markAll: async () => {
        try {
            await notifApi.markAllRead()
            set(s => ({ notifs: s.notifs.map(n => ({ ...n, read: true })), unread: 0 }))
        } catch { }
    },

    // Called by socket when a new notification arrives
    push: (notif) => set(s => ({
        notifs: [notif, ...s.notifs].slice(0, 50),
        unread: s.unread + 1,
    })),

    // Remove a notification from local state (after auto-TTL or manual dismiss)
    remove: (id) => set(s => ({
        notifs: s.notifs.filter(n => n._id !== id),
    })),
}))

export default useNotifStore
