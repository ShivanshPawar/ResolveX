import { useAuthBootstrap } from '../../hooks/useAuthBootstrap'
import { useAuthExpiredHandler } from '../../hooks/useAuthExpiredHandler'
import { useNotificationSocket } from '../../hooks/useNotificationSocket'

export default function AppLifecycle() {
  useAuthBootstrap()
  useAuthExpiredHandler()
  useNotificationSocket()

  return null
}
