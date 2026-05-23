import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
            <div className="text-center max-w-sm animate-slide-up">
                <div className="font-display text-[7rem] sm:text-[9rem] font-bold text-slate-200 leading-none select-none">404</div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mt-2">Page not found</h1>
                <p className="text-slate-500 mt-2 text-sm">The page you're looking for doesn't exist or has been moved.</p>
                <div className="flex justify-center gap-3 mt-6">
                    <button onClick={() => window.history.back()} className="btn-ghost btn btn-sm"><ArrowLeft className="h-4 w-4" /> Go back</button>
                    <Link to="/" className="btn-primary btn btn-sm"><Home className="h-4 w-4" /> Home</Link>
                </div>
            </div>
        </div>
    )
}
