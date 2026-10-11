import { useState, useEffect } from 'react'
export function useDebounce(val, ms = 400) {
  const [dv, setDv] = useState(val)
  useEffect(() => {
    const t = setTimeout(() => setDv(val), ms)
    return () => clearTimeout(t)
  }, [val, ms])
  return dv
}
