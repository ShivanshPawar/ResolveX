import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

// These pages get full-width treatment (landing, auth)
const FULL_WIDTH = ['/', '/login', '/register']

// Sidebar hidden ONLY on landing & auth pages
const NO_SIDEBAR = ['/', '/login', '/register']

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('rx-sidebar-collapsed') === 'true'
    } catch {
      return false
    }
  })
  const { pathname } = useLocation()

  const showSidebar = !NO_SIDEBAR.includes(pathname)
  const showMobileDrawer = mobileOpen

  useEffect(() => {
    try {
      localStorage.setItem('rx-sidebar-collapsed', String(collapsed))
    } catch {
      // Sidebar preference is optional when storage is unavailable.
    }
  }, [collapsed])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const ml = showSidebar ? (collapsed ? 'lg:ml-16' : 'lg:ml-56') : ''

  return (
    <div className="min-h-screen bg-slate-50 ">
      <Navbar onMenu={() => setMobileOpen((isOpen) => !isOpen)} menuOpen={mobileOpen} />

      <div className="flex">
        {(showSidebar || showMobileDrawer) && (
          <Sidebar
            open={mobileOpen}
            collapsed={showSidebar ? collapsed : false}
            mobileOnly={!showSidebar}
            onClose={() => setMobileOpen(false)}
            onToggleCollapse={() => setCollapsed((c) => !c)}
          />
        )}

        <main className={`flex-1 min-w-0 transition-all duration-250 ${ml}`}>
          {FULL_WIDTH.includes(pathname) ? (
            <Outlet />
          ) : (
            <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-6xl mx-auto">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
