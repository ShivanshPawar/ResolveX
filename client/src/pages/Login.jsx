import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { ErrorAlert, Spinner } from '../components/ui/index'
import { getErr } from '../utils/helpers'
import { toast } from 'react-toastify'
import Logo from '../assets/Logo.svg'


export default function Login() {
    const [f, setF] = useState({ email: '', password: '' })
    const [show, setShow] = useState(false)
    const [busy, setBusy] = useState(false)
    const [err, setErr] = useState('')
    const { login } = useAuthStore()
    const nav = useNavigate()
    const loc = useLocation()
    const from = loc.state?.from?.pathname || '/dashboard'

    const submit = async (e) => {
        e.preventDefault(); setErr(''); setBusy(true)
        try {
            const u = await login(f)
            toast.success(`Welcome back, ${u.fullName.split(' ')[0]}!`)
            nav(['admin', 'moderator'].includes(u.role) ? '/admin' : from, { replace: true })
        } catch (e) { setErr(getErr(e)) }
        finally { setBusy(false) }
    }

    return (
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-sm animate-slide-up">
                <div className="text-center mb-7">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-800 mb-4 shadow-lg overflow-auto">
                        <img className='w-full h-full' src={Logo} alt="Logo" srcset="" />
                    </div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">Welcome back</h1>
                    <p className="text-slate-500 mt-1 text-sm">Sign in to manage your civic issues</p>
                </div>
                <div className="card p-6 sm:p-8 shadow-lg">
                    <form onSubmit={submit} className="space-y-4">
                        <ErrorAlert message={err} />
                        <div className="field">
                            <label className="label" htmlFor="email">Email address</label>
                            <input id="email" type="email" className="input" placeholder="johndoe@gmail.com"
                                value={f.email} onChange={e => setF({ ...f, email: e.target.value })} required autoComplete="email" />
                        </div>
                        <div className="field">
                            <label className="label" htmlFor="pw">Password</label>
                            <div className="relative">
                                <input id="pw" type={show ? 'text' : 'password'} className="input pr-10" placeholder="Your password"
                                    value={f.password} onChange={e => setF({ ...f, password: e.target.value })} required autoComplete="current-password" />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShow(!show)}>
                                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="btn-primary btn w-full btn-lg mt-1" disabled={busy}>
                            {busy ? <Spinner size="sm" /> : 'Log in'}
                        </button>
                    </form>
                    <p className="text-center text-sm text-slate-500 mt-5">
                        Don't have an account? <Link to="/register" className="font-semibold text-primary-800 hover:underline">create one</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
