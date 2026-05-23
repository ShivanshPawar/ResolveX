import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '../../components/layout/Layout'
import { CitizenOnly, GuestOnly, RequireAuth, RequireMod } from '../../components/RouteGuards'
import AdminPanel from '../../pages/AdminPanel'
import AnalyticsPage from '../../pages/AnalyticsPage'
import CreateIssue from '../../pages/CreateIssue'
import IssueDetail from '../../pages/IssueDetail'
import IssuesPage from '../../pages/IssuesPage'
import Landing from '../../pages/Landing'
import Login from '../../pages/Login'
import NotFound from '../../pages/NotFound'
import NotificationsPage from '../../pages/NotificationsPage'
import Profile from '../../pages/Profile'
import Register from '../../pages/Register'

export default function AppRoutes() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/issues" element={<IssuesPage />} />
                <Route path="/issues/:id" element={<IssueDetail />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
                <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

                <Route path="/dashboard" element={<RequireAuth><Navigate to="/issues" replace /></RequireAuth>} />
                <Route path="/issues/new" element={<CitizenOnly><CreateIssue /></CitizenOnly>} />
                <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />

                <Route path="/admin" element={<RequireMod><AdminPanel /></RequireMod>} />
                <Route path="/admin/analytics" element={<RequireMod><AnalyticsPage /></RequireMod>} />

                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    )
}
