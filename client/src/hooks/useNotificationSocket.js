import { useEffect } from 'react'
import { toast } from 'react-toastify'
import { connectSocket, disconnectSocket } from '../socket/index'
import useAuthStore from '../store/authStore'
import useNotifStore from '../store/notifStore'

function showNotificationToast(notification) {
  const message =
    notification?.payload?.message || notification?.type?.replace(/_/g, ' ') || 'New notification'
  const options = { autoClose: 5000, ...(notification?._id ? { toastId: notification._id } : {}) }

  if (notification?.type === 'issue_deleted') {
    toast.warn(message, options)
    return
  }
  if (notification?.type === 'issue_comment' || notification?.type === 'issue_upvote') {
    toast.success(message, options)
    return
  }
  toast.info(message, options)
}

export function useNotificationSocket() {
  const user = useAuthStore((state) => state.user)
  const pushNotification = useNotifStore((state) => state.push)

  useEffect(() => {
    if (!user) {
      disconnectSocket()
      return undefined
    }

    const socket = connectSocket()
    const handleNotification = (notification) => {
      pushNotification(notification)
      showNotificationToast(notification)
    }

    socket.on('notification:new', handleNotification)

    return () => {
      socket.off('notification:new', handleNotification)
    }
  }, [user, pushNotification])
}
