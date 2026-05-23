import { BrowserRouter } from 'react-router-dom'
import ToastProvider from '../../components/notifications/ToastProvider'
import AppLifecycle from '../lifecycle/AppLifecycle'

export default function AppProviders({ children }) {
    return (
        <>
            <AppLifecycle />
            <BrowserRouter>
                <ToastProvider />
                {children}
            </BrowserRouter>
        </>
    )
}
