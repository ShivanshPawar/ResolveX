import { Component, lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '../../components/layout/Layout'
import { CitizenOnly, GuestOnly, RequireAuth, RequireMod } from '../../components/RouteGuards'
import { PageLoader } from '../../components/ui/index'

const AdminPanel = lazy(() => import('../../pages/AdminPanel'))
const AnalyticsPage = lazy(() => import('../../pages/AnalyticsPage'))
const CreateIssue = lazy(() => import('../../pages/CreateIssue'))
const IssueDetail = lazy(() => import('../../pages/IssueDetail'))
const IssuesPage = lazy(() => import('../../pages/IssuesPage'))
const Landing = lazy(() => import('../../pages/Landing'))
const Login = lazy(() => import('../../pages/Login'))
const NotFound = lazy(() => import('../../pages/NotFound'))
const NotificationsPage = lazy(() => import('../../pages/NotificationsPage'))
const Profile = lazy(() => import('../../pages/Profile'))
const Register = lazy(() => import('../../pages/Register'))

class RouteLoadErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-64 flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-sm text-slate-600">This page could not be loaded.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

function LazyPage({ children }) {
  return (
    <RouteLoadErrorBoundary>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </RouteLoadErrorBoundary>
  )
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/"
          element={
            <LazyPage>
              <Landing />
            </LazyPage>
          }
        />
        <Route
          path="/issues"
          element={
            <LazyPage>
              <IssuesPage />
            </LazyPage>
          }
        />
        <Route
          path="/issues/:id"
          element={
            <LazyPage>
              <IssueDetail />
            </LazyPage>
          }
        />
        <Route
          path="/analytics"
          element={
            <LazyPage>
              <AnalyticsPage />
            </LazyPage>
          }
        />
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LazyPage>
                <Login />
              </LazyPage>
            </GuestOnly>
          }
        />
        <Route
          path="/register"
          element={
            <GuestOnly>
              <LazyPage>
                <Register />
              </LazyPage>
            </GuestOnly>
          }
        />

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Navigate to="/issues" replace />
            </RequireAuth>
          }
        />
        <Route
          path="/issues/new"
          element={
            <CitizenOnly>
              <LazyPage>
                <CreateIssue />
              </LazyPage>
            </CitizenOnly>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <LazyPage>
                <Profile />
              </LazyPage>
            </RequireAuth>
          }
        />
        <Route
          path="/notifications"
          element={
            <RequireAuth>
              <LazyPage>
                <NotificationsPage />
              </LazyPage>
            </RequireAuth>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireMod>
              <LazyPage>
                <AdminPanel />
              </LazyPage>
            </RequireMod>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <RequireMod>
              <LazyPage>
                <AnalyticsPage />
              </LazyPage>
            </RequireMod>
          }
        />

        <Route
          path="*"
          element={
            <LazyPage>
              <NotFound />
            </LazyPage>
          }
        />
      </Route>
    </Routes>
  )
}
