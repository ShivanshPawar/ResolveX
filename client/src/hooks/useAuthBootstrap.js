import { useEffect } from 'react'
import useAuthStore from '../store/authStore'

export function useAuthBootstrap() {
  const init = useAuthStore((state) => state.init)

  useEffect(() => {
    init()
  }, [init])
}
